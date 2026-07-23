import { Request, Response } from "express";
import { getAuth, getDb } from "../services/firebase";

// Firebase caps session cookies at 14 days.
const SESSION_EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000;

export const createSession = async (req: Request, res: Response) => {
  const { idToken } = req.body ?? {};

  if (!idToken || typeof idToken !== "string") {
    return res.status(400).json({ error: "idToken is required" });
  }

  try {
    // Reject an already-stale ID token before minting a long-lived session from it.
    await getAuth().verifyIdToken(idToken);
    const sessionCookie = await getAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    res.status(200).json({ sessionCookie, expiresIn: SESSION_EXPIRES_IN_MS });
  } catch {
    res.status(401).json({ error: "Invalid ID token" });
  }
};

export const verifySession = async (req: Request, res: Response) => {
  const { sessionCookie } = req.body ?? {};

  if (!sessionCookie || typeof sessionCookie !== "string") {
    return res.status(400).json({ error: "sessionCookie is required" });
  }

  try {
    const decoded = await getAuth().verifySessionCookie(sessionCookie, true);
    const profileSnap = await getDb().collection("users").doc(decoded.uid).get();
    const role = profileSnap.exists ? profileSnap.data()?.role ?? "reader" : "reader";

    res.status(200).json({ uid: decoded.uid, email: decoded.email ?? null, role });
  } catch {
    res.status(401).json({ error: "Invalid session" });
  }
};
