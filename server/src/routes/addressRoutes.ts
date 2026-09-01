import { Router } from 'express';
import { createAddress, getAddresses } from '../controllers/addressController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getAddresses);
router.post('/', requireAdmin, createAddress);

export default router;
