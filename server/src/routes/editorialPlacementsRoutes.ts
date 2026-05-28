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

const router = Router();

router.get('/landing', getLandingPlacements);
router.put('/landing', updateLandingPlacements);
router.get('/calendar-page', getCalendarPagePlacements);
router.put('/calendar-page', updateCalendarPagePlacements);
router.get('/culture-page', getCulturePagePlacements);
router.put('/culture-page', updateCulturePagePlacements);
router.get('/paris-page', getParisPagePlacements);
router.put('/paris-page', updateParisPagePlacements);

export default router;
