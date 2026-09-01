import { Router } from 'express';
import {
  createNews,
  getNews,
  getNewsById,
  updateNews,
  deleteNews,
} from '../controllers/newsController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getNews);
router.post('/', requireAdmin, createNews);
router.get('/:id', getNewsById);
router.put('/:id', requireAdmin, updateNews);
router.delete('/:id', requireAdmin, deleteNews);

export default router;
