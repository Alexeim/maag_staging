import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

// Interface for Flipper structure
export interface Flipper {
  id?: string;
  title: string;
  category?: string;
  tags?: string[];
  techTags?: string[];
  carouselContent: { imageUrl: string; caption: string }[];
  createdAt: Date;
  updatedAt?: Date;
}

const db = getDb();
const flippersCollection = db.collection('flippers');

/**
 * @description Create a new flipper
 * @route POST /api/flippers
 */
export const createFlipper = async (req: Request, res: Response) => {
  try {
    const { title, category, tags = [], techTags = [], carouselContent = [] } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Заголовок обязателен' });
    }
    if (!Array.isArray(carouselContent) || carouselContent.length === 0) {
      return res.status(400).json({ message: 'Для листалки нужен хотя бы один слайд' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];
    const normalizedTechTags = Array.isArray(techTags)
      ? techTags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];

    const newFlipper: Omit<Flipper, 'id'> = {
      title,
      category,
      tags: normalizedTags,
      techTags: normalizedTechTags,
      carouselContent,
      createdAt: new Date(),
    };

    const docRef = await flippersCollection.add(newFlipper);
    res.status(201).json({ id: docRef.id, ...newFlipper });

  } catch (error) {
    console.error('Error creating flipper:', error);
    res.status(500).json({ message: 'Server error while creating flipper' });
  }
};

/**
 * @description Get all flippers
 * @route GET /api/flippers
 */
export const getFlippers = async (req: Request, res: Response) => {
  try {
    const snapshot = await flippersCollection.get();
    
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const flippers: Flipper[] = [];
    snapshot.forEach(doc => {
      flippers.push({ id: doc.id, ...doc.data() } as Flipper);
    });

    res.status(200).json(flippers);

  } catch (error) {
    console.error('Error getting flippers:', error);
    res.status(500).json({ message: 'Server error while getting flippers' });
  }
};

/**
 * @description Get a single flipper by ID
 * @route GET /api/flippers/:id
 */
export const getFlipperById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const doc = await flippersCollection.doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Flipper not found' });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error getting flipper by id:', error);
        res.status(500).json({ message: 'Server error while getting flipper' });
    }
};

/**
 * @description Update a flipper
 * @route PUT /api/flippers/:id
 */
export const updateFlipper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, category, tags = [], techTags = [], carouselContent = [] } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Заголовок обязателен' });
    }
    if (!Array.isArray(carouselContent) || carouselContent.length === 0) {
      return res.status(400).json({ message: 'Для листалки нужен хотя бы один слайд' });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];
    const normalizedTechTags = Array.isArray(techTags)
      ? techTags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];

    const updatedFlipper = {
      title,
      category,
      tags: normalizedTags,
      techTags: normalizedTechTags,
      carouselContent,
      updatedAt: new Date(),
    };

    await flippersCollection.doc(id).update(updatedFlipper);
    res.status(200).json({ id, ...updatedFlipper });

  } catch (error) {
    console.error('Error updating flipper:', error);
    res.status(500).json({ message: 'Server error while updating flipper' });
  }
};

/**
 * @description Delete a flipper
 * @route DELETE /api/flippers/:id
 */
export const deleteFlipper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await flippersCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Flipper not found' });
    }

    await flippersCollection.doc(id).delete();
    res.status(204).send();
    
  } catch (error) {
    console.error('Error deleting flipper:', error);
    res.status(500).json({ message: 'Server error while deleting flipper' });
  }
};