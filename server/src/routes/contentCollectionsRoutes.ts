import { Router } from 'express';
import {
  createContentCollection,
  getContentCollectionById,
  getContentCollections,
  updateContentCollection,
} from '../controllers/contentCollectionsController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getContentCollections);
router.post('/', requireAdmin, createContentCollection);
router.get('/:id', getContentCollectionById);
router.put('/:id', requireAdmin, updateContentCollection);

export default router;
