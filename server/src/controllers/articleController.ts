import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

// Interface for our Article structure
export interface Article {
  id?: string;
  title: string;
  authorId: string;
  content: any[]; // Array of content blocks (e.g., { type: 'paragraph', text: '...' })
  imageUrl?: string;
  imageCaption?: string;
  category?: string; // <-- Added category
  tags?: string[];
  techTags?: string[];
  isHotContent?: boolean;
  createdAt: Date;
}

const db = getDb();
const articlesCollection = db.collection('articles');

/**
 * @description Create a new article
 * @route POST /api/articles
 */
export const createArticle = async (req: Request, res: Response) => {
  try {
    // --- UPDATED: Added imageCaption and category ---
    const {
      title,
      content,
      imageUrl,
      imageCaption,
      authorId,
      category,
      tags = [],
      techTags = [],
      isHotContent = false,
    } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];
    const normalizedTechTags = Array.isArray(techTags)
      ? techTags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];
    const legacyHotContent =
      typeof category === 'string' && category.trim() === 'hotContent';
    const persistedCategory = legacyHotContent ? '' : category;

    const newArticle: Omit<Article, 'id'> = {
      title,
      authorId,
      content,
      imageUrl,
      imageCaption,
      category: persistedCategory, // <-- Added category
      tags: normalizedTags,
      techTags: normalizedTechTags,
      isHotContent: Boolean(isHotContent) || legacyHotContent,
      createdAt: new Date(),
    };

    const docRef = await articlesCollection.add(newArticle);

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
      content,
      imageUrl,
      imageCaption,
      authorId,
      category,
      tags = [],
      techTags = [],
      isHotContent = false,
    } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];
    const normalizedTechTags = Array.isArray(techTags)
      ? techTags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];
    const legacyHotContent =
      typeof category === 'string' && category.trim() === 'hotContent';
    const persistedCategory = legacyHotContent ? '' : category;

    const updatedArticle = {
      title,
      authorId,
      content,
      imageUrl,
      imageCaption,
      category: persistedCategory,
      tags: normalizedTags,
      techTags: normalizedTechTags,
      isHotContent: Boolean(isHotContent) || legacyHotContent,
      updatedAt: new Date(),
    };

    await articlesCollection.doc(id).update(updatedArticle);

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

    await articlesCollection.doc(id).delete();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ message: 'Server error while deleting article' });
  }
};
