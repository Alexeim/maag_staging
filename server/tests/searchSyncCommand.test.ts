import { describe, expect, test } from 'vitest';
import type { BrowseResponse, IndexSettings } from 'algoliasearch';
import { SEARCH_INDEX_SETTINGS } from '../src/utils/searchIndexSettings';
import { createSearchIndexAdapter, type SearchIndexClient } from '../src/utils/searchIndexSync';
import { DELETED_VERSION, type PublicationSource, type SourceDocument, type SyncLedger } from '../src/utils/searchPublicationSync';
import { runSearchSyncCommand, type DryRunReport } from '../src/utils/searchSyncCommand';

type Stored = Record<string, unknown> & { objectID: string };

const createAlgolia = (initial: Stored[], settings: IndexSettings = { ...SEARCH_INDEX_SETTINGS }) => {
  const records = new Map(initial.map((record) => [record.objectID, record]));
  const calls = { batch: 0, setSettings: 0, browse: 0, getSettings: 0 };
  const client: SearchIndexClient = {
    async browseObjects<T>({ browseParams, aggregator }: { browseParams: { filters?: string }; aggregator: (r: BrowseResponse<T>) => void }) {
      calls.browse += 1;
      const wanted = /^publicationId:"(.*)"$/.exec(browseParams.filters ?? '')?.[1];
      aggregator({ hits: [...records.values()].filter((record) => record.publicationId === wanted) } as unknown as BrowseResponse<T>);
      return {};
    },
    async batch({ batchWriteParams }) {
      calls.batch += 1;
      for (const { action, body } of batchWriteParams.requests) {
        if (action === 'deleteObject') records.delete(String(body.objectID));
        else records.set(String(body.objectID), { ...body, objectID: String(body.objectID) });
      }
      return { taskID: calls.batch };
    },
    async waitForTask() { return {}; },
    async getSettings() { calls.getSettings += 1; return settings; },
    async setSettings() { calls.setSettings += 1; return { taskID: 0 }; },
  };
  return { adapter: createSearchIndexAdapter(client, 'maag_materials_dev'), records, calls };
};

// Every ledger method records the call and throws: the dry run must touch none.
const createSpyLedger = () => {
  const calls: string[] = [];
  const refuse = (name: string) => async () => {
    calls.push(name);
    throw new Error(`ledger.${name} must not be called in a dry run`);
  };
  const ledger: SyncLedger = {
    acquire: refuse('acquire'),
    notePendingWrite: refuse('notePendingWrite'),
    release: refuse('release'),
    listDueForVerification: refuse('listDueForVerification'),
  };
  return { ledger, calls };
};

const sourceWith = (doc: SourceDocument) => {
  const reads: string[] = [];
  const source: PublicationSource = {
    async readDocument(collection, id) { reads.push(`${collection}/${id}`); return doc; },
    async readAuthor(authorId) { reads.push(`authors/${authorId}`); return null; },
  };
  return { source, reads };
};

const PUB = 'articles/a1';
const article: SourceDocument = {
  exists: true,
  version: '1794851790.322851000',
  data: { published: true, title: 'Статья', tags: ['театр'], content: [{ type: 'paragraph', text: 'Короткий текст' }] },
};
// What the index holds: #0 from an older version, #1 left over, #2 written before sourceVersion existed.
const indexed: Stored[] = [
  { objectID: `${PUB}#0`, publicationId: PUB, sourceVersion: '1700000000.000000000', content: 'старый текст' },
  { objectID: `${PUB}#1`, publicationId: PUB, sourceVersion: '1700000000.000000000', content: 'старый хвост' },
  { objectID: `${PUB}#2`, publicationId: PUB, content: 'без версии' },
  { objectID: 'articles/a10#0', publicationId: 'articles/a10', sourceVersion: 'x' },
];

const run = (apply: boolean, doc: SourceDocument, algolia: ReturnType<typeof createAlgolia>, ledger: SyncLedger) =>
  runSearchSyncCommand({
    publicationId: PUB, apply, source: sourceWith(doc).source, index: algolia.adapter, ledger,
    now: () => 1_000_000, owner: 'manual-test',
  });

describe('search:sync dry run', () => {
  test('takes no lease, sends no batch, writes nothing', async () => {
    const algolia = createAlgolia(indexed);
    const spy = createSpyLedger();
    const before = JSON.stringify([...algolia.records.entries()]);
    const report = await run(false, article, algolia, spy.ledger);
    expect(report.mode).toBe('dry-run');
    expect(spy.calls).toEqual([]);
    expect(algolia.calls).toMatchObject({ batch: 0, setSettings: 0 });
    expect(JSON.stringify([...algolia.records.entries()])).toBe(before);
  });

  test('reports, per objectID, the index version, the expected version and the action', async () => {
    const { source, reads } = sourceWith(article);
    const algolia = createAlgolia(indexed);
    const report = await runSearchSyncCommand({
      publicationId: PUB, apply: false, source, index: algolia.adapter, ledger: createSpyLedger().ledger,
      now: () => 0, owner: 'manual-test',
    }) as DryRunReport;
    expect(reads).toEqual([PUB]);
    expect(report.document).toEqual({ exists: true, version: article.version, title: 'Статья', published: true, paid: undefined });
    expect(report.settingsProblem).toBeNull();
    expect(report.rows).toEqual([
      { objectID: `${PUB}#0`, inIndex: true, indexVersion: '1700000000.000000000', expectedVersion: article.version, action: 'update' },
      { objectID: `${PUB}#1`, inIndex: true, indexVersion: '1700000000.000000000', expectedVersion: null, action: 'delete' },
      { objectID: `${PUB}#2`, inIndex: true, indexVersion: null, expectedVersion: null, action: 'delete' },
    ]);
  });

  test('a missing document plans deletes only; an empty index plans creates', async () => {
    const deleted = await run(false, { exists: false, version: DELETED_VERSION }, createAlgolia(indexed), createSpyLedger().ledger) as DryRunReport;
    expect(deleted.rows.map((row) => row.action)).toEqual(['delete', 'delete', 'delete']);
    const fresh = await run(false, article, createAlgolia([]), createSpyLedger().ledger) as DryRunReport;
    expect(fresh.rows).toEqual([
      { objectID: `${PUB}#0`, inIndex: false, indexVersion: null, expectedVersion: article.version, action: 'create' },
    ]);
  });

  test('drifted index settings are reported, not hidden', async () => {
    const report = await run(false, article, createAlgolia(indexed, {}), createSpyLedger().ledger) as DryRunReport;
    expect(report.settingsProblem).toMatch(/attributesForFaceting/);
  });
});

describe('search:sync --apply', () => {
  test('control: --apply does go through the lease and a batch', async () => {
    const algolia = createAlgolia(indexed);
    const spy = createSpyLedger();
    await expect(run(true, article, algolia, spy.ledger)).rejects.toThrow(/must not be called/);
    expect(spy.calls[0]).toBe('acquire');
  });

  test('--apply refuses drifted settings before touching the ledger', async () => {
    const algolia = createAlgolia(indexed, {});
    const spy = createSpyLedger();
    await expect(run(true, article, algolia, spy.ledger)).rejects.toThrow(/settings differ/);
    expect(spy.calls).toEqual([]);
    expect(algolia.calls.batch).toBe(0);
  });
});
