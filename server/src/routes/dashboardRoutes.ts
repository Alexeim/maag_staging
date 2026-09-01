import { Router } from 'express';
import { getDashboardOverview } from '../controllers/dashboardController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/overview', requireAdmin, getDashboardOverview);

export default router;
