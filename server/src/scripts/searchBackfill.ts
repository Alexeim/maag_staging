/**
 * First load of the search index from the Firestore archive.
 *
 * Usage (run from server/):
 *   npm run search:backfill            # dry run: reads Firestore, builds records in memory
 *
 * The dry run reads the nine search collections page by page in document id
 * order (plus authors/{id} once per firstPerson author) and reports what the
 * index should hold. It creates no Algolia client, takes no lease and writes
 * nothing. Writing (--apply) is a separate, later step.
 */
import 'dotenv/config';
import { parseArgs } from 'node:util';
import { getDb } from '../services/firebase';
import { readAlgoliaWriteConfig } from '../services/algoliaClient';
import { createFirestoreBackfillReader } from '../services/firestoreBackfillReader';
import { createFirestorePublicationSource } from '../services/firestorePublicationSource';
import { BACKFILL_PAGE_SIZE, dryRunBackfill } from '../utils/searchBackfill';

const run = async (): Promise<void> => {
  const { values } = parseArgs({ options: { apply: { type: 'boolean' } } });
  if (values.apply) throw new Error('--apply is not implemented yet: this step is a dry run only.');

  // Only the target name is read and validated; no Algolia client is created.
  const { indexName } = readAlgoliaWriteConfig();
  let projectId = 'unknown';
  try {
    projectId = String((JSON.parse(process.env.FIREBASE_CONFIG_JSON ?? '{}') as { project_id?: unknown }).project_id);
  } catch { /* reported as unknown */ }
  console.log(`Firebase project: ${projectId}`);
  console.log('Firestore database: (default)');
  console.log(`Target Algolia index: ${indexName} (not contacted)`);
  console.log(`Mode: dry run, page size ${BACKFILL_PAGE_SIZE}, document id order`);

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

run().catch((error: unknown) => {
  console.error(`Failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
