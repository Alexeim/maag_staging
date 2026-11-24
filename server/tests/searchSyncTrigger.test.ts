import { describe, expect, test } from 'vitest';
import type { BrowseResponse } from 'algoliasearch';
import { SEARCH_SOURCES } from '../src/utils/searchCorpus';
import { createSearchIndexAdapter, type SearchIndexClient } from '../src/utils/searchIndexSync';
import {
  DELETED_VERSION, LeaseLostError, PublicationBusyError,
  type PublicationSource, type SyncDeps, type SyncLedger, type SyncOutcome,
} from '../src/utils/searchPublicationSync';
import { handleSearchDocumentWritten, SEARCH_SYNC_TRIGGERS, type TriggerLogger } from '../src/utils/searchSyncTrigger';

const createLog = () => {
  const lines: Array<{ level: string; message: string; fields: Record<string, unknown> }> = [];
  const log: TriggerLogger = {
    info: (message, fields) => { lines.push({ level: 'info', message, fields }); },
    error: (message, fields) => { lines.push({ level: 'error', message, fields }); },
  };
  return { log, lines };
};

const okOutcome = (publicationId: string): SyncOutcome =>
  ({ publicationId, version: 'v1', rounds: 1, records: 1, permanentError: null });

describe('trigger table', () => {
  test('one trigger per search source, document path {collection}/{docId}', () => {
    expect(SEARCH_SYNC_TRIGGERS.map((trigger) => trigger.collection)).toEqual(SEARCH_SOURCES.map((source) => source.collection));
    expect(SEARCH_SYNC_TRIGGERS).toHaveLength(9);
    for (const trigger of SEARCH_SYNC_TRIGGERS) {
      expect(trigger.document).toBe(`${trigger.collection}/{docId}`);
      expect(trigger.key).toMatch(/^[a-z0-9]+$/);
    }
    expect(new Set(SEARCH_SYNC_TRIGGERS.map((trigger) => trigger.key)).size).toBe(9);
    expect(SEARCH_SYNC_TRIGGERS.filter((t) => t.key !== t.collection).map((t) => `${t.collection}→${t.key}`))
      .toEqual(['firstPerson→firstperson', 'visual-stories→visualstories', 'photosOfTheDay→photosoftheday']);
  });
});

describe('handler with the sync replaced by a spy', () => {
  test('passes the collection and the document id; ignores the event payload', async () => {
    const calls: unknown[] = [];
    const event = { id: 'evt-1', params: { docId: 'QV0VLZSMsyT9gHVxYGkj' }, data: { after: { title: 'ignored' } } };
    const { log } = createLog();
    await handleSearchDocumentWritten('articles', event, {
      getDeps: () => ({}) as SyncDeps, log, newId: () => 'u1',
      sync: async (_deps, args) => { calls.push(args); return okOutcome('articles/QV0VLZSMsyT9gHVxYGkj'); },
    });
    expect(calls).toEqual([{ collection: 'articles', id: 'QV0VLZSMsyT9gHVxYGkj', owner: 'event:evt-1:u1' }]);
  });

  test('a duplicated delivery of one event gets a different lease owner', async () => {
    const owners: string[] = [];
    const { log } = createLog();
    let n = 0;
    for (let i = 0; i < 2; i += 1) {
      await handleSearchDocumentWritten('firstPerson', { id: 'same-event', params: { docId: 'f1' } }, {
        getDeps: () => ({}) as SyncDeps, log, newId: () => `u${(n += 1)}`,
        sync: async (_deps, args) => { owners.push(args.owner); return okOutcome('firstPerson/f1'); },
      });
    }
    expect(owners).toEqual(['event:same-event:u1', 'event:same-event:u2']);
  });

  test('a transient failure is rethrown for a retry and logged without text', async () => {
    const { log, lines } = createLog();
    await expect(handleSearchDocumentWritten('interviews', { id: 'evt-2', params: { docId: 'i1' } }, {
      getDeps: () => ({}) as SyncDeps, log,
      sync: async () => { throw new PublicationBusyError('interviews/i1'); },
    })).rejects.toBeInstanceOf(PublicationBusyError);
    expect(lines).toEqual([{
      level: 'error', message: 'search sync failed, the event will be retried',
      fields: { publicationId: 'interviews/i1', eventId: 'evt-2', error: 'PublicationBusyError: interviews/i1 is being synced by another handler' },
    }]);
  });
});

