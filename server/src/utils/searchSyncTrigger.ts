import { randomUUID } from 'node:crypto';
import { SEARCH_SOURCES } from './searchCorpus';
import { toPublicationId } from './searchRecords';
import { syncPublicationFromSource, type SyncDeps, type SyncOutcome } from './searchPublicationSync';

/**
 * One Firestore write trigger per search source. The collection comes from
 * this table, never from the event; the document id from the path
 * parameter. `key` becomes part of the function name, so it is lowercase
 * letters and digits only (2nd gen functions are Cloud Run services).
 */
export interface SearchSyncTrigger {
  key: string;
  collection: string;
  document: string;
}

export const SEARCH_SYNC_TRIGGERS: SearchSyncTrigger[] = SEARCH_SOURCES.map(({ collection }) => ({
  key: collection.toLowerCase().replace(/[^a-z0-9]/g, ''),
  collection,
  document: `${collection}/{docId}`,
}));

// The parts of a Firestore write event the handler uses. The payload
// (before/after) is ignored on purpose: the sync re-reads the document.
export interface DocumentWrittenEvent {
  id: string;
  params: { docId: string };
}

export interface TriggerLogger {
  info(message: string, fields: Record<string, unknown>): void;
  error(message: string, fields: Record<string, unknown>): void;
}

export interface TriggerContext {
  // Built once per instance by the caller (Firestore, ledger, Algolia).
  getDeps: () => SyncDeps;
  log: TriggerLogger;
  // Injected in tests; the real sync otherwise.
  sync?: typeof syncPublicationFromSource;
  newId?: () => string;
}

/**
 * Handles one document write: passes the collection and document id to the
 * lease-guarded sync. Transient failures are rethrown so the platform
 * retries the event; permanent ones are handled inside the sync.
 */
export const handleSearchDocumentWritten = async (
  collection: string,
  event: DocumentWrittenEvent,
  { getDeps, log, sync = syncPublicationFromSource, newId = randomUUID }: TriggerContext,
): Promise<SyncOutcome> => {
  const id = event.params.docId;
  const publicationId = toPublicationId(collection, id);
  // Unique per invocation: a duplicated delivery of one event must not share a lease.
  const owner = `event:${event.id}:${newId()}`;
  try {
    const outcome = await sync(getDeps(), { collection, id, owner });
    // Ids and counts only, never material text.
    log.info('search sync done', {
      publicationId, eventId: event.id, version: outcome.version, records: outcome.records,
      rounds: outcome.rounds, permanentError: outcome.permanentError,
    });
    return outcome;
  } catch (error) {
    log.error('search sync failed, the event will be retried', {
      publicationId, eventId: event.id,
      error: error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error',
    });
    throw error;
  }
};
