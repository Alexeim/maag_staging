import { Request, Response } from 'express';
import { getDb, deleteFileFromStorage } from '../services/firebase';

export interface NewsItem {
  id?: string;
  title: string;
  lead?: string;
  cardLead?: string;
  authorId: string;
  content: any[];
  imageUrl?: string;
  imageCaption?: string;
  category?: string;
  tags?: string[];
  techTags?: string[];
  isHotContent?: boolean;
  isOnLanding?: boolean;
  isMainInCategory?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

const db = getDb();
const newsCollection = db.collection('news');

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

const buildNewsPayload = (body: Record<string, unknown>) => {
  const {
    title,
    lead,
    cardLead,
    content,
    imageUrl,
    imageCaption,
    authorId,
    category,
    tags = [],
    techTags = [],
    isHotContent = false,
    isOnLanding = false,
    isMainInCategory = false,
  } = body;

  return {
    title: typeof title === 'string' ? title : '',
    lead: typeof lead === 'string' ? lead : '',
    cardLead: typeof cardLead === 'string' ? cardLead : '',
    authorId: typeof authorId === 'string' ? authorId : '',
    content: Array.isArray(content) ? content : [],
    imageUrl: typeof imageUrl === 'string' ? imageUrl : '',
    imageCaption: typeof imageCaption === 'string' ? imageCaption : '',
    category: normalizeCategory(category),
    tags: normalizeStringArray(tags),
    techTags: normalizeStringArray(techTags),
    isHotContent: Boolean(isHotContent) || category === 'hotContent',
    isOnLanding: Boolean(isOnLanding),
    isMainInCategory: Boolean(isMainInCategory),
  };
};

const withAuthor = async (newsDoc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) => {
  const newsData = newsDoc.data() as NewsItem | undefined;
  if (!newsData) {
    return null;
  }

  let authorData = null;
  if (newsData.authorId) {
    const authorDoc = await db.collection('authors').doc(newsData.authorId).get();
    if (authorDoc.exists) {
      authorData = authorDoc.data();
    }
  }

  return {
    id: newsDoc.id,
    ...newsData,
    author: authorData,
  };
};

export const createNews = async (req: Request, res: Response) => {
  try {
    const payload = buildNewsPayload(req.body);

    if (!payload.title || !payload.authorId || !payload.content) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const newNews: Omit<NewsItem, 'id'> = {
      ...payload,
      createdAt: new Date(),
    };

    const docRef = await newsCollection.add(newNews);
    res.status(201).json({ id: docRef.id, ...newNews });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ message: 'Server error while creating news' });
  }
};

export const getNews = async (_req: Request, res: Response) => {
  try {
    const snapshot = await newsCollection.orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const items = await Promise.all(snapshot.docs.map((doc) => withAuthor(doc)));
    res.status(200).json(items.filter(Boolean));
  } catch (error) {
    console.error('Error getting news:', error);
    res.status(500).json({ message: 'Server error while getting news' });
  }
};

export const getNewsById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newsDoc = await newsCollection.doc(id).get();

    if (!newsDoc.exists) {
      return res.status(404).json({ message: 'News not found' });
    }

    const newsWithAuthor = await withAuthor(newsDoc);
    res.status(200).json(newsWithAuthor);
  } catch (error) {
    console.error('Error getting news by id:', error);
    res.status(500).json({ message: 'Server error while getting news' });
  }
};

export const updateNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newsDoc = await newsCollection.doc(id).get();

    if (!newsDoc.exists) {
      return res.status(404).json({ message: 'News not found' });
    }

    const payload = buildNewsPayload(req.body);

    if (!payload.title || !payload.authorId || !payload.content) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const updatedNews = {
      ...payload,
      updatedAt: new Date(),
    };

    await newsCollection.doc(id).update(updatedNews);
    res.status(200).json({ id, ...newsDoc.data(), ...updatedNews });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ message: 'Server error while updating news' });
  }
};

export const deleteNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newsDoc = await newsCollection.doc(id).get();

    if (!newsDoc.exists) {
      return res.status(404).json({ message: 'News not found' });
    }

    const newsData = newsDoc.data() as NewsItem;
    const imageUrlsToDelete: string[] = [];

    if (newsData.imageUrl) {
      imageUrlsToDelete.push(newsData.imageUrl);
    }

    if (Array.isArray(newsData.content)) {
      for (const block of newsData.content) {
        if (block.type === 'image' && block.url) {
          imageUrlsToDelete.push(block.url);
        }
        if (block.type === 'tips-item' && block.imageUrl) {
          imageUrlsToDelete.push(block.imageUrl);
        }
      }
    }

    if (imageUrlsToDelete.length > 0) {
      await Promise.all(imageUrlsToDelete.map((url) => deleteFileFromStorage(url)));
    }

    await newsCollection.doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ message: 'Server error while deleting news' });
  }
};
