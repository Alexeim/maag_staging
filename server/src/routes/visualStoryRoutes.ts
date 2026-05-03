import { Router } from 'express';
import {
  createVisualStory,
  getVisualStories,
  getVisualStoryById,
  updateVisualStory,
  deleteVisualStory,
} from '../controllers/visualStoryController';

const router = Router();

router.get('/', getVisualStories);
router.post('/', createVisualStory);
router.get('/:id', getVisualStoryById);
router.put('/:id', updateVisualStory);
router.delete('/:id', deleteVisualStory);

export default router;
