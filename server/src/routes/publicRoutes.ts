import { Router } from 'express';
import {
  getPublicCalendar,
  getPublicCulture,
  getPublicLanding,
  getPublicParis,
} from '../controllers/publicLandingController';

const router = Router();

router.get('/landing', getPublicLanding);
router.get('/culture', getPublicCulture);
router.get('/paris', getPublicParis);
router.get('/calendar', getPublicCalendar);

export default router;
