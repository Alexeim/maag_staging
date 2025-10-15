import { Router } from 'express';
import {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  updateEvent,
} from '../controllers/eventController';

const router = Router();

router.get('/', getEvents);
router.post('/', createEvent);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
