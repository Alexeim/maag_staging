import { describe, expect, test } from 'vitest';
import type { BatchWriteParams, BrowseParamsObject, BrowseResponse, IndexSettings } from 'algoliasearch';
import { readAlgoliaWriteConfig } from '../src/services/algoliaClient';
import { findSettingsDrift, SEARCH_INDEX_SETTINGS } from '../src/utils/searchIndexSettings';
import {
  createSearchIndexAdapter, planPublicationSync, publicationFilter, type SearchIndexClient,
} from '../src/utils/searchIndexSync';
import { buildSearchRecords, type SearchRecord } from '../src/utils/searchRecords';

type Stored = Record<string, unknown> & { objectID: string };

// In-memory stand-in for one Algolia index: exact publicationId filter,
// batch actions in order, updateObject replaces the whole record.
const createFakeClient = (initial: Stored[] = []) => {
  const records = new Map(initial.map((record) => [record.objectID, record]));
  const batches: BatchWriteParams[] = [];
  let failNextBatch = false;
  // Applies only the first N actions of the next batch, then fails.
  let partialNextBatch: number | null = null;
  let settings: IndexSettings = {};
  let taskID = 0;
  const client: SearchIndexClient = {
    async browseObjects<T>({ browseParams, aggregator }: {
      indexName: string; browseParams: BrowseParamsObject; aggregator: (response: BrowseResponse<T>) => void;
    }) {
      const match = /^publicationId:"((?:[^"\\]|\\.)*)"$/.exec(browseParams.filters ?? '');
      if (!match) throw new Error(`fake: unsupported filter ${browseParams.filters}`);
      const wanted = match[1].replace(/\\(.)/g, '$1');
      const hits = [...records.values()].filter((record) => record.publicationId === wanted);
      aggregator({ hits } as unknown as BrowseResponse<T>);
      return {};
    },
    async batch({ batchWriteParams }) {
      if (failNextBatch) {
        failNextBatch = false;
        throw new Error('fake: network error');
      }
      batches.push(batchWriteParams);
      const limit = partialNextBatch ?? batchWriteParams.requests.length;
      for (const { action, body } of batchWriteParams.requests.slice(0, limit)) {
        const objectID = String(body.objectID);
        if (action === 'deleteObject') records.delete(objectID);
        else if (action === 'updateObject') records.set(objectID, { ...body, objectID });
        else throw new Error(`fake: unexpected action ${action}`);
      }
      if (partialNextBatch !== null) {
        partialNextBatch = null;
        throw new Error('fake: connection lost mid-batch');
      }
      taskID += 1;
      return { taskID };
    },
    async waitForTask() { return {}; },
    async getSettings() { return settings; },
    async setSettings({ indexSettings }) {
      settings = { ...settings, ...indexSettings };
      taskID += 1;
      return { taskID };
    },
  };
  return {
    client, records, batches,
    failNextBatch: () => { failNextBatch = true; },
    applyOnlyFirst: (count: number) => { partialNextBatch = count; },
  };
};

const published = { published: true };
const paragraph = (text: string) => ({ type: 'paragraph', text });
// ~6 KB of Cyrillic per paragraph: two never fit one 10 000-byte record,
// so three paragraphs give exactly three chunks.
const longParagraph = (marker: string) => `${marker} ${'длинный текст статьи '.repeat(150)}`;

const articleVersions = {
  threeChunks: { ...published, title: 'Тестовая статья', tags: ['театр'], content: [
    paragraph(longParagraph('ОДИН')), paragraph(longParagraph('ДВА')), paragraph(longParagraph('ТРИ')),
  ] },
  oneChunk: { ...published, title: 'Тестовая статья', tags: ['театр'], content: [paragraph('Короткая версия')] },
};

const recordsFor = (data: unknown, id = 'a1'): SearchRecord[] =>
  buildSearchRecords({ collection: 'articles', id, data }).records;

const seed = (data: unknown, id = 'a1'): Stored[] =>
  recordsFor(data, id).map((record) => ({ ...record }));

