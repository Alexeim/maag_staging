import { describe, expect, test } from 'vitest';
import type { SearchRecordAuthor } from '../src/utils/searchRecords';
import type { BrowseResponse } from 'algoliasearch';
import { createSearchIndexAdapter, type SearchIndexClient } from '../src/utils/searchIndexSync';
import {
  DELETED_VERSION, LeaseLostError, PublicationBusyError, syncPublicationFromSource,
  type PublicationSource, type SyncDeps, type SyncLedger,
} from '../src/utils/searchPublicationSync';
import {
  applyBackfill, assertFirstImportTarget, createCachedAuthorReader, dryRunBackfill, FIRST_IMPORT_TARGET, retryCommandFor,
  type BackfillAuthorReader, type BackfillDocument, type BackfillPageReader, type SyncOne,
} from '../src/utils/searchBackfill';

// A published document in Firestore always carries its publication date.
const PUBLISHED = { published: true, publishedAt: { _seconds: 1_790_000_000, _nanoseconds: 0 } };

// Pages over in-memory collections, ordered by id, recording every request.
const fakePages = (collections: Record<string, BackfillDocument[]>) => {
  const requests: string[] = [];
  const reader: BackfillPageReader = {
    async readPage(collection, afterId, limit) {
      requests.push(`${collection} after=${afterId ?? 'null'} limit=${limit}`);
      const docs = [...(collections[collection] ?? [])].sort((a, b) => a.id.localeCompare(b.id));
      const start = afterId === null ? 0 : docs.findIndex((doc) => doc.id > afterId);
      return start < 0 ? [] : docs.slice(start, start + limit);
    },
  };
  return { reader, requests };
};

const fakeAuthors = (authors: Record<string, SearchRecordAuthor>) => {
  const reads: string[] = [];
  const reader: BackfillAuthorReader = {
    async readAuthor(authorId) { reads.push(authorId); return authors[authorId] ?? null; },
  };
  return { reader, reads };
};

const article = (id: string, extra: Record<string, unknown> = {}): BackfillDocument => ({
  id, version: `v-${id}`,
  data: { ...PUBLISHED, title: `Статья ${id}`, content: [{ type: 'paragraph', text: `Текст ${id}` }], ...extra },
});

describe('page boundaries', () => {
  test('each page starts after the last id of the previous one; nothing skipped or repeated', async () => {
    const docs = ['a', 'b', 'c', 'd', 'e'].map((id) => article(id));
    const { reader, requests } = fakePages({ articles: docs });
    const report = await dryRunBackfill({ pages: reader, authors: fakeAuthors({}).reader, pageSize: 2, collections: ['articles'] });
    expect(requests).toEqual(['articles after=null limit=2', 'articles after=b limit=2', 'articles after=d limit=2']);
    expect(report.collections[0]).toMatchObject({ pages: 3, documentsRead: 5, indexable: 5, records: 5 });
  });

  test('a count that is a multiple of the page size ends with one empty page', async () => {
    const { reader, requests } = fakePages({ news: ['a', 'b', 'c', 'd'].map((id) => article(id)) });
    const report = await dryRunBackfill({ pages: reader, authors: fakeAuthors({}).reader, pageSize: 2, collections: ['news'] });
    expect(requests).toEqual(['news after=null limit=2', 'news after=b limit=2', 'news after=d limit=2']);
    expect(report.collections[0]).toMatchObject({ pages: 2, documentsRead: 4 });
  });
});

describe('authors', () => {
  test('one read per author per run, also under concurrent requests', async () => {
    const { reader, reads } = fakeAuthors({ au1: { firstName: 'Иван', lastName: 'Петров' } });
    const cached = createCachedAuthorReader(reader);
    await Promise.all([cached.readAuthor('au1'), cached.readAuthor('au1'), cached.readAuthor('au1')]);
    expect(reads).toEqual(['au1']);
    expect(cached.reads()).toBe(1);
  });

  test('firstPerson documents of one author read it once; other types never', async () => {
    const fp = (id: string): BackfillDocument => ({ id, version: `v-${id}`, data: { ...PUBLISHED, title: 'о кино', authorId: 'au1' } });
    const { reader: pages } = fakePages({ firstPerson: [fp('f1'), fp('f2'), fp('f3')], articles: [article('a1', { authorId: 'au1' })] });
    const authors = fakeAuthors({ au1: { firstName: 'Иван', lastName: 'Петров' } });
    const report = await dryRunBackfill({ pages, authors: authors.reader, collections: ['firstPerson', 'articles'] });
    expect(authors.reads).toEqual(['au1']);
    expect(report.authorReads).toBe(1);
    expect(report.totals.warnings).toBe(0);
  });
});

