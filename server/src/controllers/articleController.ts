import { Request, Response } from 'express';
import { getDb, deleteFileFromStorage } from '../services/firebase';
import { normalizeRelatedContent, type RelatedContent } from '../utils/relatedContent';
import {
  normalizeContentCollectionId,
  syncSingleContentCollectionMembershipInTransaction,
} from '../utils/contentCollections';

// Interface for our Article structure
export interface Article {
  id?: string;
  title: string;
  lead?: string; // Вводка — краткое описание под заголовком
  cardLead?: string;
  authorId: string;
  articleType?: 'standard' | 'tips' | 'le_saviez_vous'; // Type of article layout
  content: any[]; // Array of content blocks (e.g., { type: 'paragraph', text: '...' })
  tips?: Array<{ type: string; text: string; url?: string }>;
  imageUrl?: string;
  imageCaption?: string;
  category?: string; // <-- Added category
  tags?: string[];
  isHotContent?: boolean;
  isMainInCategory?: boolean;
  isNews?: boolean;
  paid?: boolean;
  relatedContent?: RelatedContent;
  contentCollectionId?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

const db = getDb();
const articlesCollection = db.collection('articles');
const contentCollectionsCollection = db.collection('contentCollections');

const normalizeArticleType = (
  value: unknown,
): 'standard' | 'tips' | 'le_saviez_vous' => {
  if (value === 'tips') {
    return 'tips';
  }
  if (value === 'le_saviez_vous') {
    return 'le_saviez_vous';
  }
  return 'standard';
};

const normalizeTips = (tips: unknown): Array<{ type: string; text: string; url?: string }> => {
  if (!Array.isArray(tips)) {
    return [];
  }

  const deduped = new Set<string>();
  const normalized: Array<{ type: string; text: string; url?: string }> = [];

  tips.forEach((rawTip) => {
    if (!rawTip || typeof rawTip !== 'object') {
      return;
    }
    const type = String((rawTip as { type?: unknown }).type ?? '').trim().toLowerCase();
    const text = String((rawTip as { text?: unknown }).text ?? '').trim();
    if (!type || !text || deduped.has(type)) {
      return;
    }
    const url =
      type === 'link' && typeof (rawTip as { url?: unknown }).url === 'string'
        ? String((rawTip as { url?: string }).url).trim()
        : undefined;
    deduped.add(type);
    normalized.push({ type, text, ...(url ? { url } : {}) });
  });

  return normalized;
};

/**
 * @description Create a new article
 * @route POST /api/articles
 */
export const createArticle = async (req: Request, res: Response) => {
  try {
    // --- UPDATED: Added imageCaption and category ---
    const {
      title,
      lead,
      cardLead,
      content,
      tips = [],
      imageUrl,
      imageCaption,
      authorId,
      articleType = 'standard',
      category,
      tags = [],
      isHotContent = false,
      isMainInCategory = false,
      isNews = false,
      paid = false,
      relatedContent,
      contentCollectionId,
    } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];
    const normalizedTips = normalizeTips(tips);
    const legacyHotContent =
      typeof category === 'string' && category.trim() === 'hotContent';
    const persistedCategory = legacyHotContent ? '' : category;
    const normalizedContentCollectionId =
      normalizeContentCollectionId(contentCollectionId);
    const now = new Date();
    const docRef = articlesCollection.doc();

    const newArticle: Omit<Article, 'id'> = {
      title,
      lead: lead || '',
      cardLead: cardLead || '',
      authorId,
      articleType: normalizeArticleType(articleType),
      content,
      tips: normalizedTips,
      imageUrl,
      imageCaption,
      category: persistedCategory,
      tags: normalizedTags,
      isHotContent: Boolean(isHotContent) || legacyHotContent,
      isMainInCategory: Boolean(isMainInCategory),
      isNews: Boolean(isNews),
      paid: Boolean(paid),
      relatedContent: normalizeRelatedContent(relatedContent),
      contentCollectionId: normalizedContentCollectionId,
      createdAt: now,
    };

    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: null,
        nextCollectionId: normalizedContentCollectionId,
        contentType: 'article',
        materialId: docRef.id,
        now,
      });
      transaction.set(docRef, newArticle);
    });

    res.status(201).json({ id: docRef.id, ...newArticle });

  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ message: 'Server error while creating article' });
  }
};

/**
 * @description Get all articles
 * @route GET /api/articles
 */
export const getArticles = async (req: Request, res: Response) => {
  try {
    const snapshot = await articlesCollection.orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const articles: Article[] = [];
    snapshot.forEach(doc => {
      articles.push({ id: doc.id, ...doc.data() } as Article);
    });

    res.status(200).json(articles);

  } catch (error) {
    console.error('Error getting articles:', error);
    res.status(500).json({ message: 'Server error while getting articles' });
  }
};

