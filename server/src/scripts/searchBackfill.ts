/**
 * First load of the search index from the Firestore archive.
 *
 * Usage (run from server/):
 *   npm run search:backfill            # dry run (default): reads, builds records in memory
 *   npm run search:backfill -- --apply # writes: every publication through the lease-guarded sync
 *
 * Dry run: reads the nine search collections page by page in document id
 * order (plus each firstPerson author once) and reports what the index
 * should hold. No Algolia client, no lease, nothing written.
 *
 * --apply: allowed only for project maag-60419, app IS5SOWASMH and index
 * maag_materials_dev; the target and the index settings are checked before
 * the first write. Pages only list ids; each id, drafts included, goes to
 * syncPublicationFromSource, which re-reads the document under its lease.
 * Material documents are only read; Firestore writes go to searchIndexSync
 * only. Any failed publication is reported with its retry command and the
 * exit code is 1.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { getDb } from '../services/firebase';
import { createAlgoliaSearchIndex, readAlgoliaWriteConfig } from '../services/algoliaClient';
import { createFirestoreBackfillReader } from '../services/firestoreBackfillReader';
import { createFirestorePublicationSource } from '../services/firestorePublicationSource';
import { createFirestoreSyncLedger } from '../services/firestoreSyncLedger';
import {
  applyBackfill, assertFirstImportTarget, BACKFILL_PAGE_SIZE, dryRunBackfill, retryCommandFor,
} from '../utils/searchBackfill';
import { syncPublicationFromSource, type SyncDeps } from '../utils/searchPublicationSync';

const serviceAccountProjectId = (): string => {
  try {
    const projectId = (JSON.parse(process.env.FIREBASE_CONFIG_JSON ?? '{}') as { project_id?: unknown }).project_id;
    return typeof projectId === 'string' ? projectId : 'unknown';
  } catch {
    return 'unknown';
  }
};

const runDryRun = async (): Promise<void> => {
  const db = getDb();
  const report = await dryRunBackfill({
    pages: createFirestoreBackfillReader(db),
    authors: createFirestorePublicationSource(db),
  });
  console.table([
    ...report.collections.map(({ warnings, errors, ...stats }) => ({ ...stats, warnings: warnings.length, errors: errors.length })),
    { collection: 'TOTAL', ...report.totals },
  ]);
  console.log(`Author documents read: ${report.authorReads}`);
  const problems = report.collections.flatMap((stats) => [
    ...stats.errors.map((issue) => ({ kind: 'error', ...issue })),
    ...stats.warnings.map((issue) => ({ kind: 'warning', ...issue })),
  ]);
  if (problems.length > 0) {
    console.log('Problem materials:');
    problems.forEach(({ kind, publicationId, message }) => console.log(`  [${kind}] ${publicationId}: ${message}`));
  }
  console.log('Dry run: read-only. No Algolia client, no lease, no ledger entry, no batch.');
};

const runApply = async (target: { projectId: string; appId: string; indexName: string }): Promise<void> => {
  // Nothing is written before both checks pass.
  assertFirstImportTarget(target);
  const config = readAlgoliaWriteConfig();
  const index = createAlgoliaSearchIndex(config);
  await index.assertSettings();
  console.log('Target and index settings verified.');

  const db = getDb();
  const deps: SyncDeps = {
    // Material documents: read only.
    source: createFirestorePublicationSource(db),
    // The only Firestore writes: searchIndexSync.
    ledger: createFirestoreSyncLedger(db, Date.now),
    index,
    now: Date.now,
  };
  const runId = randomUUID();
  const report = await applyBackfill({
    pages: createFirestoreBackfillReader(db),
    syncOne: (collection, id) =>
      syncPublicationFromSource(deps, { collection, id, owner: `backfill:${runId}:${randomUUID()}` }),
  });

  console.table([
    ...report.collections.map(({ notIndexable, failures, ...stats }) => ({
      ...stats, notIndexable: notIndexable.length, failures: failures.length,
    })),
    { collection: 'TOTAL', ...report.totals },
  ]);
  report.collections.flatMap((stats) => stats.notIndexable).forEach(({ publicationId, message }) =>
    console.log(`  [not indexable, removed] ${publicationId}: ${message}`));
  const failures = report.collections.flatMap((stats) => stats.failures);
  if (failures.length > 0) {
    console.log(`Failed publications (${failures.length}):`);
    failures.forEach(({ publicationId, error }) =>
      console.log(`  ${publicationId}: ${error}\n    retry: ${retryCommandFor(publicationId)}`));
    process.exitCode = 1;
  }
  console.log(`Backfill run ${runId}: ${report.totals.synced}/${report.totals.listed} publications synced.`);
};

const run = async (): Promise<void> => {
  const { values } = parseArgs({ options: { apply: { type: 'boolean' } } });
  const apply = values.apply === true;
  // Only the target is read and validated here; the client exists only for --apply.
  const { appId, indexName } = readAlgoliaWriteConfig();
  const projectId = serviceAccountProjectId();
  console.log(`Firebase project: ${projectId}`);
  console.log('Firestore database: (default)');
  console.log(`Algolia app: ${appId}`);
  console.log(`Algolia index: ${indexName}${apply ? '' : ' (not contacted)'}`);
  console.log(`Mode: ${apply ? 'APPLY' : 'dry run'}, page size ${BACKFILL_PAGE_SIZE}, document id order`);
  if (apply) await runApply({ projectId, appId, indexName });
  else await runDryRun();
};

run().catch((error: unknown) => {
  console.error(`Failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
