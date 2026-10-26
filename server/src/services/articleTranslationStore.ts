import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from './firebase';
import type { Article } from '../controllers/articleController';
import {
  buildTranslatedArticleText,
  computeSourceRevision,
  extractArticleSegments,
  type TranslationSegment,
} from './articleTranslation';
import { translateSegments } from './googleTranslate';
import { FR_BY_SOURCE_COLLECTION, FR_COLLECTION } from './articlesFr';

// The lock document articles_fr_by_source/{sourceId} is created with
// transaction.create, which fails if it already exists: one translation per
// article.

export interface TranslationPlan {
  sourceId: string;
  title: string;
  published: boolean;
  segments: TranslationSegment[];
  unknownBlockTypes: string[];
  characters: number;
  sourceRevision: string;
  existingTranslationId: string | null;
}

// Read-only: what a translation of this article would send.
export const planArticleTranslation = async (sourceId: string): Promise<TranslationPlan> => {
  const db = getDb();
  const [articleDoc, lockDoc] = await Promise.all([
    db.collection('articles').doc(sourceId).get(),
    db.collection(FR_BY_SOURCE_COLLECTION).doc(sourceId).get(),
  ]);
  if (!articleDoc.exists) {
    throw new Error(`Article ${sourceId} not found`);
  }
  const article = articleDoc.data() as Article;
  const { segments, unknownBlockTypes } = extractArticleSegments(article);
  return {
    sourceId,
    title: article.title,
    published: article.published === true,
    segments,
    unknownBlockTypes,
    characters: segments.reduce((sum, segment) => sum + segment.source.length, 0),
    sourceRevision: computeSourceRevision(segments),
    existingTranslationId: lockDoc.exists ? String(lockDoc.data()?.translationId ?? '') : null,
  };
};

export interface CreatedTranslation {
  translationId: string;
  requests: number;
  characters: number;
}

// Translates the article and stores the French version, unpublished. Refuses
// if the article already has one (re-translation is a separate flow).
export const createFrenchTranslation = async (sourceId: string): Promise<CreatedTranslation> => {
  const plan = await planArticleTranslation(sourceId);
  if (plan.existingTranslationId) {
    throw new Error(
      `Article ${sourceId} already has a French version: ${plan.existingTranslationId}`,
    );
  }

  const db = getDb();
  const articleDoc = await db.collection('articles').doc(sourceId).get();
  const article = articleDoc.data() as Article;

  // The paid call happens outside the transaction (transactions may retry).
  const run = await translateSegments(plan.segments, { source: 'ru', target: 'fr' });
  const text = buildTranslatedArticleText(article, run.translations);

  const frRef = db.collection(FR_COLLECTION).doc();
  const lockRef = db.collection(FR_BY_SOURCE_COLLECTION).doc(sourceId);
  await db.runTransaction((transaction) => {
    // Throws ALREADY_EXISTS if another run got here first.
    transaction.create(lockRef, {
      translationId: frRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.create(frRef, {
      ...text,
      sourceId,
      sourceLocale: 'ru',
      locale: 'fr',
      sourceRevision: plan.sourceRevision,
      published: false,
      publishedAt: null,
      reviewStatus: 'machine',
      provider: run.provider,
      model: run.model,
      location: run.location,
      translatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return Promise.resolve();
  });

  return { translationId: frRef.id, requests: run.requests, characters: run.characters };
};
