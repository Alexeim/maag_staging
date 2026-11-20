import type { Request, Response } from 'express';
import { beforeEach, expect, test, vi } from 'vitest';

type Data = Record<string, unknown>;
type Store = Record<string, Record<string, Data>>;
const fake = vi.hoisted(() => {
  const state = { store: {} as Store };
  const doc = (name: string, id: string) => ({
    id, exists: state.store[name]?.[id] !== undefined,
    data: () => state.store[name]?.[id],
  });
  const db = {
    collection: (name: string) => {
      let limit = Infinity;
      const query = {
        doc: (id: string) => ({ get: async () => doc(name, id) }),
        select: (..._fields: string[]) => query,
        orderBy: (_field: string, _direction: string) => query,
        limit: (value: number) => { limit = value; return query; },
        get: async () => ({
          docs: Object.keys(state.store[name] ?? {}).slice(0, limit).map((id) => doc(name, id)),
        }),
      };
      return query;
    },
  };
  return { state, db };
});
vi.mock('../src/services/firebase', () => ({ getDb: () => fake.db }));
import { getPublicLanding } from '../src/controllers/publicLandingController';

const callLanding = async (): Promise<Data> => {
  let result: Data = {};
  const response = {
    setHeader: vi.fn(),
    status: (code: number) => { expect(code).toBe(200); return response; },
    json: (payload: Data) => { result = payload; },
  };
  await getPublicLanding({} as Request, response as unknown as Response);
  return result;
};

const cardsById = (value: unknown, found = new Map<string, Data>()): Map<string, Data> => {
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    value.forEach((item) => cardsById(item, found));
    return found;
  }
  const object = value as Data;
  if (object.contentType && typeof object.id === 'string') found.set(object.id, object);
  Object.values(object).forEach((item) => cardsById(item, found));
  return found;
};

beforeEach(() => {
  const material = (extra: Data): Data => ({
    title: 'о том, как', authorId: 'author', category: 'culture',
    isMaagChoice: true, published: true, publishedAt: 100, ...extra,
  });
  fake.state.store = {
    firstPerson: {
      legacy: material({}),
      firstPerson: material({ variant: 'first-person', imageUrl: 'main.jpg' }),
      opinion: material({ variant: 'opinion', imageUrl: 'opinion.jpg' }),
      junkVariant: material({ variant: 'something', imageUrl: 'junk.jpg' }),
    },
    authors: { author: { firstName: 'Имя', lastName: 'Фамилия', noBgAvatar: 'portrait.png' } },
  };
});

test('first-person cards show the author portrait, opinion cards their main image', async () => {
  const cards = cardsById(await callLanding());

  expect(cards.get('legacy')).toMatchObject({ variant: 'first-person', imageUrl: 'portrait.png' });
  expect(cards.get('firstPerson')).toMatchObject({ variant: 'first-person', imageUrl: 'portrait.png' });
  expect(cards.get('opinion')).toMatchObject({ variant: 'opinion', imageUrl: 'opinion.jpg' });
  // Anything but "opinion" is read as "first-person".
  expect(cards.get('junkVariant')).toMatchObject({ variant: 'first-person', imageUrl: 'portrait.png' });
});
