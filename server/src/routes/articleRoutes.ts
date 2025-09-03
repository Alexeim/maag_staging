import { Router } from 'express';
import { createArticle, getArticles, getArticleById } from '../controllers/articleController';

const router = Router();

router.get('/', getArticles);
router.post('/', createArticle);
router.get('/:id', getArticleById);

export default router;
