import { Router } from 'express';
import { getDashboardOverview } from '../controllers/dashboardController';

const router = Router();

router.get('/overview', getDashboardOverview);

export default router;
