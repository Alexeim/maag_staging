import type { Request, Response } from 'express';
import { beforeEach, expect, test, vi } from 'vitest';

type Data = Record<string, unknown>;
type Store = Record<string, Record<string, Data>>;
const fake = vi.hoisted(() => {
  const state = { store: {} as Store };
  const snapshot = (collection: string, id: string, fields?: string[]) => ({
    id,
    exists: state.store[collection]?.[id] !== undefined,
    data: () => {
      const data = state.store[collection]?.[id];
      if (!data || !fields) return data;
      return Object.fromEntries(Object.entries(data).filter(([key]) => fields.includes(key)));
    },
  });
  type Ref = { collection: string; id: string };
  const db = {
    collection: (collection: string) => {
      const filters: Array<(data: Data) => boolean> = [];
      let fields: string[] | undefined;
      const query = {
        doc: (id: string) => ({ collection, id, get: async () => snapshot(collection, id) }),
        where: (field: string, _operator: string, value: unknown) => {
          filters.push((data) => data[field] === value);
          return query;
        },
        select: (...selected: string[]) => { fields = selected; return query; },
        get: async () => ({ docs: Object.entries(state.store[collection] ?? {})
          .filter(([, data]) => filters.every((filter) => filter(data)))
          .map(([id]) => snapshot(collection, id, fields)) }),
      };
      return query;
    },
    getAll: async (...args: Array<Ref | { fieldMask: string[] }>) => {
      const mask = args.at(-1) as { fieldMask: string[] };
      return (args.slice(0, -1) as Ref[])
        .map((ref) => snapshot(ref.collection, ref.id, mask.fieldMask));
    },
  };
  return { state, db };
});
vi.mock('../src/services/firebase', () => ({ getDb: () => fake.db }));
import { getPublicRelated } from '../src/controllers/publicRelatedController';

const link = (type: string, id: string) => ({
  type: 'link', linkedContentType: type, linkedContentId: id,
});
const call = async (type: string, id: string) => {
  let status = 0;
  let body: Data = {};
  const res = {
    status: (value: number) => { status = value; return res; },
    json: (value: Data) => { body = value; },
  };
  await getPublicRelated({ params: { type, id } } as unknown as Request, res as unknown as Response);
  return { status, body };
};

beforeEach(() => {
  fake.state.store = {
    firstPerson: {
      legacy: { title: 'о книгах', authorId: 'author', published: true },
      opinion: { title: 'Мнение автора', variant: 'opinion', imageUrl: 'opinion.jpg', published: true },
      draft: { title: 'Черновик', variant: 'opinion', published: false },
    },
    authors: { author: { firstName: 'Имя', lastName: 'Фамилия', noBgAvatar: 'portrait.png' } },
    articles: {
      source: { title: 'Статья', published: true, content: [
        link('first-person', 'legacy'), link('opinion', 'opinion'),
        link('opinion', 'draft'), link('first-person', 'missing'),
      ] },
      target: { title: 'Цель', imageUrl: 'article.jpg', published: true, content: ['Private full body'] },
    },
  };
});

test('article links resolve both variants, legacy titles and published cards only', async () => {
  const { status, body } = await call('article', 'source');
  expect(status).toBe(200);
  expect(body.linked).toMatchObject({
    'first-person:legacy': {
      contentType: 'first-person', title: 'Имя Фамилия о книгах',
      href: '/first-person/legacy', imageUrl: 'portrait.png',
    },
    'opinion:opinion': {
      contentType: 'opinion', title: 'Мнение автора',
      href: '/first-person/opinion', imageUrl: 'opinion.jpg',
    },
  });
  expect(Object.keys(body.linked as Data).sort()).toEqual(['first-person:legacy', 'opinion:opinion']);
});

test.each(['first-person', 'opinion'])('%s pages resolve links without adding autofill', async (variant) => {
  fake.state.store.firstPerson.source = {
    variant, published: false,
    content: [link('article', 'target'), { sections: [link('opinion', 'draft')] }],
  };
  const { status, body } = await call('first-person', 'source');
  expect(status).toBe(200);
  expect(body.autofill).toEqual([]);
  expect(Object.keys(body.linked as Data)).toEqual(['article:target']);
  expect((body.linked as Data)['article:target']).toMatchObject({ title: 'Цель', href: '/article/target' });
  expect((body.linked as Data)['article:target']).not.toHaveProperty('content');
});

test('a saved reference survives switching the target variant', async () => {
  fake.state.store.firstPerson.legacy.variant = 'opinion';
  const { body } = await call('article', 'source');
  expect((body.linked as Data)['first-person:legacy']).toMatchObject({
    contentType: 'opinion', title: 'о книгах', href: '/first-person/legacy',
  });
});

test('unknown page types and missing documents keep their error status', async () => {
  expect((await call('unknown', 'source')).status).toBe(400);
  expect((await call('first-person', 'missing')).status).toBe(404);
});
