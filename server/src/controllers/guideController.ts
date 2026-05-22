import { Request, Response } from 'express';
import { getDb, deleteFileFromStorage } from '../services/firebase';
import { normalizeRelatedContent, type RelatedContent } from '../utils/relatedContent';
import {
  normalizeContentCollectionId,
  syncSingleContentCollectionMembershipInTransaction,
} from '../utils/contentCollections';

export interface Guide {
  id?: string;
  title: string;
  lead?: string;
  cardLead?: string;
  authorId: string;
  content: any[];
  tips?: Array<{ type: string; text: string }>;
  imageUrl?: string;
  imageCaption?: string;
  category?: string;
  tags?: string[];
  isHotContent?: boolean;
  isMainInCategory?: boolean;
  relatedContent?: RelatedContent;
  contentCollectionId?: string | null;
  createdAt: Date;
}

const db = getDb();
const guidesCollection = db.collection('guides');
const contentCollectionsCollection = db.collection('contentCollections');

const normalizeTips = (tips: unknown): Array<{ type: string; text: string }> => {
  if (!Array.isArray(tips)) {
    return [];
  }

  const deduped = new Set<string>();
  const normalized: Array<{ type: string; text: string }> = [];

  tips.forEach((rawTip) => {
    if (!rawTip || typeof rawTip !== 'object') {
      return;
    }
    const type = String((rawTip as { type?: unknown }).type ?? '').trim().toLowerCase();
    const text = String((rawTip as { text?: unknown }).text ?? '').trim();
    if (!type || !text || deduped.has(type)) {
      return;
    }
    deduped.add(type);
    normalized.push({ type, text });
  });

  return normalized;
};

/**
 * @description Create a new guide
 * @route POST /api/guides
 */
export const createGuide = async (req: Request, res: Response) => {
  try {
    const {
      title,
      lead,
      cardLead,
      content,
      tips = [],
      imageUrl,
      imageCaption,
      authorId,
      category,
      tags = [],
      isHotContent = false,
      isMainInCategory = false,
      relatedContent,
      contentCollectionId,
    } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];
    const normalizedTipsData = normalizeTips(tips);
    const legacyHotContent =
      typeof category === 'string' && category.trim() === 'hotContent';
    const persistedCategory = legacyHotContent ? '' : category;

    const now = new Date();
    const docRef = guidesCollection.doc();
    const newGuide: Omit<Guide, 'id'> = {
      title,
      lead: lead || '',
      cardLead: cardLead || '',
      authorId,
      content,
      tips: normalizedTipsData,
      imageUrl,
      imageCaption,
      category: persistedCategory,
      tags: normalizedTags,
      isHotContent: Boolean(isHotContent) || legacyHotContent,
      isMainInCategory: Boolean(isMainInCategory),
      relatedContent: normalizeRelatedContent(relatedContent),
      contentCollectionId: normalizeContentCollectionId(contentCollectionId),
      createdAt: now,
    };

    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: null,
        nextCollectionId: newGuide.contentCollectionId ?? null,
        contentType: 'guide',
        materialId: docRef.id,
        now,
      });
      transaction.set(docRef, newGuide);
    });

    res.status(201).json({ id: docRef.id, ...newGuide });
  } catch (error) {
    console.error('Error creating guide:', error);
    res.status(500).json({ message: 'Server error while creating guide' });
  }
};

/**
 * @description Get all guides
 * @route GET /api/guides
 */
export const getGuides = async (req: Request, res: Response) => {
  try {
    const snapshot = await guidesCollection.orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const guides: Guide[] = [];
    snapshot.forEach(doc => {
      guides.push({ id: doc.id, ...doc.data() } as Guide);
    });

    res.status(200).json(guides);
  } catch (error) {
    console.error('Error getting guides:', error);
    res.status(500).json({ message: 'Server error while getting guides' });
  }
};

/**
 * @description Get a single guide by ID
 * @route GET /api/guides/:id
 */
