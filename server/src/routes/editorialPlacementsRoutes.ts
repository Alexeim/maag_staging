import { Router } from 'express';
import {
  getLandingPlacements,
  updateLandingPlacements,
} from '../controllers/editorialPlacementsController';

const router = Router();

router.get('/landing', getLandingPlacements);
router.put('/landing', updateLandingPlacements);

export default router;
