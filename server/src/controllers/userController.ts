import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

// Basic user interface
export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  role: 'reader' | 'author' | 'admin';
  createdAt: Date;
}

const db = getDb();
const usersCollection = db.collection('users');

/**
 * @description Create a new user profile in Firestore
 * @route POST /api/users
 */
export const createUserProfile = async (req: Request, res: Response) => {
  try {
    const { uid, firstName, lastName } = req.body;

    if (!uid || !firstName || !lastName) {
      return res.status(400).json({ message: 'UID, firstName, and lastName are required' });
    }

    const newUserProfile: Omit<UserProfile, 'uid'> = {
      firstName,
      lastName,
      role: 'reader', // Assign a default role
      createdAt: new Date(),
    };

    // Use the Firebase Auth UID as the document ID in Firestore
    await usersCollection.doc(uid).set(newUserProfile);

    res.status(201).json({ uid, ...newUserProfile });

  } catch (error) {
    console.error('Error creating user profile:', error);
    res.status(500).json({ message: 'Server error while creating user profile' });
  }
};

/**
 * @description Get a user profile by UID
 * @route GET /api/users/:uid
 */
export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const { uid } = req.params;
        const doc = await usersCollection.doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        res.status(200).json({ uid: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ message: 'Server error while getting user profile' });
    }
};

/**
 * @description Update a user profile
 * @route PUT /api/users/:uid
 */
export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const { uid } = req.params;
        const { firstName, lastName } = req.body;

        if (!firstName || !lastName) {
            return res.status(400).json({ message: 'First name and last name are required' });
        }

        const userRef = usersCollection.doc(uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        await userRef.update({ firstName, lastName });

        const updatedDoc = await userRef.get();
        res.status(200).json({ uid: updatedDoc.id, ...updatedDoc.data() });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error while updating user profile' });
    }
};