export const getGuideById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const guideDoc = await guidesCollection.doc(id).get();

    if (!guideDoc.exists) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    const guideData = guideDoc.data() as Guide;

    let authorData = null;
    if (guideData.authorId) {
      const userDoc = await db.collection('authors').doc(guideData.authorId).get();
      if (userDoc.exists) {
        authorData = userDoc.data();
      }
    }

    const guideWithAuthor = {
      id: guideDoc.id,
      ...guideData,
      author: authorData,
    };

    res.status(200).json(guideWithAuthor);
  } catch (error) {
    console.error('Error getting guide by id:', error);
    res.status(500).json({ message: 'Server error while getting guide' });
  }
};

/**
 * @description Update a guide
 * @route PUT /api/guides/:id
 */
export const updateGuide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const guideDoc = await guidesCollection.doc(id).get();

    if (!guideDoc.exists) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    const {
      title,
      lead,
      cardLead,
      content,
      tips = [],
      imageUrl,
      imageCaption,
      authorId,
      category,
      tags = [],
      isHotContent = false,
      isMainInCategory = false,
      relatedContent,
      contentCollectionId,
    } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];
    const normalizedTipsData = normalizeTips(tips);
    const legacyHotContent =
      typeof category === 'string' && category.trim() === 'hotContent';
    const persistedCategory = legacyHotContent ? '' : category;

    const previousContentCollectionId = normalizeContentCollectionId(
      guideDoc.data()?.contentCollectionId,
    );
    const now = new Date();
    const updatedGuide = {
      title,
      lead: lead || '',
      cardLead: cardLead || '',
      authorId,
      content,
      tips: normalizedTipsData,
      imageUrl,
      imageCaption,
      category: persistedCategory,
      tags: normalizedTags,
      isHotContent: Boolean(isHotContent) || legacyHotContent,
      isMainInCategory: Boolean(isMainInCategory),
      relatedContent: normalizeRelatedContent(relatedContent),
      contentCollectionId: normalizeContentCollectionId(contentCollectionId),
      updatedAt: now,
    };

    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: previousContentCollectionId,
        nextCollectionId: updatedGuide.contentCollectionId ?? null,
        contentType: 'guide',
        materialId: id,
        now,
      });
      transaction.update(guidesCollection.doc(id), updatedGuide);
    });

    res.status(200).json({ id, ...guideDoc.data(), ...updatedGuide });
  } catch (error) {
    console.error('Error updating guide:', error);
    res.status(500).json({ message: 'Server error while updating guide' });
  }
};

/**
 * @description Delete a guide
 * @route DELETE /api/guides/:id
 */
export const deleteGuide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const guideDoc = await guidesCollection.doc(id).get();

    if (!guideDoc.exists) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    const guideData = guideDoc.data() as Guide;
    const imageUrlsToDelete: string[] = [];
    const previousContentCollectionId = normalizeContentCollectionId(
      guideData.contentCollectionId,
    );

    if (guideData.imageUrl) {
      imageUrlsToDelete.push(guideData.imageUrl);
    }

    if (Array.isArray(guideData.content)) {
      for (const block of guideData.content) {
        if (block.type === 'image' && block.url) {
          imageUrlsToDelete.push(block.url);
        }
        if (block.type === 'tips-item' && block.imageUrl) {
          imageUrlsToDelete.push(block.imageUrl);
        }
      }
    }

    if (imageUrlsToDelete.length > 0) {
      console.log(`[Guide Delete] Deleting ${imageUrlsToDelete.length} associated images.`);
      await Promise.all(imageUrlsToDelete.map(url => deleteFileFromStorage(url)));
    }

    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: previousContentCollectionId,
        nextCollectionId: null,
        contentType: 'guide',
        materialId: id,
        now: new Date(),
      });
      transaction.delete(guidesCollection.doc(id));
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting guide:', error);
    res.status(500).json({ message: 'Server error while deleting guide' });
  }
};
