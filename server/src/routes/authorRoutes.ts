import { Router } from 'express';
import { createAuthor, getAuthors } from '../controllers/authorController';

const router = Router();

router.get('/', getAuthors);
router.post('/', createAuthor);

export default router;
