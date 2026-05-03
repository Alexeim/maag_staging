import { Request, Response } from 'express';
import { getDb, deleteFileFromStorage } from '../services/firebase';

export interface VisualStory {
  id?: string;
  title: string;
  authorId: string;
  slides: Array<{ imageUrl: string; text: string }>;
  imageUrl?: string;
  lead?: string;
  cardLead?: string;
  category?: string;
  tags?: string[];
  techTags?: string[];
  isHotContent?: boolean;
  isOnLanding?: boolean;
  createdAt: Date;
}

const db = getDb();
const collection = db.collection('visual-stories');

export const createVisualStory = async (req: Request, res: Response) => {
  try {
    const {
      title,
      authorId,
      slides = [],
      imageUrl,
      lead,
      cardLead,
      category,
      tags = [],
      techTags = [],
      isHotContent = false,
      isOnLanding = false,
    } = req.body;

    if (!title || !authorId) {
      return res.status(400).json({ message: 'Title and authorId are required' });
    }

    if (!Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({ message: 'At least one slide is required' });
    }

    const normalizedSlides = slides
      .filter((s: any) => s && typeof s === 'object' && s.imageUrl)
      .map((s: any) => ({ imageUrl: String(s.imageUrl), text: String(s.text ?? '') }));

    const newStory: Omit<VisualStory, 'id'> = {
      title,
      authorId,
      slides: normalizedSlides,
      ...(imageUrl ? { imageUrl } : {}),
      lead: lead || '',
      cardLead: cardLead || '',
      category: category || '',
      tags: Array.isArray(tags) ? tags.map((t: unknown) => String(t).trim()).filter(Boolean) : [],
      techTags: Array.isArray(techTags) ? techTags.map((t: unknown) => String(t).trim()).filter(Boolean) : [],
      isHotContent: Boolean(isHotContent),
      isOnLanding: Boolean(isOnLanding),
      createdAt: new Date(),
    };

    const docRef = await collection.add(newStory);
    res.status(201).json({ id: docRef.id, ...newStory });
  } catch (error) {
    console.error('Error creating visual story:', error);
    res.status(500).json({ message: 'Server error while creating visual story' });
  }
};

export const getVisualStories = async (req: Request, res: Response) => {
  try {
    const snapshot = await collection.orderBy('createdAt', 'desc').get();
    if (snapshot.empty) return res.status(200).json([]);

    const stories: VisualStory[] = [];
    snapshot.forEach(doc => {
      stories.push({ id: doc.id, ...doc.data() } as VisualStory);
    });

    res.status(200).json(stories);
  } catch (error) {
    console.error('Error getting visual stories:', error);
    res.status(500).json({ message: 'Server error while getting visual stories' });
  }
};

export const getVisualStoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Visual story not found' });
    }

    const storyData = doc.data() as VisualStory;

    let authorData = null;
    if (storyData.authorId) {
      const authorDoc = await db.collection('authors').doc(storyData.authorId).get();
      if (authorDoc.exists) authorData = authorDoc.data();
    }

    res.status(200).json({ id: doc.id, ...storyData, author: authorData });
  } catch (error) {
    console.error('Error getting visual story by id:', error);
    res.status(500).json({ message: 'Server error while getting visual story' });
  }
};

export const updateVisualStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Visual story not found' });
    }

    const {
      title,
      authorId,
      slides = [],
      imageUrl,
      lead,
      cardLead,
      category,
      tags = [],
      techTags = [],
      isHotContent = false,
      isOnLanding = false,
    } = req.body;

    if (!title || !authorId) {
      return res.status(400).json({ message: 'Title and authorId are required' });
    }

    const normalizedSlides = Array.isArray(slides)
      ? slides
          .filter((s: any) => s && typeof s === 'object' && s.imageUrl)
          .map((s: any) => ({ imageUrl: String(s.imageUrl), text: String(s.text ?? '') }))
      : [];

    const updated = {
      title,
      authorId,
      slides: normalizedSlides,
      ...(imageUrl ? { imageUrl } : {}),
      lead: lead || '',
      cardLead: cardLead || '',
      category: category || '',
      tags: Array.isArray(tags) ? tags.map((t: unknown) => String(t).trim()).filter(Boolean) : [],
      techTags: Array.isArray(techTags) ? techTags.map((t: unknown) => String(t).trim()).filter(Boolean) : [],
      isHotContent: Boolean(isHotContent),
      isOnLanding: Boolean(isOnLanding),
      updatedAt: new Date(),
    };

    await collection.doc(id).update(updated);
    res.status(200).json({ id, ...doc.data(), ...updated });
  } catch (error) {
    console.error('Error updating visual story:', error);
    res.status(500).json({ message: 'Server error while updating visual story' });
  }
};

export const deleteVisualStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Visual story not found' });
    }

    const storyData = doc.data() as VisualStory;
    const imageUrls: string[] = Array.isArray(storyData.slides)
      ? storyData.slides.map(s => s.imageUrl).filter(Boolean)
      : [];

    if (imageUrls.length > 0) {
      await Promise.all(imageUrls.map(url => deleteFileFromStorage(url)));
    }

    await collection.doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting visual story:', error);
    res.status(500).json({ message: 'Server error while deleting visual story' });
  }
};