describe('counts and problems', () => {
  test('drafts, paid, warnings and errors are counted per collection and in total', async () => {
    const { reader } = fakePages({
      articles: [
        article('a1'),
        article('a2', { published: false }),
        article('a3', { paid: true, imageUrl: 'https://c.example/a3.jpg' }),
        article('a4', { title: 'Я'.repeat(6_000) }),
      ],
      firstPerson: [{ id: 'f1', version: 'v-f1', data: { ...PUBLISHED, title: 'о кино', authorId: 'missing' } }],
    });
    const report = await dryRunBackfill({ pages: reader, authors: fakeAuthors({}).reader, collections: ['articles', 'firstPerson'] });
    const [articles, firstPerson] = report.collections;
    expect(articles).toMatchObject({ documentsRead: 4, indexable: 2, restricted: 1, records: 2 });
    expect(articles.errors).toEqual([{ publicationId: 'articles/a4', message: expect.stringMatching(/limit is 10000/) }]);
    expect(firstPerson.warnings).toEqual([
      { publicationId: 'firstPerson/f1', message: 'author name missing; displayTitle is the stored title tail' },
    ]);
    expect(report.totals).toMatchObject({ documentsRead: 5, indexable: 3, restricted: 1, records: 3, warnings: 1, errors: 1 });
  });
});

describe('read-only', () => {
  test('only page and author reads happen; no document re-read, nothing to write with', async () => {
    const calls: string[] = [];
    const pages: BackfillPageReader = {
      async readPage(collection, afterId, limit) {
        calls.push(`readPage ${collection}`);
        return collection === 'firstPerson' && afterId === null
          ? [{ id: 'f1', version: 'v1', data: { ...PUBLISHED, title: 'о кино', authorId: 'au1' } }].slice(0, limit)
          : [];
      },
    };
    const authors: BackfillAuthorReader = { async readAuthor(id) { calls.push(`readAuthor ${id}`); return { firstName: 'Иван' }; } };
    const report = await dryRunBackfill({ pages, authors });
    expect(calls.filter((call) => !call.startsWith('readPage '))).toEqual(['readAuthor au1']);
    expect(calls.filter((call) => call.startsWith('readPage '))).toHaveLength(9);
    expect(report.totals).toMatchObject({ documentsRead: 1, records: 1 });
  });
});

