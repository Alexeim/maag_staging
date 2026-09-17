import { Request, Response } from 'express';
import { getDb, deleteFileFromStorage } from '../services/firebase';
import {
  buildPublicationFieldsForCreate,
  buildPublicationFieldsForUpdate,
} from '../utils/publication';

// "От первого лица": same category/tags/blocks shape as an article, but no
// hero image (the card/page portrait comes from the linked author's
// noBgAvatar) and no related-content/content-collection editor yet.
export interface FirstPerson {
  id?: string;
  // Only the headline's tail ("о том, как он попал..."). The author's full
  // name is prepended at render time (composeFirstPersonTitle on the client)
  // — never stored here, so it stays in sync if the author is renamed.
  title: string;
  authorId: string;
  content: any[];
  category?: string;
  tags?: string[];
  parisSubCategories?: string[];
  parisDistrict?: string | null;
  isMaagChoice?: boolean;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt?: Date;
}

const db = getDb();
const firstPersonCollection = db.collection('firstPerson');

const normalizeTags = (tags: unknown): string[] =>
  Array.isArray(tags)
    ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
    : [];

/**
 * @description Create a new "от первого лица" material
 * @route POST /api/first-person
 */
export const createFirstPerson = async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      authorId,
      category,
      tags = [],
      parisSubCategories = [],
      parisDistrict = null,
      isMaagChoice = false,
    } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const now = new Date();
    const docRef = firstPersonCollection.doc();
    const newFirstPerson: Omit<FirstPerson, 'id'> = {
      title,
      authorId,
      content,
      category: category || '',
      tags: normalizeTags(tags),
      parisSubCategories: normalizeTags(parisSubCategories),
      parisDistrict: parisDistrict || null,
      isMaagChoice: Boolean(isMaagChoice),
      ...buildPublicationFieldsForCreate(req.body, now),
      createdAt: now,
    };

    await docRef.set(newFirstPerson);
    res.status(201).json({ id: docRef.id, ...newFirstPerson });
  } catch (error) {
    console.error('Error creating first-person material:', error);
    res.status(500).json({ message: 'Server error while creating first-person material' });
  }
};

/**
 * @description Get all "от первого лица" materials
 * @route GET /api/first-person
 */
export const getFirstPersonList = async (_req: Request, res: Response) => {
  try {
    const snapshot = await firstPersonCollection.orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const items: FirstPerson[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as FirstPerson);
    });

    res.status(200).json(items);
  } catch (error) {
    console.error('Error getting first-person materials:', error);
    res.status(500).json({ message: 'Server error while getting first-person materials' });
  }
};

/**
 * @description Get a single "от первого лица" material by ID
 * @route GET /api/first-person/:id
 */
export const getFirstPersonById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await firstPersonCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'First-person material not found' });
    }

    const data = doc.data() as FirstPerson;

    let authorData = null;
    if (data.authorId) {
      const authorDoc = await db.collection('authors').doc(data.authorId).get();
      if (authorDoc.exists) {
        authorData = authorDoc.data();
      }
    }

    res.status(200).json({ id: doc.id, ...data, author: authorData });
  } catch (error) {
    console.error('Error getting first-person material by id:', error);
    res.status(500).json({ message: 'Server error while getting first-person material' });
  }
};

/**
 * @description Update a "от первого лица" material
 * @route PUT /api/first-person/:id
 */
export const updateFirstPerson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await firstPersonCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'First-person material not found' });
    }

    const {
      title,
      content,
      authorId,
      category,
      tags = [],
      parisSubCategories = [],
      parisDistrict = null,
      isMaagChoice = false,
    } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const now = new Date();
    const updatedFirstPerson: Partial<FirstPerson> = {
      title,
      authorId,
      content,
      category: category || '',
      tags: normalizeTags(tags),
      parisSubCategories: normalizeTags(parisSubCategories),
      parisDistrict: parisDistrict || null,
      isMaagChoice: Boolean(isMaagChoice),
      ...buildPublicationFieldsForUpdate(req.body, doc.data(), now),
      updatedAt: now,
    };

    await firstPersonCollection.doc(id).update(updatedFirstPerson);
    res.status(200).json({ id, ...doc.data(), ...updatedFirstPerson });
  } catch (error) {
    console.error('Error updating first-person material:', error);
    res.status(500).json({ message: 'Server error while updating first-person material' });
  }
};

/**
 * @description Delete a "от первого лица" material
 * @route DELETE /api/first-person/:id
 */
export const deleteFirstPerson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await firstPersonCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'First-person material not found' });
    }

    const data = doc.data() as FirstPerson;
    const imageUrlsToDelete: string[] = [];

    if (Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.type === 'image' && block.url) {
          imageUrlsToDelete.push(block.url);
        }
        if (block.type === 'video' && block.sourceType === 'upload' && block.url) {
          imageUrlsToDelete.push(block.url);
        }
        if (block.type === 'one-big-one-small') {
          if (block.portraitImageUrl) imageUrlsToDelete.push(block.portraitImageUrl);
          if (block.landscapeImageUrl) imageUrlsToDelete.push(block.landscapeImageUrl);
        }
      }
    }

    if (imageUrlsToDelete.length > 0) {
      console.log(`[FirstPerson Delete] Deleting ${imageUrlsToDelete.length} associated images.`);
      await Promise.all(imageUrlsToDelete.map((url) => deleteFileFromStorage(url)));
    }

    await firstPersonCollection.doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting first-person material:', error);
    res.status(500).json({ message: 'Server error while deleting first-person material' });
  }
};
