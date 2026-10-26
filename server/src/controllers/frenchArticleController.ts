import { Request, Response } from 'express';
import { getDb } from '../services/firebase';
import { FR_BY_SOURCE_COLLECTION, FR_COLLECTION } from '../services/articlesFr';

/**
 * @description French version of the article with this (Russian) id, or 404.
 * Admin only while the French site is not public: drafts included.
 * @route GET /api/articles/:id/fr
 */
export const getFrenchArticleBySource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const lockDoc = await db.collection(FR_BY_SOURCE_COLLECTION).doc(id).get();
    const translationId = lockDoc.exists ? lockDoc.data()?.translationId : null;
    if (typeof translationId !== 'string' || !translationId) {
      return res.status(404).json({ message: 'French version not found' });
    }

    const frDoc = await db.collection(FR_COLLECTION).doc(translationId).get();
    if (!frDoc.exists) {
      return res.status(404).json({ message: 'French version not found' });
    }

    res.status(200).json({ id: frDoc.id, ...frDoc.data() });
  } catch (error) {
    console.error('Error getting French article:', error);
    res.status(500).json({ message: 'Server error while getting French article' });
  }
};
