/**
 * Firestore write triggers for the nine search sources. All logic is in
 * ../server/src (tested there); this file only wires it to Cloud Functions.
 *
 * Deployed names: searchSync-<key>, e.g. searchSync-articles. No deploy
 * config is in firebase.json yet.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { defineSecret, defineString } from 'firebase-functions/params';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { createAlgoliaSearchIndex, readAlgoliaWriteConfig } from '../../server/src/services/algoliaClient';
import { createFirestorePublicationSource } from '../../server/src/services/firestorePublicationSource';
import { createFirestoreSyncLedger } from '../../server/src/services/firestoreSyncLedger';
import type { SyncDeps } from '../../server/src/utils/searchPublicationSync';
import { handleSearchDocumentWritten, SEARCH_SYNC_TRIGGERS, type TriggerLogger } from '../../server/src/utils/searchSyncTrigger';

// The write key comes from Secret Manager; app id and index name are plain
// params (readAlgoliaWriteConfig still refuses any index but dev and prod).
const ALGOLIA_WRITE_API_KEY = defineSecret('ALGOLIA_WRITE_API_KEY');
defineString('ALGOLIA_APP_ID');
defineString('ALGOLIA_INDEX_NAME');

// Built on the first event of an instance, reused afterwards. Firebase Admin
// uses the function's service account; no FIREBASE_CONFIG_JSON here.
let deps: SyncDeps | null = null;
const getDeps = (): SyncDeps => {
  if (!deps) {
    const db = getFirestore(initializeApp());
    deps = {
      source: createFirestorePublicationSource(db),
      ledger: createFirestoreSyncLedger(db, Date.now),
      index: createAlgoliaSearchIndex(readAlgoliaWriteConfig(process.env)),
      now: Date.now,
    };
  }
  return deps;
};

const log: TriggerLogger = {
  info: (message, fields) => logger.info(message, fields),
  error: (message, fields) => logger.error(message, fields),
};

export const searchSync = Object.fromEntries(SEARCH_SYNC_TRIGGERS.map(({ key, collection, document }) => [
  key,
  onDocumentWritten(
    {
      document,
      // 2nd gen triggers must run where the database is.
      region: 'europe-west9',
      // Transient failures are retried by the platform (24 h window).
      retry: true,
      // One event at a time; the per-publication lease is the real guarantee.
      maxInstances: 1,
      concurrency: 1,
      // Matches the 60 s handler budget inside the 120 s lease.
      timeoutSeconds: 60,
      secrets: [ALGOLIA_WRITE_API_KEY],
    },
    (event) => handleSearchDocumentWritten(collection, { id: event.id, params: { docId: event.params.docId } }, { getDeps, log }),
  ),
]));
