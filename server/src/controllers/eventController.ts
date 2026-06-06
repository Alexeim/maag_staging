import { Request, Response } from 'express';
import { getDb, deleteFileFromStorage } from '../services/firebase';
import { normalizeRelatedContent, type RelatedContent } from '../utils/relatedContent';
import {
  normalizeContentCollectionId,
  syncSingleContentCollectionMembershipInTransaction,
} from '../utils/contentCollections';

export interface EventItem {
  id?: string;
  title: string;
  authorId: string;
  lead?: string;
  cardLead?: string;
  content: any[];
  imageUrl?: string;
  imageCaption?: string;
  tags: string[];
  startDate: Date;
  endDate?: Date | null;
  dateType?: 'single' | 'duration';
  address?: string;
  timeMode?: 'none' | 'start' | 'range';
  startTime?: string | null;
  endTime?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  isMainEvent?: boolean;
  relatedContent?: RelatedContent;
  contentCollectionId?: string | null;
}

const db = getDb();
const eventsCollection = db.collection('events');
const contentCollectionsCollection = db.collection('contentCollections');

const normalizeStringArray = (input: unknown): string[] => {
  if (!Array.isArray(input)) {
    return [];
  }
  return input
    .map(item => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
    .filter(Boolean);
};

const parseDate = (value: unknown): Date | null => {
  if (typeof value === 'string' || value instanceof Date) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
};

const normalizeDateType = (value: unknown, hasEndDate: boolean): 'single' | 'duration' => {
  if (value === 'duration') {
    return 'duration';
  }
  if (value === 'single') {
    return 'single';
  }
  return hasEndDate ? 'duration' : 'single';
};

const normalizeTimeMode = (value: unknown): 'none' | 'start' | 'range' => {
  if (value === 'start' || value === 'range') {
    return value;
  }
  return 'none';
};

const normalizeTime = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed) ? trimmed : null;
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      imageUrl,
      imageCaption,
      authorId,
      lead,
      cardLead,
      tags = [],
      startDate,
      endDate = null,
      dateType = undefined,
      address = '',
      timeMode = 'none',
      startTime = null,
      endTime = null,
      relatedContent,
      contentCollectionId,
    } = req.body;
    const isMainEvent = Boolean(req.body?.isMainEvent);

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const normalizedStartDate = parseDate(startDate);
    if (!normalizedStartDate) {
      return res.status(400).json({ message: 'Start date is required for event' });
    }

    const normalizedEndDate = endDate ? parseDate(endDate) : null;
    if (normalizedEndDate && normalizedEndDate < normalizedStartDate) {
      return res.status(400).json({ message: 'Finish date can not be earlier than start date' });
    }

    const normalizedDateType = normalizeDateType(dateType, Boolean(normalizedEndDate));
    if (normalizedDateType === 'duration' && !normalizedEndDate) {
      return res.status(400).json({ message: 'Finish date is required for duration event' });
    }

    const normalizedTimeMode = normalizeTimeMode(timeMode);
    const normalizedStartTime = normalizeTime(startTime);
    const normalizedEndTime = normalizeTime(endTime);
    if (normalizedTimeMode === 'start' && !normalizedStartTime) {
      return res.status(400).json({ message: 'Start time is required for selected time mode' });
    }
    if (normalizedTimeMode === 'range') {
      if (!normalizedStartTime || !normalizedEndTime) {
        return res.status(400).json({ message: 'Start and end time are required for range mode' });
      }
      if (normalizedEndTime <= normalizedStartTime) {
        return res.status(400).json({ message: 'End time must be later than start time' });
      }
    }

    const normalizedTags = normalizeStringArray(tags);
    const now = new Date();
    const docRef = eventsCollection.doc();
    const newEvent: Omit<EventItem, 'id'> = {
      title,
      authorId,
      lead: lead || '',
      cardLead: cardLead || '',
      content,
      imageUrl,
      imageCaption,
      tags: normalizedTags,
      startDate: normalizedStartDate,
      endDate: normalizedDateType === 'duration' ? normalizedEndDate : null,
      dateType: normalizedDateType,
      address: typeof address === 'string' ? address.trim() : '',
      timeMode: normalizedTimeMode,
      startTime: normalizedTimeMode === 'none' ? null : normalizedStartTime,
      endTime: normalizedTimeMode === 'range' ? normalizedEndTime : null,
      createdAt: now,
      isMainEvent,
      relatedContent: normalizeRelatedContent(relatedContent),
      contentCollectionId: normalizeContentCollectionId(contentCollectionId),
    };

    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: null,
        nextCollectionId: newEvent.contentCollectionId ?? null,
        contentType: 'event',
        materialId: docRef.id,
        now,
      });
      transaction.set(docRef, newEvent);
    });

    res.status(201).json({ id: docRef.id, ...newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error while creating event' });
  }
};

