import dotenv from 'dotenv';
import { SYNC_LEDGER_COLLECTION } from '../../src/services/firestoreSyncLedger';

// Vitest setup file for the ledger integration run against a real project.
// It writes only to TEST_LEDGER_COLLECTION, never to the production ledger,
// and runs only when explicitly asked for one named project.
export const INTEGRATION_PROJECT_ID = 'maag-60419';
// Typed as string so the guard below stays meaningful if this is ever edited.
export const TEST_LEDGER_COLLECTION: string = 'searchIndexSyncTest';

dotenv.config({ quiet: true });

if (process.env.LEDGER_INTEGRATION_PROJECT !== INTEGRATION_PROJECT_ID) {
  throw new Error(
    `Set LEDGER_INTEGRATION_PROJECT=${INTEGRATION_PROJECT_ID} to run against a real project `
    + '(use `npm run test:integration:ledger` from server/).',
  );
}
if (process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('FIRESTORE_EMULATOR_HOST is set: this run must reach the real project, not the emulator.');
}
if (TEST_LEDGER_COLLECTION === SYNC_LEDGER_COLLECTION) {
  throw new Error('The integration run must not use the production ledger collection.');
}

const raw = process.env.FIREBASE_CONFIG_JSON;
if (!raw) throw new Error('FIREBASE_CONFIG_JSON is not set (server/.env).');
let projectId: unknown;
try {
  projectId = (JSON.parse(raw) as { project_id?: unknown }).project_id;
} catch {
  throw new Error('FIREBASE_CONFIG_JSON is not valid JSON.');
}
if (projectId !== INTEGRATION_PROJECT_ID) {
  throw new Error(`The service account belongs to ${JSON.stringify(projectId)}, not ${INTEGRATION_PROJECT_ID}.`);
}
