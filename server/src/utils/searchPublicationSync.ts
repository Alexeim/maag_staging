import { buildSearchRecords, SearchRecordTooLargeError, toPublicationId, type SearchRecord, type SearchRecordAuthor } from './searchRecords';
import type { SearchIndexAdapter } from './searchIndexSync';

/**
 * Keeps the search index in line with one Firestore document, under three
 * facts: events arrive at least once and out of order; Algolia has no
 * conditional write; a batch that timed out may still be applied later.
 *
 * - A lease per publication lets one handler write it at a time.
 * - A handler re-reads the document after writing and loops (max rounds)
 *   until the version it wrote is still current.
 * - Before every batch the ledger gets `verifyAfter = now + settle window`.
 *   It is written before the request, so it survives a timeout or a crash.
 *   verifyDuePublications() later compares what the index really holds
 *   (objectIDs and sourceVersion) with the document, and repairs it. The
 *   ledger's syncedVersion never vetoes that check.
 */

/** Version of a missing document: two reads of a deleted document are one state. */
export const DELETED_VERSION = 'deleted';

/** Firestore `updateTime` as a sortable string: seconds.nanoseconds. */
export const toSourceVersion = (time: { seconds: number; nanoseconds: number }): string =>
  `${time.seconds}.${String(time.nanoseconds).padStart(9, '0')}`;

export interface SourceDocument {
  exists: boolean;
  data?: Record<string, unknown>;
  // toSourceVersion(updateTime), or DELETED_VERSION when the document is missing.
  version: string;
}

export interface PublicationSource {
  readDocument(collection: string, id: string): Promise<SourceDocument>;
  readAuthor(authorId: string): Promise<SearchRecordAuthor | null>;
}

export interface LedgerEntry {
  publicationId: string;
  leaseOwner: string | null;
  leaseExpiresAt: number;
  syncedVersion: string | null;
  // When the index must be checked again (a write may land late), or null.
  verifyAfter: number | null;
  lastError: string | null;
}

export type LedgerPatch = Partial<Pick<LedgerEntry, 'syncedVersion' | 'lastError'>> & {
  // Clear verifyAfter only if it is at or before this time: a write made
  // after the check was listed keeps its own, later verifyAfter.
  clearVerifyAfterDueBy?: number;
};

export interface SyncLedger {
  /** Takes the lease or throws PublicationBusyError. */
  acquire(publicationId: string, owner: string, now: number, leaseMs: number): Promise<void>;
  /** Raises verifyAfter to at least `at`; throws LeaseLostError if not the owner. */
  notePendingWrite(publicationId: string, owner: string, at: number): Promise<void>;
  /** Frees the lease and applies the patch; throws LeaseLostError if not the owner. */
  release(publicationId: string, owner: string, patch: LedgerPatch): Promise<void>;
  /** Publications whose verifyAfter is at or before `now`. */
  listDueForVerification(now: number): Promise<string[]>;
}

export type SyncIndex = Pick<SearchIndexAdapter, 'syncPublication' | 'listPublicationRecords'>;

export interface SyncOptions {
  handlerTimeoutMs: number;
  leaseMs: number;
  maxRounds: number;
  settleMs: number;
}

// Starting values: the handler is killed after 60 s, so a 120 s lease cannot
// expire under a live handler; a late write is assumed to land within 10 min.
export const SYNC_DEFAULTS: SyncOptions = {
  handlerTimeoutMs: 60_000,
  leaseMs: 120_000,
  maxRounds: 3,
  settleMs: 10 * 60_000,
};

export interface SyncDeps {
  source: PublicationSource;
  ledger: SyncLedger;
  index: SyncIndex;
  now: () => number;
  options?: Partial<SyncOptions>;
}

// Transient errors: the caller rethrows them so the event is retried.
export class PublicationBusyError extends Error {
  constructor(publicationId: string) {
    super(`${publicationId} is being synced by another handler`);
    this.name = 'PublicationBusyError';
  }
}

export class LeaseLostError extends Error {
  constructor(publicationId: string) {
    super(`lease on ${publicationId} was lost`);
    this.name = 'LeaseLostError';
  }
}

