import { Router } from 'express';
import {
  createGuide,
  getGuides,
  getGuideById,
  updateGuide,
  deleteGuide,
} from '../controllers/guideController';

const router = Router();

router.get('/', getGuides);
router.post('/', createGuide);
router.get('/:id', getGuideById);
router.put('/:id', updateGuide);
router.delete('/:id', deleteGuide);

export default router;