export const getEvents = async (_req: Request, res: Response) => {
  try {
    const snapshot = await eventsCollection.orderBy('startDate', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const events: EventItem[] = [];
    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() } as EventItem);
    });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ message: 'Server error while getting events' });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventDoc = await eventsCollection.doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const eventData = eventDoc.data() as EventItem;

    let authorData = null;
    if (eventData.authorId) {
      const authorDoc = await db.collection('authors').doc(eventData.authorId).get();
      if (authorDoc.exists) {
        authorData = authorDoc.data();
      }
    }

    res.status(200).json({
      id: eventDoc.id,
      ...eventData,
      author: authorData,
    });
  } catch (error) {
    console.error('Error getting event by id:', error);
    res.status(500).json({ message: 'Server error while getting event' });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventDoc = await eventsCollection.doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const {
      title,
      content,
      imageUrl,
      imageCaption,
      authorId,
      lead,
      cardLead,
      tags = [],
      startDate,
      endDate = null,
      dateType = undefined,
      address = '',
      timeMode = 'none',
      startTime = null,
      endTime = null,
      isMainEvent = false,
      relatedContent,
      contentCollectionId,
    } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const normalizedStartDate = parseDate(startDate);
    if (!normalizedStartDate) {
      return res.status(400).json({ message: 'Start date is required for event' });
    }

    const normalizedEndDate = endDate ? parseDate(endDate) : null;
    if (normalizedEndDate && normalizedEndDate < normalizedStartDate) {
      return res.status(400).json({ message: 'Finish date can not be earlier than start date' });
    }

    const normalizedDateType = normalizeDateType(dateType, Boolean(normalizedEndDate));
    if (normalizedDateType === 'duration' && !normalizedEndDate) {
      return res.status(400).json({ message: 'Finish date is required for duration event' });
    }

    const normalizedTimeMode = normalizeTimeMode(timeMode);
    const normalizedStartTime = normalizeTime(startTime);
    const normalizedEndTime = normalizeTime(endTime);
    if (normalizedTimeMode === 'start' && !normalizedStartTime) {
      return res.status(400).json({ message: 'Start time is required for selected time mode' });
    }
    if (normalizedTimeMode === 'range') {
      if (!normalizedStartTime || !normalizedEndTime) {
        return res.status(400).json({ message: 'Start and end time are required for range mode' });
      }
      if (normalizedEndTime <= normalizedStartTime) {
        return res.status(400).json({ message: 'End time must be later than start time' });
      }
    }

    const normalizedTags = normalizeStringArray(tags);
    const mainEventFlag = Boolean(isMainEvent);
    const previousContentCollectionId = normalizeContentCollectionId(
      eventDoc.data()?.contentCollectionId,
    );
    const now = new Date();

    const payload: Partial<EventItem> = {
      title,
      authorId,
      lead: lead || '',
      cardLead: cardLead || '',
      content,
      imageUrl,
      imageCaption,
      tags: normalizedTags,
      startDate: normalizedStartDate,
      endDate: normalizedDateType === 'duration' ? normalizedEndDate : null,
      dateType: normalizedDateType,
      address: typeof address === 'string' ? address.trim() : '',
      timeMode: normalizedTimeMode,
      startTime: normalizedTimeMode === 'none' ? null : normalizedStartTime,
      endTime: normalizedTimeMode === 'range' ? normalizedEndTime : null,
      updatedAt: now,
      isMainEvent: mainEventFlag,
      relatedContent: normalizeRelatedContent(relatedContent),
      contentCollectionId: normalizeContentCollectionId(contentCollectionId),
    };

    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: previousContentCollectionId,
        nextCollectionId: payload.contentCollectionId ?? null,
        contentType: 'event',
        materialId: id,
        now,
      });
      transaction.update(eventsCollection.doc(id), payload);
    });

    res.status(200).json({ id, ...eventDoc.data(), ...payload });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error while updating event' });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventDoc = await eventsCollection.doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const eventData = eventDoc.data() as EventItem;
    const imageUrlsToDelete: string[] = [];
    const previousContentCollectionId = normalizeContentCollectionId(
      eventData.contentCollectionId,
    );

    if (eventData.imageUrl) {
      imageUrlsToDelete.push(eventData.imageUrl);
    }

    if (Array.isArray(eventData.content)) {
      for (const block of eventData.content) {
        if (block.type === 'image' && block.url) {
          imageUrlsToDelete.push(block.url);
        }
        if (block.type === 'one-big-one-small') {
          if (block.portraitImageUrl) {
            imageUrlsToDelete.push(block.portraitImageUrl);
          }
          if (block.landscapeImageUrl) {
            imageUrlsToDelete.push(block.landscapeImageUrl);
          }
        }
      }
    }

    if (imageUrlsToDelete.length > 0) {
      console.log(`[Event Delete] Deleting ${imageUrlsToDelete.length} associated images.`);
      await Promise.all(imageUrlsToDelete.map(url => deleteFileFromStorage(url)));
    }

    await db.runTransaction(async (transaction) => {
      await syncSingleContentCollectionMembershipInTransaction({
        transaction,
        collectionsCollection: contentCollectionsCollection,
        previousCollectionId: previousContentCollectionId,
        nextCollectionId: null,
        contentType: 'event',
        materialId: id,
        now: new Date(),
      });
      transaction.delete(eventsCollection.doc(id));
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error while deleting event' });
  }
};
