// Placement controller tests against an in-memory Firestore stand-in.
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';

type Collections = Record<string, Record<string, Record<string, unknown>>>;
interface Write {
  collection: string;
  id: string;
  value: Record<string, unknown>;
  options?: { merge?: boolean };
}

// vi.mock is hoisted above the imports, and the controller calls getDb() while
// loading, so the fake database has to exist before anything else runs.
const fake = vi.hoisted(() => {
  const state = { store: {} as Collections, writes: [] as Write[] };
  const clone = <T>(value: T): T => (value === undefined ? value : structuredClone(value));
  const db = {
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => ({
          exists: state.store[name]?.[id] !== undefined,
          data: () => clone(state.store[name]?.[id]),
        }),
        set: async (value: Record<string, unknown>, options?: { merge?: boolean }) => {
          state.writes.push({ collection: name, id, value: clone(value), options });
          state.store[name] ??= {};
          state.store[name][id] = {
            ...(options?.merge ? state.store[name][id] : {}),
            ...clone(value),
          };
        },
      }),
    }),
  };
  return { state, db };
});

vi.mock('../src/services/firebase', () => ({ getDb: () => fake.db }));

import * as controller from '../src/controllers/editorialPlacementsController';

const SEED: Collections = {
  articles: { a1: { isMaagChoice: true }, a2: {} },
  guides: { g1: {} },
  interviews: { i1: {}, i2: {} },
  flippers: { f1: {} },
  'visual-stories': { v1: {} },
  news: { n1: {}, n2: {} },
  events: { e1: {}, e2: {} },
  photosOfTheDay: { p1: {} },
  firstPerson: { fp1: { isMaagChoice: true } },
};

const seed = (placements: Record<string, Record<string, unknown>> = {}) => {
  fake.state.store = { ...structuredClone(SEED), editorialPlacements: structuredClone(placements) };
  fake.state.writes = [];
};

type Handler = (req: Request, res: Response) => Promise<unknown>;

