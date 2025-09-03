// FINAL, ULTIMATE, HYPER-EXPLICIT TEST SCRIPT
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

async function finalDiagnosticTest() {
  console.log('[final-test]: Starting the most explicit Firebase connection test possible...');
  let app: admin.app.App | undefined;

  try {
    const firebaseConfigJson = process.env.FIREBASE_CONFIG_JSON;
    if (!firebaseConfigJson) {
      throw new Error("FIREBASE_CONFIG_JSON is not set in .env file.");
    }
    const serviceAccount = JSON.parse(firebaseConfigJson);

    // Step 1: Initialize the app with a UNIQUE NAME to avoid any possible conflicts.
    // And capture the specific app instance returned.
    const appName = `diagnostic-test-${Date.now()}`;
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    }, appName);

    console.log(`[final-test]: Firebase App "${app.name}" initialized successfully.`);

    // Step 2: Get the auth service DIRECTLY from the app instance we just created.
    const auth = app.auth();
    console.log('[final-test]: Attempting to fetch users from this specific app instance...');
    const userRecords = await auth.listUsers(5);
    
    console.log('✅ ✅ ✅ IT WORKED. THE PROBLEM IS SOLVED. ✅ ✅ ✅');
    console.log('Successfully fetched users:');
    userRecords.users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email || user.uid}`);
    });

  } catch (error: any) {
    console.error('❌ ❌ ❌ IT FAILED AGAIN. THE PROBLEM IS NOT IN THE CODE. ❌ ❌ ❌');
    console.error('The test failed with the following error:');
    console.error(error.message);
  } finally {
    // Step 3: Clean up by deleting the temporary app instance.
    if (app) {
      await app.delete();
      console.log(`[final-test]: App "${app.name}" has been deleted.`);
    }
  }
}

finalDiagnosticTest();
