import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

interface AuthorSocialLinks {
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  telegram?: string;
  site?: string;
}

interface Author {
  id?: string;
  firstName: string;
  lastName: string;
  role: 'author' | 'reader' | 'admin' | string;
  avatar: string;
  bio?: string;
  socialLinks?: AuthorSocialLinks;
  createdAt: Date;
}

const db = getDb();
const authorsCollection = db.collection('authors');

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const SOCIAL_LINK_KEYS: Array<keyof AuthorSocialLinks> = [
  'instagram',
  'linkedin',
  'facebook',
  'telegram',
  'site',
];

const normalizeSocialLinks = (value: unknown): AuthorSocialLinks => {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const socialLinks: AuthorSocialLinks = {};

  for (const key of SOCIAL_LINK_KEYS) {
    const normalized = normalizeText(source[key]);
    if (normalized) {
      socialLinks[key] = normalized;
    }
  }

  return socialLinks;
};

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
      avatar: normalizeText(req.body?.avatar),
      bio: normalizeText(req.body?.bio),
      socialLinks: normalizeSocialLinks(req.body?.socialLinks),
      createdAt: new Date(),
    };

    const docRef = await authorsCollection.add(newAuthor);
    res.status(201).json({ id: docRef.id, ...newAuthor });
  } catch (error) {
    console.error('Error creating author:', error);
    res.status(500).json({ message: 'Server error while creating author' });
  }
};

export const getAuthorById = async (req: Request, res: Response) => {
  try {
    const doc = await authorsCollection.doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Author not found' });
    }

    res.status(200).json({ id: doc.id, ...doc.data() } as Author);
  } catch (error) {
    console.error('Error getting author:', error);
    res.status(500).json({ message: 'Server error while getting author' });
  }
};

export const updateAuthor = async (req: Request, res: Response) => {
  try {
    const docRef = authorsCollection.doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const firstName = normalizeText(req.body?.firstName);
    const lastName = normalizeText(req.body?.lastName);

    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'firstName and lastName are required' });
    }

    const updatedFields: Partial<Author> = {
      firstName,
      lastName,
      avatar: normalizeText(req.body?.avatar),
      bio: normalizeText(req.body?.bio),
      socialLinks: normalizeSocialLinks(req.body?.socialLinks),
    };

    await docRef.update(updatedFields);
    res.status(200).json({ id: doc.id, ...doc.data(), ...updatedFields });
  } catch (error) {
    console.error('Error updating author:', error);
    res.status(500).json({ message: 'Server error while updating author' });
  }
};

export const deleteAuthor = async (req: Request, res: Response) => {
  try {
    const docRef = authorsCollection.doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Author not found' });
    }

    await docRef.delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting author:', error);
    res.status(500).json({ message: 'Server error while deleting author' });
  }
};
