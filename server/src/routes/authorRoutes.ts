import { Router } from 'express';
import {
  createAuthor,
  getAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
} from '../controllers/authorController';

const router = Router();

router.get('/', getAuthors);
router.post('/', createAuthor);
router.get('/:id', getAuthorById);
router.put('/:id', updateAuthor);
router.delete('/:id', deleteAuthor);

export default router;