const call = async (handler: Handler, body?: unknown) => {
  const res = {
    statusCode: 0,
    body: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  await handler({ body } as Request, res as unknown as Response);
  return res;
};

const writes = () => fake.state.writes;

beforeEach(() => seed());

describe('landing placements: reading', () => {
  test('a stored null stays off, an unreadable value falls back to the default', async () => {
    seed({ landing: { newsRail: null, netlenkaRail: { mode: 'bogus' } } });
    const res = await call(controller.getLandingPlacements);
    expect(res.statusCode).toBe(200);
    expect(res.body.newsRail).toBeNull();
    expect(res.body.netlenkaRail).toEqual({ mode: 'auto-latest', limit: 4 });
  });

  test('legacy bare ids still resolve the event card and the interview block', async () => {
    seed({ landing: { featuredEventId: 'e1', featuredInterviewInCultureId: 'i1' } });
    const res = await call(controller.getLandingPlacements);
    expect(res.body.eventCard).toEqual({ mode: 'manual', id: 'e1' });
    expect(res.body.cultureInterviewBlock).toEqual({ mode: 'manual', id: 'i1' });
  });

  test('an interview saved as the culture hero survives the read', async () => {
    const cultureHero = { mode: 'manual', type: 'interview', id: 'i1' };
    seed({ landing: { cultureHero } });
    const res = await call(controller.getLandingPlacements);
    expect(res.body.cultureHero).toEqual(cultureHero);
  });
});

describe('landing placements: updating', () => {
  test('a key missing from the payload keeps its value, null turns the block off', async () => {
    seed({ landing: { mainHero: { mode: 'manual', type: 'article', id: 'a2' } } });
    const res = await call(controller.updateLandingPlacements, { newsRail: null });
    expect(res.statusCode).toBe(200);
    expect(res.body.mainHero).toEqual({ mode: 'manual', type: 'article', id: 'a2' });
    expect(res.body.newsRail).toBeNull();
    expect(writes()).toHaveLength(1);
  });

  test('the saved document keeps its key order', async () => {
    await call(controller.updateLandingPlacements, {});
    expect(Object.keys(writes()[0].value)).toEqual([
      'schemaVersion',
      'mainHero',
      'newsRail',
      'netlenkaRail',
      'cultureHero',
      'cultureCards',
      'parisHero',
      'parisCards',
      'eventCard',
      'cultureInterviewBlock',
      'leSaviezVousFeature',
      'photoOfTheDayFeature',
      'updatedAt',
      'updatedBy',
    ]);
  });

  test('the culture hero accepts an interview, the Paris hero does not', async () => {
    const accepted = await call(controller.updateLandingPlacements, {
      cultureHero: { mode: 'manual', type: 'interview', id: 'i2' },
    });
    expect(accepted.statusCode).toBe(200);
    expect(accepted.body.cultureHero).toEqual({ mode: 'manual', type: 'interview', id: 'i2' });

    const rejected = await call(controller.updateLandingPlacements, {
      parisHero: { mode: 'manual', type: 'interview', id: 'i1' },
    });
    expect(rejected.statusCode).toBe(400);
    expect(rejected.body).toEqual({ message: 'Invalid parisHero payload' });
  });

  test('an invalid value answers 400 and saves nothing', async () => {
    const res = await call(controller.updateLandingPlacements, { newsRail: { mode: 'weird' } });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Invalid newsRail payload' });
    expect(writes()).toHaveLength(0);
  });

  test('missing referenced documents answer 404 with what is missing', async () => {
    const hero = await call(controller.updateLandingPlacements, {
      mainHero: { mode: 'manual', type: 'guide', id: 'gone' },
    });
    expect(hero.statusCode).toBe(404);
    expect(hero.body).toEqual({ message: 'Referenced mainHero document was not found' });

    const news = await call(controller.updateLandingPlacements, {
      newsRail: { mode: 'manual', ids: ['n1', 'gone'] },
    });
    expect(news.body).toEqual({
      message: 'Referenced news documents were not found',
      missingIds: ['gone'],
    });

    const cards = await call(controller.updateLandingPlacements, {
      cultureCards: { mode: 'manual', items: [{ type: 'flipper', id: 'gone' }] },
    });
    expect(cards.body).toEqual({
      message: 'Referenced cultureCards documents were not found',
      missingItems: [{ type: 'flipper', id: 'gone' }],
    });
    expect(writes()).toHaveLength(0);
  });

  test('"Выбор MAAG" rail items must carry isMaagChoice', async () => {
    const res = await call(controller.updateLandingPlacements, {
      netlenkaRail: { mode: 'manual', items: [{ type: 'article', id: 'a2' }] },
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      message: 'Referenced netlenka rail documents must have isMaagChoice=true',
      nonMaagChoiceItems: [{ type: 'article', id: 'a2' }],
    });
  });

  test('the first failing field in handler order wins', async () => {
    const res = await call(controller.updateLandingPlacements, {
      photoOfTheDayFeature: { mode: 'bogus' },
      mainHero: { mode: 'manual', type: 'article', id: 'gone' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Referenced mainHero document was not found' });
  });

  test('an auto mode is not checked against the database', async () => {
    fake.state.store.events = {};
    const res = await call(controller.updateLandingPlacements, {
      eventCard: { mode: 'auto-nearest' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.eventCard).toEqual({ mode: 'auto-nearest' });
  });
});

describe('calendar page placements', () => {
  test('main cards always check their events', async () => {
    const res = await call(controller.updateCalendarPagePlacements, {
      mainCards: { mode: 'manual', ids: ['e1', 'gone'] },
    });
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      message: 'Referenced mainCards event documents were not found',
      missingIds: ['gone'],
    });
  });
});

describe('section page placements', () => {
  test.each([
    { mode: 'manual', type: 'constructor', id: 'a1' },
    { mode: 'manual', type: 'article', id: 42 },
  ])('hero type $type with id $id is rejected', async (hero) => {
    const res = await call(controller.updateCulturePagePlacements, { hero });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Invalid hero payload' });
    expect(writes()).toHaveLength(0);
  });

  test('secondary stories drop invalid items and report missing ones as "type:id"', async () => {
    const res = await call(controller.updateCulturePagePlacements, {
      secondaryStories: {
        mode: 'manual',
        items: [
          { type: 'news', id: 'n1' },
          { type: 'guide', id: 'gone' },
          { type: 'toString', id: 'x' },
        ],
      },
    });
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      message: 'Referenced secondaryStories documents not found',
      missingIds: ['guide:gone'],
    });
  });

  test('the sidebar rail is saved without a database check', async () => {
    const res = await call(controller.updateParisPagePlacements, {
      sidebarRail: { mode: 'manual', items: [{ type: 'guide', id: 'not-in-db' }] },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.sidebarRail).toEqual({
      mode: 'manual',
      items: [{ type: 'guide', id: 'not-in-db' }],
    });
  });

  test('the Paris two-image article names itself in the 404', async () => {
    const res = await call(controller.updateParisPagePlacements, {
      twoImageArticle: { mode: 'manual', type: 'article', id: 'gone' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Referenced twoImageArticle document not found' });
  });
});
