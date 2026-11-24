import { describe, expect, test } from 'vitest';
import type { SearchRecordAuthor } from '../src/utils/searchRecords';
import {
  createCachedAuthorReader, dryRunBackfill,
  type BackfillAuthorReader, type BackfillDocument, type BackfillPageReader,
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
