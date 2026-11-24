import { afterAll, beforeAll } from 'vitest';
import { cert, deleteApp, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { SYNC_LEDGER_COLLECTION } from '../../src/services/firestoreSyncLedger';
import { defineLedgerScenarios } from '../ledger/ledgerScenarios';
import { INTEGRATION_PROJECT_ID, TEST_LEDGER_COLLECTION } from './requireLedgerIntegration';

let app: App;
let db: Firestore;
const runId = `${Date.now()}`;
const created: string[] = [];

beforeAll(() => {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG_JSON as string) as ServiceAccount;
  app = initializeApp({ credential: cert(serviceAccount), projectId: INTEGRATION_PROJECT_ID }, `ledger-integration-${runId}`);
  db = getFirestore(app);
});

afterAll(async () => {
  // Ids only: the ledger holds no material text.
  console.log(`[ledger integration] run ${runId}: ${created.length} document(s) checked in ${TEST_LEDGER_COLLECTION}; first: ${created[0]}`);
  await deleteApp(app);
});

defineLedgerScenarios({
  title: `Firestore SyncLedger on ${INTEGRATION_PROJECT_ID}, collection ${TEST_LEDGER_COLLECTION}`,
  getDb: () => db,
  collectionName: TEST_LEDGER_COLLECTION,
  forbiddenCollection: SYNC_LEDGER_COLLECTION,
  // Fictional ids: no real material has them.
  idPrefix: `zz-ledger-test-${runId}`,
  onDocumentCreated: (path) => { created.push(path); },
});
