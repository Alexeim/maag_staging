import { Router } from 'express';
import {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  updateEvent,
} from '../controllers/eventController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getEvents);
router.post('/', requireAdmin, createEvent);
router.get('/:id', getEventById);
router.put('/:id', requireAdmin, updateEvent);
router.delete('/:id', requireAdmin, deleteEvent);

export default router;
