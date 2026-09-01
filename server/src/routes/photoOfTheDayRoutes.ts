import { Router } from 'express';
import {
  createPhotoOfTheDay,
  getPhotosOfTheDay,
  getPhotoOfTheDayById,
  updatePhotoOfTheDay,
  deletePhotoOfTheDay,
} from '../controllers/photoOfTheDayController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getPhotosOfTheDay);
router.post('/', requireAdmin, createPhotoOfTheDay);
router.get('/:id', getPhotoOfTheDayById);
router.put('/:id', requireAdmin, updatePhotoOfTheDay);
router.delete('/:id', requireAdmin, deletePhotoOfTheDay);

export default router;
