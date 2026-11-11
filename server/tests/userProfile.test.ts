// createUserProfile / updateUserProfile: uid comes from the token, last name is
// optional, an existing profile is never overwritten.
import type { Request, Response } from 'express';
import { beforeEach, expect, test, vi } from 'vitest';
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
} from '../src/controllers/userController';

// vi.mock is hoisted above the imports, and the controller calls getDb() while
// loading, so the fake database has to exist before anything else runs.
const fake = vi.hoisted(() => {
  const state = {
    store: {} as Record<string, Record<string, Record<string, unknown>>>,
  };
  const snapshot = (collection: string, id: string) => {
    const data = state.store[collection]?.[id];
    return { exists: data !== undefined, data: () => data, id };
  };
  const write = (collection: string, id: string, data: Record<string, unknown>) => {
    state.store[collection] ??= {};
    state.store[collection][id] = data;
  };
  const ref = (collection: string, id: string) => ({
    path: `${collection}/${id}`,
    get: async () => snapshot(collection, id),
    update: async (data: Record<string, unknown>) =>
      write(collection, id, { ...state.store[collection]?.[id], ...data }),
  });
  const parse = (r: { path: string }) => r.path.split('/') as [string, string];
  const db = {
    collection: (collection: string) => ({ doc: (id: string) => ref(collection, id) }),
    runTransaction: async (fn: (t: unknown) => Promise<unknown>) =>
      fn({
        get: async (r: { path: string }) => snapshot(...parse(r)),
        create: (r: { path: string }, data: Record<string, unknown>) =>
          write(...parse(r), data),
      }),
  };
  return { state, db };
});

vi.mock('../src/services/firebase', () => ({
  getDb: () => fake.db,
}));

const call = async (
  handler: (req: Request, res: Response) => unknown,
  { uid, body, params = {} }: { uid?: string; body: unknown; params?: Record<string, string> },
) => {
  const result = { status: 0, body: undefined as any };
  const res = {
    status(code: number) {
      result.status = code;
      return this;
    },
    json(payload: unknown) {
      result.body = payload;
      return this;
    },
  } as unknown as Response;
  const req = { body, params, ...(uid ? { user: { uid } } : {}) } as unknown as Request;
  await handler(req, res);
  return result;
};

beforeEach(() => {
  fake.state.store = {};
});

test('creates a profile for the token uid', async () => {
  const res = await call(createUserProfile, {
    uid: 'u1',
    body: { uid: 'u1', firstName: ' Anna ', lastName: 'Petrova' },
  });

  expect(res.status).toBe(201);
  expect(fake.state.store.users.u1).toMatchObject({
    firstName: 'Anna',
    lastName: 'Petrova',
    role: 'reader',
  });
});

test('works without a uid in the body', async () => {
  const res = await call(createUserProfile, {
    uid: 'u1',
    body: { firstName: 'Anna', lastName: 'Petrova' },
  });

  expect(res.status).toBe(201);
  expect(res.body.uid).toBe('u1');
});

test('accepts an empty last name', async () => {
  const res = await call(createUserProfile, {
    uid: 'u1',
    body: { firstName: 'Anna' },
  });

  expect(res.status).toBe(201);
  expect(fake.state.store.users.u1).toMatchObject({ firstName: 'Anna', lastName: '' });
});

test('returns an existing profile untouched', async () => {
  fake.state.store.users = {
    u1: { firstName: 'Edited', lastName: 'Name', role: 'admin', bookmarks: [] },
  };

  const res = await call(createUserProfile, {
    uid: 'u1',
    body: { firstName: 'Google', lastName: 'Name' },
  });

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ uid: 'u1', firstName: 'Edited', role: 'admin' });
  expect(fake.state.store.users.u1.role).toBe('admin');
});

test('rejects a body uid that is not the caller', async () => {
  fake.state.store.users = { admin1: { firstName: 'A', lastName: 'B', role: 'admin' } };

  const res = await call(createUserProfile, {
    uid: 'u1',
    body: { uid: 'admin1', firstName: 'X', lastName: 'Y' },
  });

  expect(res.status).toBe(403);
  expect(fake.state.store.users.u1).toBeUndefined();
});

test('requires a first name', async () => {
  const res = await call(createUserProfile, {
    uid: 'u1',
    body: { firstName: '   ', lastName: 'Petrova' },
  });

  expect(res.status).toBe(400);
});

test('update accepts an empty last name', async () => {
  fake.state.store.users = { u1: { firstName: 'Anna', lastName: 'Petrova', role: 'reader' } };

  const res = await call(updateUserProfile, {
    uid: 'u1',
    params: { uid: 'u1' },
    body: { firstName: 'Anna', lastName: '' },
  });

  expect(res.status).toBe(200);
  expect(fake.state.store.users.u1).toMatchObject({ firstName: 'Anna', lastName: '' });
});

test('get returns the caller own profile', async () => {
  fake.state.store.users = { u1: { firstName: 'Anna', lastName: '', role: 'reader' } };

  const res = await call(getUserProfile, { uid: 'u1', params: { uid: 'u1' }, body: {} });

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ uid: 'u1', firstName: 'Anna' });
});

test('get refuses someone else profile', async () => {
  fake.state.store.users = { admin1: { firstName: 'A', lastName: 'B', role: 'admin' } };

  const res = await call(getUserProfile, { uid: 'u1', params: { uid: 'admin1' }, body: {} });

  expect(res.status).toBe(403);
  expect(res.body).toEqual({ message: 'Forbidden' });
});

test('update refuses someone else profile', async () => {
  fake.state.store.users = { admin1: { firstName: 'A', lastName: 'B', role: 'admin' } };

  const res = await call(updateUserProfile, {
    uid: 'u1',
    params: { uid: 'admin1' },
    body: { firstName: 'Hacked', lastName: '' },
  });

  expect(res.status).toBe(403);
  expect(fake.state.store.users.admin1.firstName).toBe('A');
});
