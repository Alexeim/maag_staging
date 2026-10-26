/** Translate remaining Russian articles, preserving existing French versions. */
import { getDb } from '../services/firebase';
import { createFrenchTranslation, planArticleTranslation } from '../services/articleTranslationStore';
import { FR_BY_SOURCE_COLLECTION, FR_COLLECTION } from '../services/articlesFr';
import { computeSourceRevision, extractArticleSegments } from '../services/articleTranslation';
import type { Article } from '../controllers/articleController';

const apply = process.argv.includes('--apply');

const verify = async (): Promise<void> => {
  const db = getDb();
  const [sources, translations, locks] = await Promise.all([
    db.collection('articles').get(),
    db.collection(FR_COLLECTION).get(),
    db.collection(FR_BY_SOURCE_COLLECTION).get(),
  ]);
  const lockBySource = new Map(locks.docs.map((doc) => [doc.id, doc.data().translationId as unknown]));
  const problems: string[] = [];
  for (const source of sources.docs) {
    const matches = translations.docs.filter((doc) => doc.data().sourceId === source.id);
    if (matches.length !== 1) {
      problems.push(`${source.id}: ${matches.length} French versions`);
      continue;
    }
    const translation = matches[0];
    const french = translation.data();
    if (lockBySource.get(source.id) !== translation.id) problems.push(`${source.id}: broken lookup`);
    const original = source.data() as Article;
    const sourceSegments = extractArticleSegments(original).segments;
    const translatedKeys = new Set(extractArticleSegments(french).segments.map((segment) => segment.key));
    const missing = sourceSegments.filter((segment) => !translatedKeys.has(segment.key));
    if (missing.length > 0) problems.push(`${source.id}: missing fields ${missing.map((s) => s.key).join(', ')}`);
    if (french.sourceRevision !== computeSourceRevision(sourceSegments)) {
      problems.push(`${source.id}: source changed since translation`);
    }
    if (!Array.isArray(french.content) || french.content.length !== (original.content ?? []).length) {
      problems.push(`${source.id}: block count mismatch`);
    }
  }
  console.log(JSON.stringify({ sources: sources.size, translations: translations.size,
    lookups: locks.size, problems }, null, 2));
  if (problems.length > 0) throw new Error('French article verification failed');
};

const run = async (): Promise<void> => {
  if (process.argv.includes('--verify')) return verify();
  const articles = await getDb().collection('articles').get();
  const plans = [];
  for (const doc of articles.docs) {
    const plan = await planArticleTranslation(doc.id);
    if (plan.existingTranslationId) continue;
    plans.push(plan);
    console.log(JSON.stringify({
      id: plan.sourceId, title: plan.title, published: plan.published,
      characters: plan.characters, unknownBlockTypes: plan.unknownBlockTypes,
    }));
  }
  console.log(JSON.stringify({ mode: apply ? 'APPLY' : 'DRY RUN', remaining: plans.length,
    characters: plans.reduce((sum, plan) => sum + plan.characters, 0) }));
  if (plans.some((plan) => plan.unknownBlockTypes.length > 0)) {
    throw new Error('Unknown block types: review before translating. Nothing was written.');
  }
  if (!apply) return;
  // Sequential calls bound provider load. Restarting skips completed articles.
  for (const plan of plans) {
    const result = await createFrenchTranslation(plan.sourceId);
    console.log(JSON.stringify({ sourceId: plan.sourceId, ...result }));
  }
  await verify();
};

run().then(() => process.exit(0)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
