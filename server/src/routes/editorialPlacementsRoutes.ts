import { Router } from 'express';
import {
  getCalendarPagePlacements,
  getCulturePagePlacements,
  getLandingPlacements,
  getParisPagePlacements,
  updateCalendarPagePlacements,
  updateCulturePagePlacements,
  updateLandingPlacements,
  updateParisPagePlacements,
} from '../controllers/editorialPlacementsController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/landing', getLandingPlacements);
router.put('/landing', requireAdmin, updateLandingPlacements);
router.get('/calendar-page', getCalendarPagePlacements);
router.put('/calendar-page', requireAdmin, updateCalendarPagePlacements);
router.get('/culture-page', getCulturePagePlacements);
router.put('/culture-page', requireAdmin, updateCulturePagePlacements);
router.get('/paris-page', getParisPagePlacements);
router.put('/paris-page', requireAdmin, updateParisPagePlacements);

export default router;
