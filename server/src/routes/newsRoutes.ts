import { Router } from 'express';
import {
  createNews,
  getNews,
  getNewsById,
  updateNews,
  deleteNews,
} from '../controllers/newsController';

const router = Router();

router.get('/', getNews);
router.post('/', createNews);
router.get('/:id', getNewsById);
router.put('/:id', updateNews);
router.delete('/:id', deleteNews);

export default router;
