// server/src/routes/stripeRoutes.ts
import express from 'express';
import { createCheckoutSession, createPortalSession, stripeWebhook } from '../controllers/stripeController';

const router = express.Router();

router.post('/create-checkout-session', createCheckoutSession);
router.post('/create-portal-session', createPortalSession);
router.post('/webhook', stripeWebhook);

export default router;
