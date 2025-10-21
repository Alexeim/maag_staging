import { Router } from 'express';
import {
  createFlipper,
  getFlippers,
  getFlipperById,
  updateFlipper,
  deleteFlipper,
} from '../controllers/flipperController';

const router = Router();

router.get('/', getFlippers);
router.post('/', createFlipper);
router.get('/:id', getFlipperById);
router.put('/:id', updateFlipper);
router.delete('/:id', deleteFlipper);

export default router;