export class PublicationUnstableError extends Error {
  constructor(publicationId: string, rounds: number) {
    super(`${publicationId} changed during each of ${rounds} sync rounds`);
    this.name = 'PublicationUnstableError';
  }
}

export class HandlerDeadlineError extends Error {
  constructor(publicationId: string) {
    super(`${publicationId}: handler time budget used up before writing`);
    this.name = 'HandlerDeadlineError';
  }
}

export interface SyncOutcome {
  publicationId: string;
  version: string;
  rounds: number;
  records: number;
  // Set when the document could not be indexed (too large): it was removed.
  permanentError: string | null;
}

const optionsOf = (deps: SyncDeps): SyncOptions => ({ ...SYNC_DEFAULTS, ...deps.options });

export const parsePublicationId = (publicationId: string): { collection: string; id: string } => {
  const slash = publicationId.indexOf('/');
  if (slash <= 0 || slash === publicationId.length - 1) throw new Error(`Bad publicationId "${publicationId}"`);
  return { collection: publicationId.slice(0, slash), id: publicationId.slice(slash + 1) };
};

/**
 * Records for one read document: reads the author for firstPerson only,
 * stamps the document version. An oversized document yields no records and
 * a permanentError. Shared by the sync and the read-only dry run.
 */
export const buildPublicationRecords = async (
  source: PublicationSource, collection: string, id: string, doc: SourceDocument,
): Promise<{ records: SearchRecord[]; warnings: string[]; permanentError: string | null }> => {
  const authorId = doc.data?.authorId;
  const author = collection === 'firstPerson' && typeof authorId === 'string' && authorId
    ? await source.readAuthor(authorId)
    : undefined;
  try {
    const { records, warnings } = buildSearchRecords({
      collection, id, data: doc.exists ? doc.data : undefined, author, sourceVersion: doc.version,
    });
    return { records, warnings, permanentError: null };
  } catch (error) {
    // Retrying cannot fix an oversized document: fail closed, remove it.
    if (error instanceof SearchRecordTooLargeError) return { records: [], warnings: [], permanentError: error.message };
    throw error;
  }
};

const recordsFor = (deps: SyncDeps, collection: string, id: string, doc: SourceDocument) =>
  buildPublicationRecords(deps.source, collection, id, doc);

const releaseQuietly = async (deps: SyncDeps, publicationId: string, owner: string, patch: LedgerPatch) => {
  try {
    await deps.ledger.release(publicationId, owner, patch);
  } catch (error) {
    if (!(error instanceof LeaseLostError)) throw error;
  }
};

const errorText = (error: unknown): string =>
  error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error';

/** The write loop, for a caller that already holds the lease. Releases it on success. */
const syncHoldingLease = async (
  deps: SyncDeps, collection: string, id: string, owner: string, startedAt: number,
): Promise<SyncOutcome> => {
  const { handlerTimeoutMs, maxRounds, settleMs } = optionsOf(deps);
  const publicationId = toPublicationId(collection, id);
  let doc = await deps.source.readDocument(collection, id);
  for (let round = 1; round <= maxRounds; round += 1) {
    const { records, permanentError } = await recordsFor(deps, collection, id, doc);
    const assertWithinBudget = () => {
      if (deps.now() >= startedAt + handlerTimeoutMs) throw new HandlerDeadlineError(publicationId);
    };
    assertWithinBudget();
    await deps.index.syncPublication(publicationId, records, {
      // Checked again after the index browse and after the ledger write,
      // right before sending: neither a slow browse nor a slow ledger write
      // may let a batch go out once the time budget is spent. A mark left
      // without a batch only costs one extra check later.
      beforeBatch: async () => {
        assertWithinBudget();
        await deps.ledger.notePendingWrite(publicationId, owner, deps.now() + settleMs);
        assertWithinBudget();
      },
    });
    const after = await deps.source.readDocument(collection, id);
    if (after.version === doc.version) {
      await deps.ledger.release(publicationId, owner, { syncedVersion: doc.version, lastError: permanentError });
      return { publicationId, version: doc.version, rounds: round, records: records.length, permanentError };
    }
    doc = after;
  }
  throw new PublicationUnstableError(publicationId, maxRounds);
};

