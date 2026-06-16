import { Request, Response } from 'express';
import { getDb, deleteFileFromStorage } from '../services/firebase';
import {
  buildPublicationFieldsForCreate,
  buildPublicationFieldsForUpdate,
} from '../utils/publication';

export interface PhotoOfTheDay {
  id?: string;
  title: string;
  imageUrl: string;
  caption: string;
  authorId: string;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt?: Date;
}

const db = getDb();
const collection = db.collection('photosOfTheDay');

export const createPhotoOfTheDay = async (req: Request, res: Response) => {
  try {
    const { title, imageUrl, caption, authorId } = req.body;

    if (!title || !imageUrl || !authorId) {
      return res.status(400).json({ message: 'title, imageUrl и authorId обязательны' });
    }

    const now = new Date();
    const doc: Omit<PhotoOfTheDay, 'id'> = {
      title,
      imageUrl,
      caption: caption || '',
      authorId,
      ...buildPublicationFieldsForCreate(req.body, now),
      createdAt: now,
    };

    const docRef = collection.doc();
    await docRef.set(doc);

    res.status(201).json({ id: docRef.id, ...doc });
  } catch (error) {
    console.error('Error creating photo of the day:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPhotosOfTheDay = async (_req: Request, res: Response) => {
  try {
    const snapshot = await collection.orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const photos: PhotoOfTheDay[] = [];
    snapshot.forEach((doc) => {
      photos.push({ id: doc.id, ...doc.data() } as PhotoOfTheDay);
    });

    res.status(200).json(photos);
  } catch (error) {
    console.error('Error getting photos of the day:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPhotoOfTheDayById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const data = doc.data() as PhotoOfTheDay;

    let authorData = null;
    if (data.authorId) {
      const authorDoc = await db.collection('authors').doc(data.authorId).get();
      if (authorDoc.exists) {
        authorData = authorDoc.data();
      }
    }

    res.status(200).json({ id: doc.id, ...data, author: authorData });
  } catch (error) {
    console.error('Error getting photo of the day by id:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePhotoOfTheDay = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, caption, authorId } = req.body;

    const doc = await collection.doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    if (!title || !imageUrl || !authorId) {
      return res.status(400).json({ message: 'title, imageUrl и authorId обязательны' });
    }

    const previousImageUrl = (doc.data() as PhotoOfTheDay).imageUrl;
    if (previousImageUrl && previousImageUrl !== imageUrl) {
      await deleteFileFromStorage(previousImageUrl);
    }

    const now = new Date();
    const updated = {
      title,
      imageUrl,
      caption: caption || '',
      authorId,
      ...buildPublicationFieldsForUpdate(req.body, doc.data(), now),
      updatedAt: now,
    };

    await collection.doc(id).update(updated);

    res.status(200).json({ id, ...updated });
  } catch (error) {
    console.error('Error updating photo of the day:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePhotoOfTheDay = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const { imageUrl } = doc.data() as PhotoOfTheDay;
    if (imageUrl) {
      await deleteFileFromStorage(imageUrl);
    }

    await collection.doc(id).delete();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting photo of the day:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
