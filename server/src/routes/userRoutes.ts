import { Router } from 'express';
import {
  addUserBookmark,
  createUserProfile,
  getUserBookmarks,
  getUserProfile,
  removeUserBookmark,
  updateUserProfile,
} from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, createUserProfile);
router.get('/:uid', requireAuth, getUserProfile);
router.put('/:uid', requireAuth, updateUserProfile);
router.get('/:uid/bookmarks', requireAuth, getUserBookmarks);
router.post('/:uid/bookmarks', requireAuth, addUserBookmark);
router.delete('/:uid/bookmarks/:contentType/:contentId', requireAuth, removeUserBookmark);

export default router;