/**
 * Entry point for a document change event. Throws transient errors (busy,
 * unstable, lease lost, Algolia failures) so the platform retries the event;
 * the lease is released first. Any batch that was sent left verifyAfter set.
 */
export const syncPublicationFromSource = async (
  deps: SyncDeps, { collection, id, owner }: { collection: string; id: string; owner: string },
): Promise<SyncOutcome> => {
  const publicationId = toPublicationId(collection, id);
  const startedAt = deps.now();
  await deps.ledger.acquire(publicationId, owner, startedAt, optionsOf(deps).leaseMs);
  try {
    return await syncHoldingLease(deps, collection, id, owner, startedAt);
  } catch (error) {
    await releaseQuietly(deps, publicationId, owner, { lastError: errorText(error) });
    throw error;
  }
};

export type VerifyResult =
  | { publicationId: string; status: 'verified' }
  | { publicationId: string; status: 'repaired'; outcome: SyncOutcome }
  | { publicationId: string; status: 'failed'; error: string };

/**
 * Checks one publication against what the index really holds. Consistent:
 * clears verifyAfter. Otherwise: rewrites it (which sets a new verifyAfter,
 * so the repair is checked too). The ledger's syncedVersion is not trusted.
 */
export const verifyPublication = async (
  deps: SyncDeps, { publicationId, owner }: { publicationId: string; owner: string },
): Promise<VerifyResult> => {
  const { collection, id } = parsePublicationId(publicationId);
  const startedAt = deps.now();
  await deps.ledger.acquire(publicationId, owner, startedAt, optionsOf(deps).leaseMs);
  try {
    const doc = await deps.source.readDocument(collection, id);
    const { records, permanentError } = await recordsFor(deps, collection, id, doc);
    const indexed = await deps.index.listPublicationRecords(publicationId);
    const expected = new Set(records.map((record) => record.objectID));
    const consistent = indexed.length === expected.size
      && indexed.every((record) => expected.has(record.objectID) && record.sourceVersion === doc.version);
    if (consistent) {
      // An oversized document is "consistent" with an empty index; keep its reason.
      await deps.ledger.release(publicationId, owner, {
        clearVerifyAfterDueBy: startedAt, syncedVersion: doc.version, lastError: permanentError,
      });
      return { publicationId, status: 'verified' };
    }
    const outcome = await syncHoldingLease(deps, collection, id, owner, startedAt);
    return { publicationId, status: 'repaired', outcome };
  } catch (error) {
    await releaseQuietly(deps, publicationId, owner, { lastError: errorText(error) });
    throw error;
  }
};

export interface VerifyBatchLimits {
  // Stop after this many publications; the rest stay due for the next run.
  maxPublications?: number;
  // Start no new publication at or after this time (deps.now() clock); one
  // already started finishes within its own handler budget.
  deadlineMs?: number;
}

export interface VerifyBatchResult {
  due: number;
  results: VerifyResult[];
  // Due publications left for the next run because of the limits.
  deferred: number;
}

/**
 * The scheduled check: publications whose verifyAfter has passed, within
 * the run's limits. One failure does not stop the others; failed and
 * deferred publications stay due and are tried in the next run.
 */
export const verifyDuePublicationsBatch = async (
  deps: SyncDeps, owner: string, limits: VerifyBatchLimits = {},
): Promise<VerifyBatchResult> => {
  const due = await deps.ledger.listDueForVerification(deps.now());
  const results: VerifyResult[] = [];
  // Sequential on purpose: a handful of publications, no burst against Algolia.
  for (const publicationId of due) {
    if (limits.maxPublications !== undefined && results.length >= limits.maxPublications) break;
    if (limits.deadlineMs !== undefined && deps.now() >= limits.deadlineMs) break;
    try {
      results.push(await verifyPublication(deps, { publicationId, owner }));
    } catch (error) {
      results.push({ publicationId, status: 'failed', error: errorText(error) });
    }
  }
  return { due: due.length, results, deferred: due.length - results.length };
};

/** Every due publication, no limits. */
export const verifyDuePublications = async (deps: SyncDeps, owner: string): Promise<VerifyResult[]> =>
  (await verifyDuePublicationsBatch(deps, owner)).results;
