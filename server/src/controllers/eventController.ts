import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

export interface EventItem {
  id?: string;
  title: string;
  authorId: string;
  content: any[];
  imageUrl?: string;
  imageCaption?: string;
  category: 'exhibition' | 'concert' | 'performance';
  tags: string[];
  techTags: string[];
  startDate: Date;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
  isOnLanding: boolean;
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

export const createEvent = async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      imageUrl,
      imageCaption,
      authorId,
      category,
      tags = [],
      techTags = [],
      startDate,
      endDate = null,
    } = req.body;

    const isOnLanding = Boolean(req.body?.isOnLanding);

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

    const normalizedTags = normalizeStringArray(tags);
    const normalizedTechTags = normalizeStringArray(techTags);

    const newEvent: Omit<EventItem, 'id'> = {
      title,
      authorId,
      content,
      imageUrl,
      imageCaption,
      category: normalizedCategory,
      tags: normalizedTags,
      techTags: normalizedTechTags,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      createdAt: new Date(),
      isOnLanding,
    };

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
      category,
      tags = [],
      techTags = [],
      startDate,
      endDate = null,
      isOnLanding = false,
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

    const normalizedTags = normalizeStringArray(tags);
    const normalizedTechTags = normalizeStringArray(techTags);
    const landingFlag = Boolean(isOnLanding);

    const payload: Partial<EventItem> = {
      title,
      authorId,
      content,
      imageUrl,
      imageCaption,
      category: normalizedCategory,
      tags: normalizedTags,
      techTags: normalizedTechTags,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      updatedAt: new Date(),
      isOnLanding: landingFlag,
    };

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

    await eventsCollection.doc(id).delete();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error while deleting event' });
  }
};
