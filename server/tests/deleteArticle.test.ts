// deleteArticle removes the French version together with the original.
import type { Request, Response } from 'express';
import { beforeEach, expect, test, vi } from 'vitest';
import { deleteArticle } from '../src/controllers/articleController';

// vi.mock is hoisted above the imports, and the controller calls getDb() while
// loading, so the fake database has to exist before anything else runs.
const fake = vi.hoisted(() => {
  const state = {
    store: {} as Record<string, Record<string, Record<string, unknown>>>,
    deleted: [] as string[],
  };
  const ref = (collection: string, id: string) => ({
    path: `${collection}/${id}`,
    get: async () => snapshot(collection, id),
  });
  const snapshot = (collection: string, id: string) => {
    const data = state.store[collection]?.[id];
    return { exists: data !== undefined, data: () => data, id };
  };
  const db = {
    collection: (collection: string) => ({ doc: (id: string) => ref(collection, id) }),
    runTransaction: async (fn: (t: unknown) => Promise<unknown>) =>
      fn({
        get: async (r: { path: string }) => {
          const [collection, id] = r.path.split('/');
          return snapshot(collection, id);
        },
        delete: (r: { path: string }) => {
          state.deleted.push(r.path);
        },
      }),
  };
  return { state, db };
});

vi.mock('../src/services/firebase', () => ({
  getDb: () => fake.db,
  deleteFileFromStorage: async () => {},
}));
vi.mock('../src/utils/contentCollections', () => ({
  normalizeContentCollectionId: () => null,
  syncSingleContentCollectionMembershipInTransaction: async () => {},
}));


const callDelete = async (id: string) => {
  const res = { statusCode: 0 } as Response & { statusCode: number };
  res.status = ((code: number) => {
    res.statusCode = code;
    return res;
  }) as Response['status'];
  res.send = (() => res) as Response['send'];
  res.json = (() => res) as Response['json'];
  await deleteArticle({ params: { id } } as unknown as Request, res);
  return res.statusCode;
};

beforeEach(() => {
  fake.state.deleted = [];
  fake.state.store = {
    articles: { ru1: { title: 'С переводом', content: [] }, ru2: { title: 'Без', content: [] } },
    articles_fr: { fr1: { sourceId: 'ru1' } },
    articles_fr_by_source: { ru1: { translationId: 'fr1' } },
  };
});

test('deleting an article deletes its French version and the lookup document', async () => {
  expect(await callDelete('ru1')).toBe(204);
  expect(fake.state.deleted.sort()).toEqual(
    ['articles/ru1', 'articles_fr/fr1', 'articles_fr_by_source/ru1'].sort(),
  );
});

test('an article without a translation is deleted as before', async () => {
  expect(await callDelete('ru2')).toBe(204);
  expect(fake.state.deleted).toEqual(['articles/ru2']);
});
