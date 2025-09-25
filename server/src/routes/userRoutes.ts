import { Router } from 'express';
import { createUserProfile, getUserProfile, updateUserProfile } from '../controllers/userController';

const router = Router();

router.post('/', createUserProfile);
router.get('/:uid', getUserProfile);
router.put('/:uid', updateUserProfile);

export default router;
