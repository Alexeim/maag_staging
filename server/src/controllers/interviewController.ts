import { Request, Response } from 'express';
import { getDb, deleteFileFromStorage } from '../services/firebase';
import { normalizeRelatedContent, type RelatedContent } from '../utils/relatedContent';
import {
  normalizeContentCollectionId,
  syncSingleContentCollectionMembershipInTransaction,
} from '../utils/contentCollections';

// Interface for our Interview structure
export interface Interview {
  id?: string;
  title: string;
  authorId: string;
  interviewee: string;
  lead?: string;
  cardLead?: string;
  mainQuote?: string;
  isHotContent?: boolean;
  paid?: boolean;
  content: any[]; // Array of content blocks
  imageUrl?: string;
  imageCaption?: string;
  tags?: string[];
  relatedContent?: RelatedContent;
  contentCollectionId?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

const db = getDb();
const interviewsCollection = db.collection('interviews');
const contentCollectionsCollection = db.collection('contentCollections');

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
      interviewee,
      lead,
      cardLead,
      mainQuote,
      tags = [],
      isHotContent = false,
      paid = false,
      relatedContent,
      contentCollectionId,
    } = req.body;

    if (!title || !content || !authorId || !interviewee) {
      return res.status(400).json({ message: 'Title, content, authorId, and interviewee are required' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];

    const now = new Date();
    const docRef = interviewsCollection.doc();
    const newInterview: Omit<Interview, 'id'> = {
      title,
      authorId,
      interviewee,
      lead: lead || '',
      cardLead: cardLead || '',
      mainQuote: mainQuote || '',
      isHotContent: Boolean(isHotContent),
      paid: Boolean(paid),
      content,
      imageUrl,
      imageCaption,
      tags: normalizedTags,
      relatedContent: normalizeRelatedContent(relatedContent),
      contentCollectionId: normalizeContentCollectionId(contentCollectionId),
      createdAt: now,
    };

    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: null,
        nextCollectionId: newInterview.contentCollectionId ?? null,
        contentType: 'interview',
        materialId: docRef.id,
        now,
      });
      transaction.set(docRef, newInterview);
    });

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
      interviewee,
      lead,
      cardLead,
      mainQuote,
      tags = [],
      isHotContent = false,
      paid = false,
      relatedContent,
      contentCollectionId,
    } = req.body;

    if (!title || !content || !authorId || !interviewee) {
      return res.status(400).json({ message: 'Title, content, authorId, and interviewee are required' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];

    const previousContentCollectionId = normalizeContentCollectionId(
      interviewDoc.data()?.contentCollectionId,
    );
    const now = new Date();
    const updatedInterview = {
      title,
      authorId,
      interviewee,
      lead: lead || '',
      cardLead: cardLead || '',
      mainQuote: mainQuote || '',
      isHotContent: Boolean(isHotContent),
      paid: Boolean(paid),
      content,
      imageUrl,
      imageCaption,
      tags: normalizedTags,
      relatedContent: normalizeRelatedContent(relatedContent),
      contentCollectionId: normalizeContentCollectionId(contentCollectionId),
      updatedAt: now,
    };

    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: previousContentCollectionId,
        nextCollectionId: updatedInterview.contentCollectionId ?? null,
        contentType: 'interview',
        materialId: id,
        now,
      });
      transaction.update(interviewsCollection.doc(id), updatedInterview);
    });

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

    const interviewData = interviewDoc.data() as Interview;
    const imageUrlsToDelete: string[] = [];
    const previousContentCollectionId = normalizeContentCollectionId(
      interviewData.contentCollectionId,
    );

    // Collect main image URL
    if (interviewData.imageUrl) {
      imageUrlsToDelete.push(interviewData.imageUrl);
    }

    // Collect image URLs from content blocks
    if (Array.isArray(interviewData.content)) {
      for (const block of interviewData.content) {
        if (block.type === 'image' && block.url) {
          imageUrlsToDelete.push(block.url);
        }
      }
    }

    // Asynchronously delete all images from storage
    if (imageUrlsToDelete.length > 0) {
      console.log(`[Interview Delete] Deleting ${imageUrlsToDelete.length} associated images.`);
      await Promise.all(imageUrlsToDelete.map(url => deleteFileFromStorage(url)));
    }

    // Delete the Firestore document
    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: previousContentCollectionId,
        nextCollectionId: null,
        contentType: 'interview',
        materialId: id,
        now: new Date(),
      });
      transaction.delete(interviewsCollection.doc(id));
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ message: 'Server error while deleting interview' });
  }
};
