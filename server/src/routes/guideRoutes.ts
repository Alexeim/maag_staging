import { Router } from 'express';
import {
  createGuide,
  getGuides,
  getGuideById,
  updateGuide,
  deleteGuide,
} from '../controllers/guideController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getGuides);
router.post('/', requireAdmin, createGuide);
router.get('/:id', getGuideById);
router.put('/:id', requireAdmin, updateGuide);
router.delete('/:id', requireAdmin, deleteGuide);

export default router;
