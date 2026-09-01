import { Router } from 'express';
import {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
} from '../controllers/articleController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getArticles);
router.post('/', requireAdmin, createArticle);
router.get('/:id', getArticleById);
router.put('/:id', requireAdmin, updateArticle);
router.delete('/:id', requireAdmin, deleteArticle);

export default router;
