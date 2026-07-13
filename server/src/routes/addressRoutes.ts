import { Router } from 'express';
import { createAddress, getAddresses } from '../controllers/addressController';

const router = Router();

router.get('/', getAddresses);
router.post('/', createAddress);

export default router;
