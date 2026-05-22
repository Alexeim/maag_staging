import { Router } from 'express';
import {
  createContentCollection,
  getContentCollectionById,
  getContentCollections,
  updateContentCollection,
} from '../controllers/contentCollectionsController';

const router = Router();

router.get('/', getContentCollections);
router.post('/', createContentCollection);
router.get('/:id', getContentCollectionById);
router.put('/:id', updateContentCollection);

export default router;
