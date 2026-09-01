import { Router } from 'express';
import {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
} from '../controllers/interviewController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getInterviews);
router.post('/', requireAdmin, createInterview);
router.get('/:id', getInterviewById);
router.put('/:id', requireAdmin, updateInterview);
router.delete('/:id', requireAdmin, deleteInterview);

export default router;
