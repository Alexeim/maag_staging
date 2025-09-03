import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

// Interface for our Article structure
export interface Article {
  id?: string;
  title: string;
  content: string;
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
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const newArticle: Omit<Article, 'id'> = {
      title,
      content,
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
        const doc = await articlesCollection.doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Article not found' });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error getting article by id:', error);
        res.status(500).json({ message: 'Server error while getting article' });
    }
};
