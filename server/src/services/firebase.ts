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
      storageBucket: 'maag-60419.firebasestorage.app',
    });
    console.log('[firebase]: Firebase Admin SDK initialized successfully from FIREBASE_CONFIG_JSON.');

  } catch (error: any) {
    console.error('[firebase]: Error initializing Firebase Admin SDK:', error.message);
    process.exit(1);
  }
}

export const getAuth = () => admin.app().auth();
export const getDb = () => admin.app().firestore();
export const getStorage = () => admin.app().storage();

/**
 * Deletes a file from Firebase Storage based on its public URL.
 * @param {string} fileUrl The public URL of the file to delete.
 * @returns {Promise<void>}
 */
export const deleteFileFromStorage = async (fileUrl: string): Promise<void> => {
  if (!fileUrl || !fileUrl.startsWith('https://firebasestorage.googleapis.com')) {
    console.log(`[Storage] Invalid or non-Firebase URL provided: ${fileUrl}. Skipping deletion.`);
    return;
  }

  try {
    const bucket = getStorage().bucket(); // Use the default bucket
    
    // Extract the URL-encoded path from the URL
    const pathRegex = /\/o\/(.*?)\?alt=media/;
    const match = fileUrl.match(pathRegex);

    if (match && match[1]) {
      const encodedFilePath = match[1];
      const decodedFilePath = decodeURIComponent(encodedFilePath);
      
      const file = bucket.file(decodedFilePath);
      console.log(`[Storage] Attempting to delete file with path: ${decodedFilePath}`);
      await file.delete();
      console.log(`[Storage] Successfully deleted: ${decodedFilePath}`);
    } else {
      console.warn(`[Storage] Could not extract file path from URL: ${fileUrl}`);
    }
  } catch (error: any) {
    // It's often okay if a file doesn't exist (e.g., already deleted), so we check the error code.
    if (error.code === 404) {
      console.warn(`[Storage] File not found, skipping deletion: ${fileUrl}`);
    } else {
      console.error(`[Storage] Error deleting file from URL ${fileUrl}:`, error);
    }
  }
};
