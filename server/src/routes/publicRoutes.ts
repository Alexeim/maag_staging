import { Router } from 'express';
import {
  getPublicCalendar,
  getPublicCulture,
  getPublicLanding,
  getPublicParis,
} from '../controllers/publicLandingController';
import {
  getMaterialsByTag,
  getPublicInterviews,
  getPublicNews,
} from '../controllers/publicMaterialsController';

const router = Router();

router.get('/landing', getPublicLanding);
router.get('/culture', getPublicCulture);
router.get('/paris', getPublicParis);
router.get('/calendar', getPublicCalendar);
router.get('/materials-by-tag', getMaterialsByTag);
router.get('/news', getPublicNews);
router.get('/interviews', getPublicInterviews);

export default router;
