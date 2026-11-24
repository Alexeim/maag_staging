import { afterAll, beforeAll } from 'vitest';
import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { EMULATOR_PROJECT_ID } from './requireEmulator';
import { SYNC_LEDGER_COLLECTION } from '../../src/services/firestoreSyncLedger';
import { defineLedgerScenarios } from '../ledger/ledgerScenarios';

let app: App;
let db: Firestore;

beforeAll(() => {
  // No credentials: with FIRESTORE_EMULATOR_HOST set, firebase-admin talks to the emulator.
  app = initializeApp({ projectId: EMULATOR_PROJECT_ID }, `ledger-emulator-${Date.now()}`);
  db = getFirestore(app);
});

afterAll(async () => {
  await deleteApp(app);
});

// The production collection name is fine here: this database is the emulator's.
defineLedgerScenarios({
  title: 'Firestore SyncLedger on the emulator',
  getDb: () => db,
  collectionName: SYNC_LEDGER_COLLECTION,
  idPrefix: `ledger-${Date.now()}`,
});
