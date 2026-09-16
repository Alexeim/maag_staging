import { Router } from 'express';
import {
  createFirstPerson,
  getFirstPersonList,
  getFirstPersonById,
  updateFirstPerson,
  deleteFirstPerson,
} from '../controllers/firstPersonController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getFirstPersonList);
router.post('/', requireAdmin, createFirstPerson);
router.get('/:id', getFirstPersonById);
router.put('/:id', requireAdmin, updateFirstPerson);
router.delete('/:id', requireAdmin, deleteFirstPerson);

export default router;