/**
 * @description Get a single article by ID
 * @route GET /api/articles/:id
 */
export const getArticleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const articleDoc = await articlesCollection.doc(id).get();

        if (!articleDoc.exists) {
            return res.status(404).json({ message: 'Article not found' });
        }

        const articleData = articleDoc.data() as Article;

        // Fetch author details
        let authorData = null;
        if (articleData.authorId) {
            const userDoc = await db.collection('authors').doc(articleData.authorId).get();
            if (userDoc.exists) {
                authorData = userDoc.data();
            }
        }

        const articleWithAuthor = {
            id: articleDoc.id,
            ...articleData,
            author: authorData // Add author data to the response
        };

        res.status(200).json(articleWithAuthor);
    } catch (error) {
        console.error('Error getting article by id:', error);
        res.status(500).json({ message: 'Server error while getting article' });
    }
};

/**
 * @description Update an article
 * @route PUT /api/articles/:id
 */
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const articleDoc = await articlesCollection.doc(id).get();

    if (!articleDoc.exists) {
      return res.status(404).json({ message: 'Article not found' });
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
      articleType = 'standard',
      category,
      tags = [],
      isHotContent = false,
      isMainInCategory = false,
      isNews = false,
      paid = false,
      relatedContent,
      contentCollectionId,
    } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];
    const normalizedTips = normalizeTips(tips);
    const legacyHotContent =
      typeof category === 'string' && category.trim() === 'hotContent';
    const persistedCategory = legacyHotContent ? '' : category;
    const normalizedContentCollectionId =
      normalizeContentCollectionId(contentCollectionId);
    const previousContentCollectionId = normalizeContentCollectionId(
      articleDoc.data()?.contentCollectionId,
    );
    const now = new Date();

    const updatedArticle = {
      title,
      lead: lead || '',
      cardLead: cardLead || '',
      authorId,
      articleType: normalizeArticleType(articleType),
      content,
      tips: normalizedTips,
      imageUrl,
      imageCaption,
      category: persistedCategory,
      tags: normalizedTags,
      isHotContent: Boolean(isHotContent) || legacyHotContent,
      isMainInCategory: Boolean(isMainInCategory),
      isNews: Boolean(isNews),
      paid: Boolean(paid),
      relatedContent: normalizeRelatedContent(relatedContent),
      contentCollectionId: normalizedContentCollectionId,
      updatedAt: now,
    };

    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: previousContentCollectionId,
        nextCollectionId: normalizedContentCollectionId,
        contentType: 'article',
        materialId: id,
        now,
      });
      transaction.update(articlesCollection.doc(id), updatedArticle);
    });

    res.status(200).json({ id, ...articleDoc.data(), ...updatedArticle });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ message: 'Server error while updating article' });
  }
};

/**
 * @description Delete an article
 * @route DELETE /api/articles/:id
 */
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const articleDoc = await articlesCollection.doc(id).get();

    if (!articleDoc.exists) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const articleData = articleDoc.data() as Article;
    const imageUrlsToDelete: string[] = [];
    const previousContentCollectionId = normalizeContentCollectionId(
      articleData.contentCollectionId,
    );

    // Collect main image URL
    if (articleData.imageUrl) {
      imageUrlsToDelete.push(articleData.imageUrl);
    }

    // Collect image URLs from content blocks
    if (Array.isArray(articleData.content)) {
      for (const block of articleData.content) {
        if (block.type === 'image' && block.url) {
          imageUrlsToDelete.push(block.url);
        }
        if (block.type === 'one-big-one-small') {
          if (block.portraitImageUrl) {
            imageUrlsToDelete.push(block.portraitImageUrl);
          }
          if (block.landscapeImageUrl) {
            imageUrlsToDelete.push(block.landscapeImageUrl);
          }
        }
        // tips-item blocks can have their own image per item
        if (block.type === 'tips-item' && block.imageUrl) {
          imageUrlsToDelete.push(block.imageUrl);
        }
      }
    }

    // Asynchronously delete all images from storage
    if (imageUrlsToDelete.length > 0) {
      console.log(`[Article Delete] Deleting ${imageUrlsToDelete.length} associated images.`);
      await Promise.all(imageUrlsToDelete.map(url => deleteFileFromStorage(url)));
    }

    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: previousContentCollectionId,
        nextCollectionId: null,
        contentType: 'article',
        materialId: id,
        now: new Date(),
      });
      transaction.delete(articlesCollection.doc(id));
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ message: 'Server error while deleting article' });
  }
};
