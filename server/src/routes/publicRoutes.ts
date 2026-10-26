import { Router } from 'express';
import {
  getFrenchLanding,
  getFrenchCulture,
  getFrenchParis,
  getPublicCalendar,
  getPublicCulture,
  getPublicLanding,
  getPublicParis,
} from '../controllers/publicLandingController';
import {
  getMaterialsByAuthor,
  getMaterialsByTag,
  getPublicInterviews,
  getPublicNews,
} from '../controllers/publicMaterialsController';
import { getPublicRelated } from '../controllers/publicRelatedController';

import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/fr/landing', requireAdmin, getFrenchLanding);
router.get('/fr/culture', requireAdmin, getFrenchCulture);
router.get('/fr/paris', requireAdmin, getFrenchParis);

router.get('/landing', getPublicLanding);
router.get('/culture', getPublicCulture);
router.get('/paris', getPublicParis);
router.get('/calendar', getPublicCalendar);
router.get('/materials-by-tag', getMaterialsByTag);
router.get('/materials-by-author', getMaterialsByAuthor);
router.get('/news', getPublicNews);
router.get('/interviews', getPublicInterviews);
router.get('/related/:type/:id', getPublicRelated);

export default router;
