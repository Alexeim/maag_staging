import { getAuth, getDb } from '../services/firebase';
import { Request, Response, NextFunction } from 'express';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Like requireAuth, but also loads the caller's role from Firestore and
// rejects anyone who is not an admin. Accepts either a Bearer ID token
// (browser calls) or an X-Session-Cookie header carrying the Firebase
// session cookie (Astro SSR calls, which have no ID token). Used to gate
// editorial writes and admin-only reads.
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization?.split('Bearer ')[1];
  const sessionCookie = req.header('x-session-cookie');

  if (!bearer && !sessionCookie) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = bearer
      ? await getAuth().verifyIdToken(bearer)
      : await getAuth().verifySessionCookie(sessionCookie as string, true);

    const snap = await getDb().collection('users').doc(decoded.uid).get();
    const role = snap.exists ? snap.data()?.role : null;

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    (req as any).user = { ...decoded, role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
