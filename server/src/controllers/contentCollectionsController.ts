import { Request, Response } from 'express';
import { getDb } from '../services/firebase';
import {
  createEmptyContentCollectionContent,
  normalizeContentCollectionRecord,
  normalizeContentCollectionTitle,
} from '../utils/contentCollections';

const db = getDb();
const contentCollectionsCollection = db.collection('contentCollections');

export const getContentCollections = async (_req: Request, res: Response) => {
  try {
    const snapshot = await contentCollectionsCollection.orderBy('title', 'asc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const collections = snapshot.docs.map((doc) =>
      normalizeContentCollectionRecord(doc.id, doc.data()),
    );

    res.status(200).json(collections);
  } catch (error) {
    console.error('Error getting content collections:', error);
    res
      .status(500)
      .json({ message: 'Server error while getting content collections' });
  }
};

export const getContentCollectionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const collectionDoc = await contentCollectionsCollection.doc(id).get();

    if (!collectionDoc.exists) {
      return res.status(404).json({ message: 'Content collection not found' });
    }

    res
      .status(200)
      .json(normalizeContentCollectionRecord(collectionDoc.id, collectionDoc.data()));
  } catch (error) {
    console.error('Error getting content collection by id:', error);
    res
      .status(500)
      .json({ message: 'Server error while getting content collection' });
  }
};

export const createContentCollection = async (req: Request, res: Response) => {
  try {
    const title = normalizeContentCollectionTitle(req.body?.title);

    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const now = new Date();
    const docRef = contentCollectionsCollection.doc();
    const newCollection = {
      title,
      content: createEmptyContentCollectionContent(),
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(newCollection);

    res.status(201).json({ id: docRef.id, ...newCollection });
  } catch (error) {
    console.error('Error creating content collection:', error);
    res
      .status(500)
      .json({ message: 'Server error while creating content collection' });
  }
};

export const updateContentCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const collectionDoc = await contentCollectionsCollection.doc(id).get();

    if (!collectionDoc.exists) {
      return res.status(404).json({ message: 'Content collection not found' });
    }

    const title = normalizeContentCollectionTitle(req.body?.title);

    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const updates = {
      title,
      updatedAt: new Date(),
    };

    await contentCollectionsCollection.doc(id).update(updates);

    res.status(200).json({
      ...normalizeContentCollectionRecord(collectionDoc.id, collectionDoc.data()),
      ...updates,
      id,
    });
  } catch (error) {
    console.error('Error updating content collection:', error);
    res
      .status(500)
      .json({ message: 'Server error while updating content collection' });
  }
};
