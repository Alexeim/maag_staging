import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

interface Author {
  id?: string;
  firstName: string;
  lastName: string;
  role: 'author' | 'reader' | 'admin' | string;
  avatar: string;
  createdAt: Date;
}

const db = getDb();
const authorsCollection = db.collection('authors');

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const getAuthors = async (_req: Request, res: Response) => {
  try {
    const snapshot = await authorsCollection.orderBy('lastName', 'asc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const authors: Author[] = [];
    snapshot.forEach((doc) => {
      authors.push({ id: doc.id, ...doc.data() } as Author);
    });

    res.status(200).json(authors);
  } catch (error) {
    console.error('Error getting authors:', error);
    res.status(500).json({ message: 'Server error while getting authors' });
  }
};

export const createAuthor = async (req: Request, res: Response) => {
  try {
    const firstName = normalizeText(req.body?.firstName);
    const lastName = normalizeText(req.body?.lastName);

    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'firstName and lastName are required' });
    }

    const newAuthor: Omit<Author, 'id'> = {
      firstName,
      lastName,
      role: 'author',
      avatar: '',
      createdAt: new Date(),
    };

    const docRef = await authorsCollection.add(newAuthor);
    res.status(201).json({ id: docRef.id, ...newAuthor });
  } catch (error) {
    console.error('Error creating author:', error);
    res.status(500).json({ message: 'Server error while creating author' });
  }
};
