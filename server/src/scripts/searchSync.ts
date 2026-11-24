/**
 * Syncs one publication into the Algolia index named in ALGOLIA_INDEX_NAME.
 *
 * Usage (run from server/):
 *   npm run search:sync -- --publication articles/<id>          # dry run: reads only
 *   npm run search:sync -- --publication articles/<id> --apply  # lease, batch, ledger
 *
 * The dry run reads the document (and its author for firstPerson), builds
 * the records in memory and reads the index; it takes no lease, writes no
 * ledger entry and sends no batch.
 */
import 'dotenv/config';
import { parseArgs } from 'node:util';
import { getDb } from '../services/firebase';
import { createAlgoliaSearchIndex, readAlgoliaWriteConfig } from '../services/algoliaClient';
import { createFirestorePublicationSource } from '../services/firestorePublicationSource';
import { createFirestoreSyncLedger } from '../services/firestoreSyncLedger';
import type { SyncLedger } from '../utils/searchPublicationSync';
import { runSearchSyncCommand, type DryRunReport } from '../utils/searchSyncCommand';

const firebaseProjectId = (): string => {
  try {
    return String((JSON.parse(process.env.FIREBASE_CONFIG_JSON ?? '{}') as { project_id?: unknown }).project_id);
  } catch {
    return 'unknown';
  }
};

const printDryRun = (report: DryRunReport): void => {
  const { document } = report;
  console.log(`Document: exists=${document.exists}, published=${String(document.published)}, paid=${String(document.paid)}`);
  console.log(`Title: ${document.title ?? '—'}`);
  console.log(`Firestore version (updateTime): ${document.version}`);
  if (report.warnings.length > 0) console.log(`Warnings: ${report.warnings.join('; ')}`);
  if (report.permanentError) console.log(`Not indexable: ${report.permanentError}`);
  if (report.settingsProblem) console.log(`WARNING, index settings: ${report.settingsProblem}`);
  console.log(`Planned changes (${report.rows.length}):`);
  for (const row of report.rows) {
    const inIndex = !row.inIndex ? 'not in index' : (row.indexVersion ?? 'in index, NO sourceVersion');
    console.log(`  ${row.objectID}\n    index:    ${inIndex}\n    expected: ${row.expectedVersion ?? '— (removed)'}\n    action:   ${row.action}`);
  }
  console.log('Dry run: read-only. No lease taken, no ledger entry written, no batch sent. Re-run with --apply to sync.');
};

const run = async (): Promise<void> => {
  const { values } = parseArgs({ options: { publication: { type: 'string' }, apply: { type: 'boolean' } } });
  if (!values.publication) throw new Error('Pass --publication <collection>/<id>, e.g. articles/QV0VLZSMsyT9gHVxYGkj');
  const apply = values.apply === true;
  const config = readAlgoliaWriteConfig();
  console.log(`Algolia app: ${config.appId}`);
  console.log(`Algolia index: ${config.indexName}`);
  console.log(`Firebase project: ${firebaseProjectId()}`);
  console.log(`Publication: ${values.publication}`);
  console.log(`Mode: ${apply ? 'APPLY' : 'dry run'}`);

  const db = getDb();
  // The ledger exists only for --apply; the dry run never receives it.
  const ledger: SyncLedger | null = apply ? createFirestoreSyncLedger(db, Date.now) : null;
  const report = await runSearchSyncCommand({
    publicationId: values.publication,
    apply,
    source: createFirestorePublicationSource(db),
    index: createAlgoliaSearchIndex(config),
    ledger: ledger ?? {
      // Unreachable in a dry run (runSearchSyncCommand never passes it on); fail loudly if it ever is.
      acquire: () => Promise.reject(new Error('no ledger in dry run')),
      notePendingWrite: () => Promise.reject(new Error('no ledger in dry run')),
      release: () => Promise.reject(new Error('no ledger in dry run')),
      listDueForVerification: () => Promise.reject(new Error('no ledger in dry run')),
    },
    now: Date.now,
    owner: `manual-cli:${process.pid}:${Date.now()}`,
  });

  if (report.mode === 'dry-run') {
    printDryRun(report);
  } else {
    const { outcome } = report;
    console.log(`Synced ${outcome.publicationId}: version ${outcome.version}, ${outcome.records} record(s), ${outcome.rounds} round(s)`
      + (outcome.permanentError ? `; not indexable: ${outcome.permanentError}` : ''));
  }
};

run().catch((error: unknown) => {
  // Message only: SDK errors carry request traces that are never printed.
  console.error(`Failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
