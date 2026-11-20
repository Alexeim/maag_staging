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
      const filters: Array<(data: Data) => boolean> = [];
      const query = {
        doc: (id: string) => ({ get: async () => doc(name, id) }),
        where: (field: string, op: string, value: unknown) => {
          filters.push((data) => op === 'array-contains'
            ? Array.isArray(data[field]) && (data[field] as unknown[]).includes(value)
            : data[field] === value);
          return query;
        },
        get: async () => ({
          docs: Object.entries(state.store[name] ?? {})
            .filter(([, data]) => filters.every((matches) => matches(data)))
            .map(([id]) => doc(name, id)),
        }),
      };
      return query;
    },
  };
  return { state, db };
});
vi.mock('../src/services/firebase', () => ({ getDb: () => fake.db }));
import { getMaterialsByAuthor, getMaterialsByTag } from '../src/controllers/publicMaterialsController';

type Handler = (req: Request, res: Response) => Promise<unknown>;
const call = async (handler: Handler, query: Data): Promise<Data> => {
  let result: Data = {};
  const response = {
    status: (code: number) => { expect(code).toBe(200); return response; },
    json: (payload: Data) => { result = payload; },
  };
  await handler({ query } as unknown as Request, response as unknown as Response);
  return result;
};

type Group = { contentType: string; label: string; pageParam: string; items: Data[] };
const groupOf = (payload: Data, type: string): Group | undefined =>
  (payload.groups as Group[]).find((group) => group.contentType === type);

beforeEach(() => {
  const material = (extra: Data): Data => ({
    title: 'о том, как', authorId: 'author', tags: ['books'],
    // Flagged for the landing rail on purpose: must still be a row here.
    isMaagChoice: true, published: true, publishedAt: 100, ...extra,
  });
  fake.state.store = {
    firstPerson: {
      legacy: material({}),
      firstPerson: material({ variant: 'first-person', imageUrl: 'main.jpg' }),
      opinion: material({ variant: 'opinion', imageUrl: 'opinion.jpg' }),
      draft: material({ variant: 'opinion', imageUrl: 'draft.jpg', published: false }),
    },
    authors: { author: { firstName: 'Имя', lastName: 'Фамилия', noBgAvatar: 'portrait.png' } },
  };
});

for (const [name, handler, query] of [
  ['tag', getMaterialsByTag, { tag: 'books' }],
  ['author', getMaterialsByAuthor, { authorId: 'author' }],
] as const) {
  test(`${name}: firstPerson documents split into two sections by variant`, async () => {
    const payload = await call(handler, query);

    const firstPerson = groupOf(payload, 'first-person');
    expect(firstPerson).toMatchObject({ label: 'От первого лица', pageParam: 'firstPersonPage' });
    expect(firstPerson?.items.map((item) => item.id).sort()).toEqual(['firstPerson', 'legacy']);

    const opinion = groupOf(payload, 'opinion');
    expect(opinion).toMatchObject({ label: 'Мнения', pageParam: 'opinionPage' });
    // The draft stays out.
    expect(opinion?.items.map((item) => item.id)).toEqual(['opinion']);

    const byId = new Map([...firstPerson!.items, ...opinion!.items].map((item) => [item.id, item]));
    expect(byId.get('firstPerson')).toMatchObject({ imageUrl: 'main.jpg', href: '/first-person/firstPerson' });
    expect(byId.get('opinion')).toMatchObject({ imageUrl: 'opinion.jpg', authorName: 'Имя Фамилия' });
    // Saved before the main image was required: author's portrait instead.
    expect(byId.get('legacy')).toMatchObject({ imageUrl: 'portrait.png' });
  });
}

test('tag: flagged firstPerson documents do not move into the aside', async () => {
  const payload = await call(getMaterialsByTag, { tag: 'books' });
  expect(payload.sidebarCards).toEqual([]);
});