describe('planPublicationSync', () => {
  test('deletes come before updates; a foreign record is refused', () => {
    const records = recordsFor(articleVersions.oneChunk);
    const plan = planPublicationSync('articles/a1', ['articles/a1#2', 'articles/a1#0', 'articles/a1#1'], records);
    expect(plan.requests.map((request) => `${request.action} ${String(request.body.objectID)}`)).toEqual([
      'deleteObject articles/a1#1', 'deleteObject articles/a1#2', 'updateObject articles/a1#0',
    ]);
    expect(() => planPublicationSync('articles/other', [], records)).toThrow(/does not belong/);
  });

  test('the filter is an exact, escaped match', () => {
    expect(publicationFilter('articles/a"1\\x')).toBe('publicationId:"articles/a\\"1\\\\x"');
  });
});

describe('three transitions of one article', () => {
  test('3 chunks → 1 chunk: #0 rewritten, #1 and #2 deleted', async () => {
    const before = seed(articleVersions.threeChunks);
    expect(before.map((record) => record.objectID)).toEqual(['articles/a1#0', 'articles/a1#1', 'articles/a1#2']);
    const fake = createFakeClient(before);
    const result = await createSearchIndexAdapter(fake.client, 'maag_materials_dev')
      .syncPublication('articles/a1', recordsFor(articleVersions.oneChunk));
    expect(result.upsertObjectIDs).toEqual(['articles/a1#0']);
    expect(result.deleteObjectIDs).toEqual(['articles/a1#1', 'articles/a1#2']);
    expect([...fake.records.keys()]).toEqual(['articles/a1#0']);
    expect(fake.records.get('articles/a1#0')?.content).toBe('Короткая версия');
  });

  test('open → paid: #0 replaced without text, #1 and #2 deleted, no old text left', async () => {
    const fake = createFakeClient(seed(articleVersions.threeChunks));
    const result = await createSearchIndexAdapter(fake.client, 'maag_materials_dev')
      .syncPublication('articles/a1', recordsFor({ ...articleVersions.threeChunks, paid: true }));
    expect(result.upsertObjectIDs).toEqual(['articles/a1#0']);
    expect(result.deleteObjectIDs).toEqual(['articles/a1#1', 'articles/a1#2']);
    const remaining = fake.records.get('articles/a1#0');
    expect(remaining).toMatchObject({ access: 'restricted', title: 'Тестовая статья' });
    expect(remaining).not.toHaveProperty('content');
    expect(JSON.stringify([...fake.records.values()])).not.toMatch(/ОДИН|ДВА|ТРИ|длинный/);
  });

  test('unpublished: every record deleted, nothing written', async () => {
    const fake = createFakeClient(seed(articleVersions.threeChunks));
    const result = await createSearchIndexAdapter(fake.client, 'maag_materials_dev')
      .syncPublication('articles/a1', recordsFor({ ...articleVersions.threeChunks, published: false }));
    expect(result.upsertObjectIDs).toEqual([]);
    expect(result.deleteObjectIDs).toEqual(['articles/a1#0', 'articles/a1#1', 'articles/a1#2']);
    expect(fake.records.size).toBe(0);
  });
});

