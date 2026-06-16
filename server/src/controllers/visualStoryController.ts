import { Request, Response } from 'express';
import { getDb, deleteFileFromStorage } from '../services/firebase';
import { normalizeRelatedContent, type RelatedContent } from '../utils/relatedContent';
import {
  normalizeContentCollectionId,
  syncSingleContentCollectionMembershipInTransaction,
} from '../utils/contentCollections';
import {
  buildPublicationFieldsForCreate,
  buildPublicationFieldsForUpdate,
} from '../utils/publication';

export interface VisualStory {
  id?: string;
  title: string;
  authorId: string;
  slides: Array<{
    imageUrl: string;
    contentType?: 'text' | 'quote';
    text: string;
    caption?: string;
    quote?: string;
    quoteAuthor?: string;
  }>;
  imageUrl?: string;
  imageCaption?: string;
  lead?: string;
  cardLead?: string;
  category?: string;
  tags?: string[];
  parisSubCategories?: string[];
  parisDistrict?: string | null;
  isHotContent?: boolean;
  paid?: boolean;
  published: boolean;
  publishedAt: Date | null;
  relatedContent?: RelatedContent;
  contentCollectionId?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

const db = getDb();
const collection = db.collection('visual-stories');
const contentCollectionsCollection = db.collection('contentCollections');

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((item: unknown) => String(item).trim()).filter(Boolean)
    : [];

const normalizeCategory = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  return trimmed === 'hotContent' ? '' : trimmed;
};

const normalizeSlides = (slides: unknown): VisualStory['slides'] =>
  Array.isArray(slides)
    ? slides
        .filter((slide: unknown) => slide && typeof slide === 'object' && (slide as Record<string, unknown>).imageUrl)
        .map((slide: unknown) => {
          const raw = slide as Record<string, unknown>;
          return {
            imageUrl: String(raw.imageUrl),
            contentType: raw.contentType === 'quote' ? 'quote' : 'text',
            text: String(raw.text ?? ''),
            caption: String(raw.caption ?? ''),
            quote: String(raw.quote ?? ''),
            quoteAuthor: String(raw.quoteAuthor ?? ''),
          };
        })
    : [];

const buildVisualStoryPayload = (body: Record<string, unknown>) => {
  const {
    title,
    authorId,
    slides = [],
    imageUrl,
    imageCaption,
    lead,
    cardLead,
    category,
    tags = [],
    parisSubCategories = [],
    parisDistrict,
    isHotContent = false,
    paid = false,
    relatedContent,
    contentCollectionId,
  } = body;

  return {
    title: typeof title === 'string' ? title : '',
    authorId: typeof authorId === 'string' ? authorId : '',
    slides: normalizeSlides(slides),
    imageUrl: typeof imageUrl === 'string' ? imageUrl : '',
    imageCaption: typeof imageCaption === 'string' ? imageCaption : '',
    lead: typeof lead === 'string' ? lead : '',
    cardLead: typeof cardLead === 'string' ? cardLead : '',
    category: normalizeCategory(category),
    tags: normalizeStringArray(tags),
    parisSubCategories: normalizeStringArray(parisSubCategories),
    parisDistrict:
      typeof parisDistrict === 'string'
        ? parisDistrict.trim() || null
        : null,
    isHotContent: Boolean(isHotContent),
    paid: Boolean(paid),
    relatedContent: normalizeRelatedContent(relatedContent),
    contentCollectionId: normalizeContentCollectionId(contentCollectionId),
  };
};

export const createVisualStory = async (req: Request, res: Response) => {
  try {
    const payload = buildVisualStoryPayload(req.body);

    if (!payload.title || !payload.authorId) {
      return res.status(400).json({ message: 'Title and authorId are required' });
    }

    if (!payload.slides.length) {
      return res.status(400).json({ message: 'At least one slide is required' });
    }

    const now = new Date();
    const newStory: Omit<VisualStory, 'id'> = {
      ...payload,
      ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
      ...buildPublicationFieldsForCreate(req.body, now),
      createdAt: now,
    };

    const docRef = collection.doc();

    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: null,
        nextCollectionId: newStory.contentCollectionId ?? null,
        contentType: 'visualStory',
        materialId: docRef.id,
        now,
      });
      transaction.set(docRef, newStory);
    });

    res.status(201).json({ id: docRef.id, ...newStory });
  } catch (error) {
    console.error('Error creating visual story:', error);
    res.status(500).json({ message: 'Server error while creating visual story' });
  }
};

export const getVisualStories = async (req: Request, res: Response) => {
  try {
    const snapshot = await collection.orderBy('createdAt', 'desc').get();
    if (snapshot.empty) return res.status(200).json([]);

    const stories: VisualStory[] = [];
    snapshot.forEach(doc => {
      stories.push({ id: doc.id, ...doc.data() } as VisualStory);
    });

    res.status(200).json(stories);
  } catch (error) {
    console.error('Error getting visual stories:', error);
    res.status(500).json({ message: 'Server error while getting visual stories' });
  }
};

export const getVisualStoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Visual story not found' });
    }

    const storyData = doc.data() as VisualStory;

    let authorData = null;
    if (storyData.authorId) {
      const authorDoc = await db.collection('authors').doc(storyData.authorId).get();
      if (authorDoc.exists) authorData = authorDoc.data();
    }

    res.status(200).json({ id: doc.id, ...storyData, author: authorData });
  } catch (error) {
    console.error('Error getting visual story by id:', error);
    res.status(500).json({ message: 'Server error while getting visual story' });
  }
};

export const updateVisualStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Visual story not found' });
    }

    const payload = buildVisualStoryPayload(req.body);

    if (!payload.title || !payload.authorId) {
      return res.status(400).json({ message: 'Title and authorId are required' });
    }

    const now = new Date();
    const updated = {
      ...payload,
      ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
      ...buildPublicationFieldsForUpdate(req.body, doc.data(), now),
      updatedAt: now,
    };

    const previousContentCollectionId = normalizeContentCollectionId(
      doc.data()?.contentCollectionId,
    );
    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: previousContentCollectionId,
        nextCollectionId: updated.contentCollectionId ?? null,
        contentType: 'visualStory',
        materialId: id,
        now,
      });
      transaction.update(collection.doc(id), updated);
    });

    res.status(200).json({ id, ...doc.data(), ...updated });
  } catch (error) {
    console.error('Error updating visual story:', error);
    res.status(500).json({ message: 'Server error while updating visual story' });
  }
};

export const deleteVisualStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Visual story not found' });
    }

    const storyData = doc.data() as VisualStory;
    const previousContentCollectionId = normalizeContentCollectionId(
      storyData.contentCollectionId,
    );
    const imageUrls: string[] = Array.isArray(storyData.slides)
      ? storyData.slides.map(s => s.imageUrl).filter(Boolean)
      : [];

    if (imageUrls.length > 0) {
      await Promise.all(imageUrls.map(url => deleteFileFromStorage(url)));
    }

    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: previousContentCollectionId,
        nextCollectionId: null,
        contentType: 'visualStory',
        materialId: id,
        now: new Date(),
      });
      transaction.delete(collection.doc(id));
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting visual story:', error);
    res.status(500).json({ message: 'Server error while deleting visual story' });
  }
};
