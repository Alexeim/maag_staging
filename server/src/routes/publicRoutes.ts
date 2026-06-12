import { Router } from 'express';
import { getPublicLanding } from '../controllers/publicLandingController';

const router = Router();

router.get('/landing', getPublicLanding);

export default router;
