// Vitest setup file for the emulator suite: refuse to run unless the
// Firestore Emulator is the target. Without this, firebase-admin could fall
// back to real credentials and a real project.
export const EMULATOR_PROJECT_ID = 'demo-maag-search-test';

const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host) {
  throw new Error(
    'FIRESTORE_EMULATOR_HOST is not set. Run this suite through `npm run test:emulator` (from server/), '
    + 'which starts the Firestore Emulator and sets it.',
  );
}

// `demo-` project ids never reach real Firebase resources, even by mistake.
const project = process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
if (project !== undefined && project !== EMULATOR_PROJECT_ID) {
  throw new Error(`Emulator tests must run as project ${EMULATOR_PROJECT_ID}, got ${project}.`);
}
