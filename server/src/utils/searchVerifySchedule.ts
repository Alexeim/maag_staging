import { randomUUID } from 'node:crypto';
import { verifyDuePublicationsBatch, type SyncDeps, type VerifyBatchResult } from './searchPublicationSync';
import type { TriggerLogger } from './searchSyncTrigger';

/**
 * The scheduled ledger check. Every run takes the publications whose
 * verifyAfter has passed and compares the index with Firestore; see
 * verifyPublication. Starting values:
 * - every 5 minutes, so a due mark (10 min window) waits at most 5 more;
 * - at most 50 publications and no new one after 230 s of a 300 s function
 *   timeout, so one started late still has its 60 s handler budget;
 * - no Scheduler retry: whatever is left or failed stays due for the next run.
 */
export const SEARCH_VERIFY_SCHEDULE = 'every 5 minutes';
export const SEARCH_VERIFY_TIMEOUT_SECONDS = 300;
export const SEARCH_VERIFY_LIMITS = { maxPublications: 50, runBudgetMs: 230_000 };

export interface ScheduledVerifyContext {
  getDeps: () => SyncDeps;
  log: TriggerLogger;
  // Injected in tests; the real batch otherwise.
  verifyBatch?: typeof verifyDuePublicationsBatch;
  newId?: () => string;
}

/**
 * One scheduled run. Per-publication failures are counted and logged, not
 * thrown. If the run itself fails (e.g. the ledger query), it throws so the
 * run is marked failed; the next run starts from the ledger again.
 */
export const runScheduledVerification = async (
  { getDeps, log, verifyBatch = verifyDuePublicationsBatch, newId = randomUUID }: ScheduledVerifyContext,
): Promise<VerifyBatchResult> => {
  const deps = getDeps();
  const owner = `schedule:${newId()}`;
  const startedAt = deps.now();
  try {
    const batch = await verifyBatch(deps, owner, {
      maxPublications: SEARCH_VERIFY_LIMITS.maxPublications,
      deadlineMs: startedAt + SEARCH_VERIFY_LIMITS.runBudgetMs,
    });
    const count = (status: string) => batch.results.filter((result) => result.status === status).length;
    // Ids, counts and error names only, never material text.
    log.info('search verification run', {
      owner,
      due: batch.due,
      verified: count('verified'),
      repaired: count('repaired'),
      failed: count('failed'),
      deferred: batch.deferred,
      repairedPublications: batch.results.filter((r) => r.status === 'repaired').map((r) => r.publicationId),
      failedPublications: batch.results.flatMap((r) => (r.status === 'failed' ? [{ publicationId: r.publicationId, error: r.error }] : [])),
    });
    return batch;
  } catch (error) {
    log.error('search verification run failed', {
      owner, error: error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error',
    });
    throw error;
  }
};
