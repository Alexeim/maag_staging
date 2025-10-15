import { Router } from 'express';
import {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
} from '../controllers/articleController';

const router = Router();

router.get('/', getArticles);
router.post('/', createArticle);
router.get('/:id', getArticleById);
router.put('/:id', updateArticle);
router.delete('/:id', deleteArticle);

export default router;
