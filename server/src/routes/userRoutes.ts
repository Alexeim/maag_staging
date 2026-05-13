import { Router } from 'express';
import { createUserProfile, getUserProfile, updateUserProfile } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, createUserProfile);
router.get('/:uid', requireAuth, getUserProfile);
router.put('/:uid', requireAuth, updateUserProfile);

export default router;
