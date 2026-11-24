import type {
  BatchRequest, BatchWriteParams, BrowseParamsObject, BrowseResponse, IndexSettings,
} from 'algoliasearch';
import { findSettingsDrift, SEARCH_INDEX_SETTINGS } from './searchIndexSettings';
import type { SearchRecord } from './searchRecords';

/**
 * The few Algolia calls the adapter needs. The real SearchClient satisfies it
 * (see services/algoliaClient.ts); tests pass an in-memory fake.
 */
export interface SearchIndexClient {
  browseObjects<T>(options: {
    indexName: string;
    browseParams: BrowseParamsObject;
    aggregator: (response: BrowseResponse<T>) => void;
  }): Promise<unknown>;
  batch(options: { indexName: string; batchWriteParams: BatchWriteParams }): Promise<{ taskID: number }>;
  waitForTask(options: { indexName: string; taskID: number }): Promise<unknown>;
  getSettings(options: { indexName: string }): Promise<IndexSettings>;
  setSettings(options: { indexName: string; indexSettings: IndexSettings }): Promise<{ taskID: number }>;
}

export interface PublicationSyncPlan {
  publicationId: string;
  upsertObjectIDs: string[];
  deleteObjectIDs: string[];
  requests: BatchRequest[];
}

export interface PublicationSyncResult extends PublicationSyncPlan {
  taskID: number | null;
}

/**
 * Pure: what has to change so that the index holds exactly `records` for this
 * publication. Deletes come first in the batch: Algolia applies actions in
 * order and does not promise atomicity, so a partial failure leaves less
 * public text behind, never stale gated text next to the new record.
 * `updateObject` replaces a whole record, so a record that became restricted
 * loses its `content` and `introduction`.
 */
export const planPublicationSync = (
  publicationId: string,
  existingObjectIDs: readonly string[],
  records: readonly SearchRecord[],
): PublicationSyncPlan => {
  const foreign = records.find((record) => record.publicationId !== publicationId);
  if (foreign) throw new Error(`${foreign.objectID} does not belong to ${publicationId}`);
  const upsertObjectIDs = records.map((record) => record.objectID);
  const keep = new Set(upsertObjectIDs);
  const deleteObjectIDs = [...new Set(existingObjectIDs)].filter((id) => !keep.has(id)).sort();
  return {
    publicationId,
    upsertObjectIDs,
    deleteObjectIDs,
    requests: [
      ...deleteObjectIDs.map((objectID): BatchRequest => ({ action: 'deleteObject', body: { objectID } })),
      ...records.map((record): BatchRequest => ({ action: 'updateObject', body: { ...record } })),
    ],
  };
};

// Exact facet match, not a prefix: `articles/a1` must not catch `articles/a10`.
export const publicationFilter = (publicationId: string): string =>
  `publicationId:"${publicationId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

export interface IndexedRecordVersion {
  objectID: string;
  sourceVersion: string | null;
}

export interface SyncPublicationOptions {
  // Runs right before the batch is sent, and only if one is sent. If it
  // throws, nothing is sent. Used to note a pending write in the sync ledger.
  beforeBatch?: (plan: PublicationSyncPlan) => Promise<void>;
}

export const createSearchIndexAdapter = (client: SearchIndexClient, indexName: string) => {
  /** What the index holds for one publication right now: ids and source versions. */
  const listPublicationRecords = async (publicationId: string): Promise<IndexedRecordVersion[]> => {
    const found: IndexedRecordVersion[] = [];
    await client.browseObjects<{ publicationId?: string; sourceVersion?: string }>({
      indexName,
      browseParams: {
        filters: publicationFilter(publicationId),
        attributesToRetrieve: ['publicationId', 'sourceVersion'],
        hitsPerPage: 1000,
      },
      aggregator: (response) => {
        // Defensive: never act on a hit the filter should not have returned.
        response.hits
          .filter((hit) => hit.publicationId === publicationId)
          .forEach((hit) => found.push({ objectID: hit.objectID, sourceVersion: hit.sourceVersion ?? null }));
      },
    });
    return found;
  };

  /** The objectIDs the index holds for one publication right now. */
  const listPublicationObjectIDs = async (publicationId: string): Promise<string[]> =>
    (await listPublicationRecords(publicationId)).map((record) => record.objectID);

  /**
   * Makes the index hold exactly `records` for the publication (an empty
   * list removes it). Safe to repeat: it always starts from what the index
   * holds now, `updateObject` rewrites the same content and deleting a
   * missing objectID is a no-op. Waits until Algolia has applied the task,
   * so the next call sees the result.
   */
  const syncPublication = async (
    publicationId: string,
    records: readonly SearchRecord[],
    options: SyncPublicationOptions = {},
  ): Promise<PublicationSyncResult> => {
    const existing = await listPublicationObjectIDs(publicationId);
    const plan = planPublicationSync(publicationId, existing, records);
    if (plan.requests.length === 0) return { ...plan, taskID: null };
    await options.beforeBatch?.(plan);
    const { taskID } = await client.batch({ indexName, batchWriteParams: { requests: plan.requests } });
    await client.waitForTask({ indexName, taskID });
    return { ...plan, taskID };
  };

  /** Throws unless the remote index has our settings (the facet filter above depends on them). */
  const assertSettings = async (): Promise<void> => {
    const drift = findSettingsDrift(await client.getSettings({ indexName }));
    if (drift.length > 0) {
      throw new Error(`Index ${indexName} settings differ from SEARCH_INDEX_SETTINGS: ${drift.join(', ')}`);
    }
  };

  /** Writes SEARCH_INDEX_SETTINGS and waits until they are applied. */
  const applySettings = async (): Promise<number> => {
    const { taskID } = await client.setSettings({ indexName, indexSettings: SEARCH_INDEX_SETTINGS });
    await client.waitForTask({ indexName, taskID });
    return taskID;
  };

  return {
    indexName, listPublicationRecords, listPublicationObjectIDs, syncPublication, assertSettings, applySettings,
  };
};

export type SearchIndexAdapter = ReturnType<typeof createSearchIndexAdapter>;
