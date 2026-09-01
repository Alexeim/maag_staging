import { Router } from 'express';
import {
  createVisualStory,
  getVisualStories,
  getVisualStoryById,
  updateVisualStory,
  deleteVisualStory,
} from '../controllers/visualStoryController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getVisualStories);
router.post('/', requireAdmin, createVisualStory);
router.get('/:id', getVisualStoryById);
router.put('/:id', requireAdmin, updateVisualStory);
router.delete('/:id', requireAdmin, deleteVisualStory);

export default router;
