import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
  try {
    const firebaseConfigJson = process.env.FIREBASE_CONFIG_JSON;
    if (!firebaseConfigJson) {
      throw new Error("The FIREBASE_CONFIG_JSON environment variable is not set.");
    }

    const serviceAccount = JSON.parse(firebaseConfigJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[firebase]: Firebase Admin SDK initialized successfully from FIREBASE_CONFIG_JSON.');

  } catch (error: any) {
    console.error('[firebase]: Error initializing Firebase Admin SDK:', error.message);
    process.exit(1);
  }
}

export const getAuth = () => admin.app().auth();
export const getDb = () => admin.app().firestore();