describe('apply', () => {
  // In-memory Firestore (versions bump on every write), ledger with leases, and Algolia.
  const createWorld = () => {
    const docs = new Map<string, { data: Record<string, unknown>; version: string }>();
    let counter = 0;
    const write = (collection: string, id: string, data: Record<string, unknown>) => {
      counter += 1;
      docs.set(`${collection}/${id}`, { data, version: `v${counter}` });
    };
    const source: PublicationSource = {
      async readDocument(collection, id) {
        const doc = docs.get(`${collection}/${id}`);
        return doc ? { exists: true, data: doc.data, version: doc.version } : { exists: false, version: DELETED_VERSION };
      },
      async readAuthor() { return null; },
    };
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
    const syncOne: SyncOne = (collection, id) => syncPublicationFromSource(deps, { collection, id, owner: `backfill:test:${id}` });
    // Pages list what Firestore holds at the moment of the read.
    const pagesFor = (afterRead?: (page: BackfillDocument[]) => void): BackfillPageReader => ({
      async readPage(collection, afterId, limit) {
        const all = [...docs.entries()]
          .filter(([key]) => key.startsWith(`${collection}/`))
          .map(([key, doc]) => ({ id: key.slice(collection.length + 1), data: doc.data, version: doc.version }))
          .sort((a, b) => a.id.localeCompare(b.id));
        const start = afterId === null ? 0 : all.findIndex((doc) => doc.id > afterId);
        const page = start < 0 ? [] : all.slice(start, start + limit);
        afterRead?.(page);
        return page;
      },
    });
    return { write, records, syncOne, pagesFor };
  };

  const openArticle = {
    ...PUBLISHED, title: 'Святые угодники и колбасники', imageUrl: 'https://c.example/a1.jpg',
    content: [{ type: 'paragraph', text: 'Открытый текст: месса в честь Святого Антония' }],
  };

  test('race: open when the page was read, closed by the editor before the lease → only the closed card is indexed', async () => {
    const world = createWorld();
    world.write('articles', 'a1', openArticle); // v1, open
    const pageSaw: string[] = [];
    const pages = world.pagesFor((page) => {
      if (page.some((doc) => doc.id === 'a1')) {
        pageSaw.push(`a1 paid=${String(page.find((doc) => doc.id === 'a1')!.data.paid)}`);
        // The editor closes the article after the page read, before the backfill takes the lease.
        world.write('articles', 'a1', { ...openArticle, paid: true }); // v2, closed
      }
    });
    const report = await applyBackfill({ pages, syncOne: world.syncOne, collections: ['articles'] });

    expect(pageSaw).toEqual(['a1 paid=undefined']);
    expect(report.totals).toMatchObject({ listed: 1, synced: 1, withRecords: 1, records: 1, failures: 0 });
    expect([...world.records.keys()]).toEqual(['articles/a1#0']);
    expect(world.records.get('articles/a1#0')).toMatchObject({ access: 'restricted', sourceVersion: 'v2', title: 'Святые угодники и колбасники' });
    expect(world.records.get('articles/a1#0')).not.toHaveProperty('content');
    expect(JSON.stringify([...world.records.values()])).not.toMatch(/Открытый текст|Антония/);
  });

  test('every id goes to the sync, drafts included; page boundaries hold', async () => {
    const calls: string[] = [];
    const { reader, requests } = fakePages({
      articles: ['a', 'b', 'c'].map((id) => article(id, id === 'b' ? { published: false } : {})),
    });
    const report = await applyBackfill({
      pages: reader, pageSize: 2, collections: ['articles'],
      syncOne: async (collection, id) => {
        calls.push(`${collection}/${id}`);
        return { publicationId: `${collection}/${id}`, version: 'v', rounds: 1, records: id === 'b' ? 0 : 1, permanentError: null };
      },
    });
    expect(calls).toEqual(['articles/a', 'articles/b', 'articles/c']);
    expect(requests).toEqual(['articles after=null limit=2', 'articles after=b limit=2']);
    expect(report.collections[0]).toMatchObject({ pages: 2, listed: 3, synced: 3, withRecords: 2, records: 2 });
  });

  test('a failed publication is reported with its reason and retry command; the run goes on', async () => {
    const { reader } = fakePages({ news: ['n1', 'n2', 'n3'].map((id) => article(id)) });
    const report = await applyBackfill({
      pages: reader, collections: ['news'],
      syncOne: async (collection, id) => {
        if (id === 'n2') throw new PublicationBusyError(`${collection}/${id}`);
        return { publicationId: `${collection}/${id}`, version: 'v', rounds: 1, records: 1, permanentError: null };
      },
    });
    expect(report.totals).toMatchObject({ listed: 3, synced: 2, failures: 1 });
    expect(report.collections[0].failures).toEqual([
      { publicationId: 'news/n2', error: 'PublicationBusyError: news/n2 is being synced by another handler' },
    ]);
    expect(retryCommandFor('news/n2')).toBe('npm run search:sync -- --publication news/n2 --apply');
  });

  test('not indexable publications are listed separately, not as failures', async () => {
    const { reader } = fakePages({ guides: [article('g1')] });
    const report = await applyBackfill({
      pages: reader, collections: ['guides'],
      syncOne: async () => ({ publicationId: 'guides/g1', version: 'v', rounds: 1, records: 0, permanentError: 'too large' }),
    });
    expect(report.totals).toMatchObject({ synced: 1, notIndexable: 1, failures: 0 });
  });
});

describe('first import target', () => {
  test('only maag-60419 / IS5SOWASMH / maag_materials_dev is allowed', () => {
    expect(() => assertFirstImportTarget({ ...FIRST_IMPORT_TARGET })).not.toThrow();
    expect(() => assertFirstImportTarget({ ...FIRST_IMPORT_TARGET, indexName: 'maag_materials_prod' }))
      .toThrow('--apply refused: indexName is "maag_materials_prod", expected "maag_materials_dev"');
    expect(() => assertFirstImportTarget({ projectId: 'other', appId: 'OTHER', indexName: 'maag_pilot' }))
      .toThrow(/projectId is "other".*appId is "OTHER".*indexName is "maag_pilot"/);
  });
});
