import { Router } from 'express';
import {
  createAuthor,
  getAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
} from '../controllers/authorController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getAuthors);
router.post('/', requireAdmin, createAuthor);
router.get('/:id', getAuthorById);
router.put('/:id', requireAdmin, updateAuthor);
router.delete('/:id', requireAdmin, deleteAuthor);

export default router;
