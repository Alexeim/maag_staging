import { Router } from 'express';
import {
  createPhotoOfTheDay,
  getPhotosOfTheDay,
  getPhotoOfTheDayById,
  updatePhotoOfTheDay,
  deletePhotoOfTheDay,
} from '../controllers/photoOfTheDayController';

const router = Router();

router.get('/', getPhotosOfTheDay);
router.post('/', createPhotoOfTheDay);
router.get('/:id', getPhotoOfTheDayById);
router.put('/:id', updatePhotoOfTheDay);
router.delete('/:id', deletePhotoOfTheDay);

export default router;
