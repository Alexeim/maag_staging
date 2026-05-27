import { Router } from 'express';
import {
  getCalendarPagePlacements,
  getLandingPlacements,
  updateCalendarPagePlacements,
  updateLandingPlacements,
} from '../controllers/editorialPlacementsController';

const router = Router();

router.get('/landing', getLandingPlacements);
router.put('/landing', updateLandingPlacements);
router.get('/calendar-page', getCalendarPagePlacements);
router.put('/calendar-page', updateCalendarPagePlacements);

export default router;
