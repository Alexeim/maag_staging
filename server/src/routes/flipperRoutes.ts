import { Router } from 'express';
import {
  createFlipper,
  getFlippers,
  getFlipperById,
  updateFlipper,
  deleteFlipper,
} from '../controllers/flipperController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getFlippers);
router.post('/', requireAdmin, createFlipper);
router.get('/:id', getFlipperById);
router.put('/:id', requireAdmin, updateFlipper);
router.delete('/:id', requireAdmin, deleteFlipper);

export default router;