describe('repeats, neighbours and failures', () => {
  test('a repeated sync converges: same state, nothing to delete', async () => {
    const fake = createFakeClient();
    const adapter = createSearchIndexAdapter(fake.client, 'maag_materials_dev');
    const records = recordsFor(articleVersions.threeChunks);
    await adapter.syncPublication('articles/a1', records);
    const snapshot = JSON.stringify([...fake.records.entries()]);
    const again = await adapter.syncPublication('articles/a1', records);
    expect(again.deleteObjectIDs).toEqual([]);
    expect(JSON.stringify([...fake.records.entries()])).toBe(snapshot);
  });

  test('a publication whose id shares a prefix is not touched', async () => {
    const fake = createFakeClient([...seed(articleVersions.threeChunks, 'a1'), ...seed(articleVersions.oneChunk, 'a10')]);
    await createSearchIndexAdapter(fake.client, 'maag_materials_dev').syncPublication('articles/a1', []);
    expect([...fake.records.keys()]).toEqual(['articles/a10#0']);
  });

  test('a failed batch is reported, changes nothing, and a retry finishes the job', async () => {
    const fake = createFakeClient(seed(articleVersions.threeChunks));
    const adapter = createSearchIndexAdapter(fake.client, 'maag_materials_dev');
    fake.failNextBatch();
    await expect(adapter.syncPublication('articles/a1', [])).rejects.toThrow('fake: network error');
    expect(fake.records.size).toBe(3);
    const retry = await adapter.syncPublication('articles/a1', []);
    expect(retry.deleteObjectIDs).toHaveLength(3);
    expect(fake.records.size).toBe(0);
  });

  // open (3 chunks) → paid sends: delete #1, delete #2, update #0.
  test.each([
    { applied: 1, leftAfterFailure: ['articles/a1#0', 'articles/a1#2'] },
    { applied: 2, leftAfterFailure: ['articles/a1#0'] },
  ])('open → paid, batch dies after $applied action(s): old text stays until the retry removes it', async ({ applied, leftAfterFailure }) => {
    const fake = createFakeClient(seed(articleVersions.threeChunks));
    const adapter = createSearchIndexAdapter(fake.client, 'maag_materials_dev');
    const paidRecords = recordsFor({ ...articleVersions.threeChunks, paid: true });

    fake.applyOnlyFirst(applied);
    await expect(adapter.syncPublication('articles/a1', paidRecords)).rejects.toThrow('mid-batch');
    // The window: #0 is still the old open chunk with its text.
    expect([...fake.records.keys()].sort()).toEqual(leftAfterFailure);
    expect(fake.records.get('articles/a1#0')).toMatchObject({ access: 'open' });
    expect(String(fake.records.get('articles/a1#0')?.content)).toContain('ОДИН');

    // The retry starts from what the index holds now and finishes the job.
    const retry = await adapter.syncPublication('articles/a1', paidRecords);
    expect(retry.deleteObjectIDs).toEqual(leftAfterFailure.filter((id) => id !== 'articles/a1#0'));
    expect(retry.upsertObjectIDs).toEqual(['articles/a1#0']);
    expect([...fake.records.keys()]).toEqual(['articles/a1#0']);
    expect(fake.records.get('articles/a1#0')).toMatchObject({ access: 'restricted' });
    expect(JSON.stringify([...fake.records.values()])).not.toMatch(/ОДИН|ДВА|ТРИ|длинный/);
  });

  test('nothing to do means no batch call', async () => {
    const fake = createFakeClient();
    const result = await createSearchIndexAdapter(fake.client, 'maag_materials_dev').syncPublication('articles/none', []);
    expect(result.taskID).toBeNull();
    expect(fake.batches).toEqual([]);
  });
});

describe('settings', () => {
  test('distinct by publicationId, which is also filterable', () => {
    expect(SEARCH_INDEX_SETTINGS).toMatchObject({
      attributeForDistinct: 'publicationId', distinct: true,
      attributesForFaceting: ['filterOnly(publicationId)'],
    });
    for (const attribute of ['objectID', 'publicationId', 'href', 'type', 'access', 'collection', 'sourceId']) {
      expect(SEARCH_INDEX_SETTINGS.searchableAttributes.join(' ')).not.toContain(attribute);
    }
  });

  test('assertSettings fails on drift and passes after applySettings', async () => {
    const fake = createFakeClient();
    const adapter = createSearchIndexAdapter(fake.client, 'maag_materials_dev');
    await expect(adapter.assertSettings()).rejects.toThrow(/attributesForFaceting/);
    await adapter.applySettings();
    await expect(adapter.assertSettings()).resolves.toBeUndefined();
    expect(findSettingsDrift({ ...SEARCH_INDEX_SETTINGS, distinct: 1 })).toEqual([]);
  });
});

describe('config', () => {
  const env = { ALGOLIA_APP_ID: 'APP', ALGOLIA_WRITE_API_KEY: 'super-secret-key', ALGOLIA_INDEX_NAME: 'maag_materials_dev' };

  test('accepts the dev and prod index names only', () => {
    expect(readAlgoliaWriteConfig(env).indexName).toBe('maag_materials_dev');
    expect(readAlgoliaWriteConfig({ ...env, ALGOLIA_INDEX_NAME: 'maag_materials_prod' }).indexName).toBe('maag_materials_prod');
    for (const name of ['maag_pilot', 'maag_materials', 'other']) {
      expect(() => readAlgoliaWriteConfig({ ...env, ALGOLIA_INDEX_NAME: name })).toThrow(/must be one of/);
    }
  });

  test('names missing variables without printing any value', () => {
    let message = '';
    try {
      readAlgoliaWriteConfig({ ALGOLIA_WRITE_API_KEY: 'super-secret-key' });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toBe('Missing environment variables: ALGOLIA_APP_ID, ALGOLIA_INDEX_NAME');
    expect(() => readAlgoliaWriteConfig({ ...env, ALGOLIA_INDEX_NAME: 'maag_pilot' })).not.toThrow(/super-secret/);
  });
});