describe('end to end with fakes: an editor saves an article', () => {
  test('save → event → handler → syncPublicationFromSource → index', async () => {
    // Firestore stand-in: the editor's save bumps the version.
    const docs = new Map<string, { data: Record<string, unknown>; version: string }>();
    const source: PublicationSource = {
      async readDocument(collection, id) {
        const doc = docs.get(`${collection}/${id}`);
        return doc ? { exists: true, data: doc.data, version: doc.version } : { exists: false, version: DELETED_VERSION };
      },
      async readAuthor() { return null; },
    };
    // Ledger stand-in with lease semantics.
    const leases = new Map<string, string | null>();
    const ledger: SyncLedger = {
      async acquire(publicationId, owner) {
        const holder = leases.get(publicationId);
        if (holder && holder !== owner) throw new PublicationBusyError(publicationId);
        leases.set(publicationId, owner);
      },
      async notePendingWrite(publicationId, owner) { if (leases.get(publicationId) !== owner) throw new LeaseLostError(publicationId); },
      async release(publicationId, owner) {
        if (leases.get(publicationId) !== owner) throw new LeaseLostError(publicationId);
        leases.set(publicationId, null);
      },
      async listDueForVerification() { return []; },
    };
    // Algolia stand-in.
    const records = new Map<string, Record<string, unknown>>();
    const client: SearchIndexClient = {
      async browseObjects<T>({ browseParams, aggregator }: { browseParams: { filters?: string }; aggregator: (r: BrowseResponse<T>) => void }) {
        const wanted = /^publicationId:"(.*)"$/.exec(browseParams.filters ?? '')?.[1];
        aggregator({ hits: [...records.values()].filter((r) => r.publicationId === wanted) } as unknown as BrowseResponse<T>);
        return {};
      },
      async batch({ batchWriteParams }) {
        for (const { action, body } of batchWriteParams.requests) {
          if (action === 'deleteObject') records.delete(String(body.objectID));
          else records.set(String(body.objectID), body);
        }
        return { taskID: 1 };
      },
      async waitForTask() { return {}; },
      async getSettings() { return {}; },
      async setSettings() { return { taskID: 0 }; },
    };
    const deps: SyncDeps = { source, ledger, index: createSearchIndexAdapter(client, 'maag_materials_dev'), now: () => 1_000 };

    // 1. The editor presses "Сохранить": PUT /api/articles/a1 writes the document.
    docs.set('articles/a1', {
      version: '1794851790.322851000',
      data: { published: true, title: 'Святые угодники и колбасники', content: [{ type: 'paragraph', text: 'месса в честь Святого Антония' }] },
    });
    // 2. Firestore emits a write event for articles/{docId}; the articles trigger receives it.
    const trigger = SEARCH_SYNC_TRIGGERS.find((t) => t.collection === 'articles')!;
    const { log, lines } = createLog();
    // 3. The trigger calls the handler, which calls the real sync.
    const outcome = await handleSearchDocumentWritten(trigger.collection, { id: 'evt-save', params: { docId: 'a1' } }, {
      getDeps: () => deps, log, newId: () => 'u1',
    });

    expect(outcome).toEqual({ publicationId: 'articles/a1', version: '1794851790.322851000', rounds: 1, records: 1, permanentError: null });
    expect(records.get('articles/a1#0')).toMatchObject({ title: 'Святые угодники и колбасники', sourceVersion: '1794851790.322851000' });
    expect(leases.get('articles/a1')).toBeNull();
    expect(lines).toEqual([{
      level: 'info', message: 'search sync done',
      fields: { publicationId: 'articles/a1', eventId: 'evt-save', version: '1794851790.322851000', records: 1, rounds: 1, permanentError: null },
    }]);
    expect(JSON.stringify(lines)).not.toContain('Антония');
  });
});
