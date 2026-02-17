import { Request, Response } from 'express';
import { getDb, deleteFileFromStorage } from '../services/firebase';

export interface EventItem {
  id?: string;
  title: string;
  authorId: string;
  lead?: string;
  content: any[];
  imageUrl?: string;
  imageCaption?: string;
  category: 'exhibition' | 'concert' | 'performance';
  tags: string[];
  techTags: string[];
  startDate: Date;
  endDate?: Date | null;
  dateType?: 'single' | 'duration';
  address?: string;
  timeMode?: 'none' | 'start' | 'range';
  startTime?: string | null;
  endTime?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  isOnLanding: boolean;
  isMainEvent?: boolean;
}

const db = getDb();
const eventsCollection = db.collection('events');

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

const EVENT_CATEGORIES: Record<string, EventItem['category']> = {
  exhibition: 'exhibition',
  concert: 'concert',
  performance: 'performance',
};

const normalizeCategory = (value: unknown): EventItem['category'] | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const key = value.trim().toLowerCase();
  return EVENT_CATEGORIES[key] ?? null;
};

const resetExclusiveEventFlag = async (
  flag: 'isOnLanding' | 'isMainEvent',
  excludeId?: string,
) => {
  const snapshot = await eventsCollection.where(flag, '==', true).get();
  if (snapshot.empty) {
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    if (excludeId && doc.id === excludeId) {
      return;
    }
    batch.update(doc.ref, { [flag]: false, updatedAt: new Date() });
  });
  await batch.commit();
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
      category,
      tags = [],
      techTags = [],
      startDate,
      endDate = null,
      dateType = undefined,
      address = '',
      timeMode = 'none',
      startTime = null,
      endTime = null,
    } = req.body;

    const isOnLanding = Boolean(req.body?.isOnLanding);
    const isMainEvent = Boolean(req.body?.isMainEvent);

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const normalizedCategory = normalizeCategory(category);
    if (!normalizedCategory) {
      return res.status(400).json({ message: 'Unsupported event category' });
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
    const normalizedTechTags = normalizeStringArray(techTags);

    const newEvent: Omit<EventItem, 'id'> = {
      title,
      authorId,
      lead: lead || '',
      content,
      imageUrl,
      imageCaption,
      category: normalizedCategory,
      tags: normalizedTags,
      techTags: normalizedTechTags,
      startDate: normalizedStartDate,
      endDate: normalizedDateType === 'duration' ? normalizedEndDate : null,
      dateType: normalizedDateType,
      address: typeof address === 'string' ? address.trim() : '',
      timeMode: normalizedTimeMode,
      startTime: normalizedTimeMode === 'none' ? null : normalizedStartTime,
      endTime: normalizedTimeMode === 'range' ? normalizedEndTime : null,
      createdAt: new Date(),
      isOnLanding,
      isMainEvent,
    };

    if (isOnLanding) {
      await resetExclusiveEventFlag('isOnLanding');
    }
    if (isMainEvent) {
      await resetExclusiveEventFlag('isMainEvent');
    }

    const docRef = await eventsCollection.add(newEvent);

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

    res.status(200).json({ id: eventDoc.id, ...eventDoc.data() });
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
      category,
      tags = [],
      techTags = [],
      startDate,
      endDate = null,
      dateType = undefined,
      address = '',
      timeMode = 'none',
      startTime = null,
      endTime = null,
      isOnLanding = false,
      isMainEvent = false,
    } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ message: 'Title, content, and authorId are required' });
    }

    const normalizedCategory = normalizeCategory(category);
    if (!normalizedCategory) {
      return res.status(400).json({ message: 'Unsupported event category' });
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
    const normalizedTechTags = normalizeStringArray(techTags);
    const landingFlag = Boolean(isOnLanding);
    const mainEventFlag = Boolean(isMainEvent);

    const payload: Partial<EventItem> = {
      title,
      authorId,
      lead: lead || '',
      content,
      imageUrl,
      imageCaption,
      category: normalizedCategory,
      tags: normalizedTags,
      techTags: normalizedTechTags,
      startDate: normalizedStartDate,
      endDate: normalizedDateType === 'duration' ? normalizedEndDate : null,
      dateType: normalizedDateType,
      address: typeof address === 'string' ? address.trim() : '',
      timeMode: normalizedTimeMode,
      startTime: normalizedTimeMode === 'none' ? null : normalizedStartTime,
      endTime: normalizedTimeMode === 'range' ? normalizedEndTime : null,
      updatedAt: new Date(),
      isOnLanding: landingFlag,
      isMainEvent: mainEventFlag,
    };

    if (landingFlag) {
      await resetExclusiveEventFlag('isOnLanding', id);
    }
    if (mainEventFlag) {
      await resetExclusiveEventFlag('isMainEvent', id);
    }

    await eventsCollection.doc(id).update(payload);

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

    if (eventData.imageUrl) {
      imageUrlsToDelete.push(eventData.imageUrl);
    }

    if (Array.isArray(eventData.content)) {
      for (const block of eventData.content) {
        if (block.type === 'image' && block.url) {
          imageUrlsToDelete.push(block.url);
        }
      }
    }

    if (imageUrlsToDelete.length > 0) {
      console.log(`[Event Delete] Deleting ${imageUrlsToDelete.length} associated images.`);
      await Promise.all(imageUrlsToDelete.map(url => deleteFileFromStorage(url)));
    }

    await eventsCollection.doc(id).delete();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error while deleting event' });
  }
};
