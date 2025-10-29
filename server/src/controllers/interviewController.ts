import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

// Interface for our Interview structure
export interface Interview {
  id?: string;
  title: string;
  authorId: string;
  content: any[]; // Array of content blocks
  imageUrl?: string;
  imageCaption?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

const db = getDb();
const interviewsCollection = db.collection('interviews');

/**
 * @description Create a new interview
 * @route POST /api/interviews
 */
export const createInterview = async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      imageUrl,
      imageCaption,
      authorId,
      tags = [],
    } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];

    const newInterview: Omit<Interview, 'id'> = {
      title,
      authorId,
      content,
      imageUrl,
      imageCaption,
      tags: normalizedTags,
      createdAt: new Date(),
    };

    const docRef = await interviewsCollection.add(newInterview);

    res.status(201).json({ id: docRef.id, ...newInterview });

  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ message: 'Server error while creating interview' });
  }
};

/**
 * @description Get all interviews
 * @route GET /api/interviews
 */
export const getInterviews = async (req: Request, res: Response) => {
  try {
    const snapshot = await interviewsCollection.orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const interviews: Interview[] = [];
    snapshot.forEach(doc => {
      interviews.push({ id: doc.id, ...doc.data() } as Interview);
    });

    res.status(200).json(interviews);

  } catch (error) {
    console.error('Error getting interviews:', error);
    res.status(500).json({ message: 'Server error while getting interviews' });
  }
};

/**
 * @description Get a single interview by ID
 * @route GET /api/interviews/:id
 */
export const getInterviewById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const interviewDoc = await interviewsCollection.doc(id).get();

        if (!interviewDoc.exists) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        const interviewData = interviewDoc.data() as Interview;

        // Fetch author details
        let authorData = null;
        if (interviewData.authorId) {
            const userDoc = await db.collection('authors').doc(interviewData.authorId).get();
            if (userDoc.exists) {
                authorData = userDoc.data();
            }
        }

        const interviewWithAuthor = {
            id: interviewDoc.id,
            ...interviewData,
            author: authorData // Add author data to the response
        };

        res.status(200).json(interviewWithAuthor);
    } catch (error) {
        console.error('Error getting interview by id:', error);
        res.status(500).json({ message: 'Server error while getting interview' });
    }
};

/**
 * @description Update an interview
 * @route PUT /api/interviews/:id
 */
export const updateInterview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const interviewDoc = await interviewsCollection.doc(id).get();

    if (!interviewDoc.exists) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const {
      title,
      content,
      imageUrl,
      imageCaption,
      authorId,
      tags = [],
    } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];

    const updatedInterview = {
      title,
      authorId,
      content,
      imageUrl,
      imageCaption,
      tags: normalizedTags,
      updatedAt: new Date(),
    };

    await interviewsCollection.doc(id).update(updatedInterview);

    res.status(200).json({ id, ...interviewDoc.data(), ...updatedInterview });
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ message: 'Server error while updating interview' });
  }
};

/**
 * @description Delete an interview
 * @route DELETE /api/interviews/:id
 */
export const deleteInterview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const interviewDoc = await interviewsCollection.doc(id).get();

    if (!interviewDoc.exists) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    await interviewsCollection.doc(id).delete();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ message: 'Server error while deleting interview' });
  }
};
