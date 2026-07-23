import { Router } from "express";
import { createSession, verifySession } from "../controllers/authController";

const router = Router();

router.post("/session", createSession);
router.post("/verify-session", verifySession);

export default router;
