import type { Request, Response } from 'express';
import { beforeEach, expect, test, vi } from 'vitest';

type Data = Record<string, unknown>;
type Store = Record<string, Record<string, Data>>;
const fake = vi.hoisted(() => {
  const state = { store: {} as Store, frenchQueries: 0 };
  const doc = (name: string, id: string) => ({
    id, exists: state.store[name]?.[id] !== undefined,
    data: () => state.store[name]?.[id],
  });
  const db = {
    collection: (name: string) => {
      let limit = Infinity;
      let ordered = false;
      const query = {
        doc: (id: string) => ({ get: async () => doc(name, id) }),
        select: (..._fields: string[]) => query,
        orderBy: (_field: string, _direction: string) => { ordered = true; return query; },
        limit: (value: number) => { limit = value; return query; },
        get: async () => {
          if (name === 'articles_fr') state.frenchQueries++;
          let entries = Object.entries(state.store[name] ?? {});
          if (ordered) entries = entries.sort((a, b) => Number(b[1].publishedAt) - Number(a[1].publishedAt));
          return { docs: entries.slice(0, limit).map(([id]) => doc(name, id)) };
        },
      };
      return query;
    },
  };
  return { state, db };
});
vi.mock('../src/services/firebase', () => ({ getDb: () => fake.db }));
import * as controller from '../src/controllers/publicLandingController';

type Handler = (req: Request, res: Response) => Promise<unknown>;
const call = async (handler: Handler): Promise<Data> => {
  let result: Data = {};
  const response = {
    setHeader: vi.fn(),
    status: (code: number) => { expect(code).toBe(200); return response; },
    json: (payload: Data) => { result = payload; },
  };
  await handler({} as Request, response as unknown as Response);
  return result;
};
const cards = (value: unknown): Data[] => {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(cards);
  const object = value as Data;
  return [ ...(object.contentType ? [object] : []), ...Object.values(object).flatMap(cards) ];
};

beforeEach(() => {
  const article = (category: string, publishedAt: number): Data => ({
    title: 'Русский заголовок', cardTitle: 'Русская карточка', lead: 'Русский лид',
    published: true, publishedAt, category, imageUrl: 'image.jpg', authorId: 'author',
  });
  fake.state.frenchQueries = 0;
  fake.state.store = {
    articles: {
      culture: article('culture', 100), paris: article('paris', 90),
      missing: article('culture', 110), draft: { ...article('culture', 120), published: false },
      tips: { ...article('paris', 80), articleType: 'tips' },
    },
    articles_fr: Object.fromEntries(['culture', 'paris', 'draft', 'tips'].map((id) => [
      `fr-${id}`, { sourceId: id, title: `Titre ${id}`, lead: 'Texte français',
        cardTitle: 'Carte française', published: true, publishedAt: 100 },
    ])),
    guides: { guide: { ...article('culture', 70), title: 'Русский гид' } },
    news: { news: { ...article('paris', 60), title: 'Русская новость' } },
    authors: { author: { firstName: 'Имя', lastName: 'Фамилия' } },
    editorialPlacements: { landing: {
      mainHero: { type: 'article', id: 'culture' },
      parisHero: { type: 'article', id: 'paris' },
    } },
  };
});

for (const [name, french, russian] of [
  ['landing', controller.getFrenchLanding, controller.getPublicLanding],
  ['culture', controller.getFrenchCulture, controller.getPublicCulture],
  ['paris', controller.getFrenchParis, controller.getPublicParis],
] as const) {
  test(`${name}: automatic and manual cards use French articles and Russian other materials`, async () => {
    const payload = await call(french);
    const all = cards(payload);
    const articles = all.filter((card) => card.contentType === 'article');
    expect(articles.length).toBeGreaterThan(0);
    for (const card of articles) {
      expect(card.title).toBe(`Titre ${card.id}`);
      expect(card.cardTitle).toBe('Carte française');
      expect(card.imageUrl).toBe('image.jpg');
      expect(card.authorName).toBe('Имя Фамилия');
      expect(card.href).toBe(`/fr/${card.id === 'tips' ? 'tips' : 'article'}/${card.id}`);
      expect(['missing', 'draft']).not.toContain(card.id);
    }
    const others = all.filter((card) => card.contentType !== 'article');
    expect(others.length).toBeGreaterThan(0);
    for (const card of others) expect(String(card.href)).not.toMatch(/^\/fr\//);
    expect(fake.state.frenchQueries).toBe(1);

    const ru = cards(await call(russian)).filter((card) => card.contentType === 'article');
    expect(ru.length).toBeGreaterThan(0);
    for (const card of ru) {
      expect(card.title).toBe('Русский заголовок');
      expect(String(card.href)).not.toMatch(/^\/fr\//);
    }
    expect(fake.state.frenchQueries).toBe(1);
  });
}

test('manual untranslated articles collapse instead of falling back to Russian', async () => {
  fake.state.store.editorialPlacements.landing.mainHero = { type: 'article', id: 'missing' };
  const payload = await call(controller.getFrenchLanding);
  expect((payload.mainBlock as Data).mainArticle).toBeNull();
});

test('each request reads current translations without keeping another request’s cache', async () => {
  await call(controller.getFrenchCulture);
  fake.state.store.articles_fr['fr-culture'].title = 'Titre corrigé';
  const payload = await call(controller.getFrenchCulture);
  expect(cards(payload).find((card) => card.id === 'culture')?.title).toBe('Titre corrigé');
  expect(fake.state.frenchQueries).toBe(2);
});

test('unpublished French versions are excluded even when the source is published', async () => {
  fake.state.store.articles_fr['fr-culture'].published = false;
  expect(cards(await call(controller.getFrenchLanding)).some((card) => card.id === 'culture')).toBe(false);
});
