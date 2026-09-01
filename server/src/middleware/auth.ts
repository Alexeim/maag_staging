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
// rejects anyone who is not an admin. Used to gate editorial writes.
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
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
