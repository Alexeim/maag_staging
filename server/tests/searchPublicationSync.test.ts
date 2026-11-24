import { describe, expect, test } from 'vitest';
import type { BatchRequest, BrowseResponse } from 'algoliasearch';
import { createSearchIndexAdapter, type SearchIndexClient } from '../src/utils/searchIndexSync';
import type { SearchRecordAuthor } from '../src/utils/searchRecords';
import {
  DELETED_VERSION, LeaseLostError, PublicationBusyError, PublicationUnstableError, HandlerDeadlineError,
  syncPublicationFromSource, verifyDuePublications, verifyDuePublicationsBatch, verifyPublication,
  type LedgerEntry, type LedgerPatch, type PublicationSource, type SourceDocument, type SyncDeps, type SyncLedger,
} from '../src/utils/searchPublicationSync';

const MIN = 60_000;
type Stored = Record<string, unknown> & { objectID: string };

// --- In-memory stand-ins -------------------------------------------------

const createClock = (start = 1_000_000) => {
  let time = start;
  return { now: () => time, advance: (ms: number) => { time += ms; } };
};

/** Firestore-like store: every write bumps the version; a missing doc reads as DELETED_VERSION. */
const createSource = () => {
  const docs = new Map<string, { data: Record<string, unknown>; version: string }>();
  const authors = new Map<string, SearchRecordAuthor>();
  let counter = 0;
  const reads: string[] = [];
  // Runs before each document read is answered (simulates a concurrent save).
  let beforeRead: (() => void) | null = null;
  const source: PublicationSource = {
    async readDocument(collection, id) {
      beforeRead?.();
      const key = `${collection}/${id}`;
      const doc = docs.get(key);
      const result: SourceDocument = doc ? { exists: true, data: doc.data, version: doc.version } : { exists: false, version: DELETED_VERSION };
      reads.push(`${key}@${result.version}`);
      return result;
    },
    async readAuthor(authorId) {
      reads.push(`authors/${authorId}`);
      return authors.get(authorId) ?? null;
    },
  };
  return {
    source, docs, authors, reads,
    write: (collection: string, id: string, data: Record<string, unknown>) => {
      counter += 1;
      docs.set(`${collection}/${id}`, { data, version: `v${counter}` });
    },
    remove: (collection: string, id: string) => { docs.delete(`${collection}/${id}`); },
    onEveryRead: (hook: (() => void) | null) => { beforeRead = hook; },
  };
};

/** Ledger with the same semantics the Firestore implementation must have (transactions). */
const createLedger = () => {
  const entries = new Map<string, LedgerEntry>();
  const entry = (publicationId: string): LedgerEntry => {
    let current = entries.get(publicationId);
    if (!current) {
      current = { publicationId, leaseOwner: null, leaseExpiresAt: 0, syncedVersion: null, verifyAfter: null, lastError: null };
      entries.set(publicationId, current);
    }
    return current;
  };
  let clockNow = () => 0;
  const ledger: SyncLedger = {
    async acquire(publicationId, owner, now, leaseMs) {
      const current = entry(publicationId);
      if (current.leaseOwner && current.leaseOwner !== owner && current.leaseExpiresAt > now) {
        throw new PublicationBusyError(publicationId);
      }
      current.leaseOwner = owner;
      current.leaseExpiresAt = now + leaseMs;
    },
    async notePendingWrite(publicationId, owner, at) {
      const current = entry(publicationId);
      if (current.leaseOwner !== owner || current.leaseExpiresAt <= clockNow()) throw new LeaseLostError(publicationId);
      current.verifyAfter = Math.max(current.verifyAfter ?? 0, at);
    },
    async release(publicationId, owner, patch: LedgerPatch) {
      const current = entry(publicationId);
      if (current.leaseOwner !== owner || current.leaseExpiresAt <= clockNow()) throw new LeaseLostError(publicationId);
      if (patch.syncedVersion !== undefined) current.syncedVersion = patch.syncedVersion;
      if (patch.lastError !== undefined) current.lastError = patch.lastError;
      if (patch.clearVerifyAfterDueBy !== undefined && current.verifyAfter !== null
        && current.verifyAfter <= patch.clearVerifyAfterDueBy) {
        current.verifyAfter = null;
      }
      current.leaseOwner = null;
      current.leaseExpiresAt = 0;
    },
    async listDueForVerification(now) {
      return [...entries.values()].filter((item) => item.verifyAfter !== null && item.verifyAfter <= now)
        .map((item) => item.publicationId);
    },
  };
  return { ledger, entries, useClock: (now: () => number) => { clockNow = now; } };
};

/**
 * Fake Algolia index. `delayNextBatch()` makes the next batch time out for
 * the caller while the request is kept; `deliverDelayed()` applies it later,
 * which is how a timed-out write can still land after a newer one.
 */
const createAlgolia = () => {
  const records = new Map<string, Stored>();
  const delayed: BatchRequest[][] = [];
  let delayNext = false;
  let taskID = 0;
  let batchesSent = 0;
  // Runs during each browse (simulates a slow index read).
  let duringBrowse: (() => void) | null = null;
  const apply = (requests: BatchRequest[]) => {
    for (const { action, body } of requests) {
      const objectID = String(body.objectID);
      if (action === 'deleteObject') records.delete(objectID);
      else records.set(objectID, { ...body, objectID });
    }
  };
  const client: SearchIndexClient = {
    async browseObjects<T>({ browseParams, aggregator }: { browseParams: { filters?: string }; aggregator: (r: BrowseResponse<T>) => void }) {
      duringBrowse?.();
      const wanted = /^publicationId:"(.*)"$/.exec(browseParams.filters ?? '')?.[1];
      aggregator({ hits: [...records.values()].filter((record) => record.publicationId === wanted) } as unknown as BrowseResponse<T>);
      return {};
    },
    async batch({ batchWriteParams }) {
      batchesSent += 1;
      if (delayNext) {
        delayNext = false;
        delayed.push(batchWriteParams.requests);
        throw Object.assign(new Error('Unreachable hosts - timeout'), { name: 'RetryError' });
      }
      apply(batchWriteParams.requests);
      taskID += 1;
      return { taskID };
    },
    async waitForTask() { return {}; },
    async getSettings() { return {}; },
    async setSettings() { return { taskID: 0 }; },
  };
  return {
    client, records,
    delayNextBatch: () => { delayNext = true; },
    deliverDelayed: () => { delayed.splice(0).forEach(apply); },
    onBrowse: (hook: (() => void) | null) => { duringBrowse = hook; },
    batchesSent: () => batchesSent,
    // One line per record: chunk, access, source version.
    state: (publicationId: string) => [...records.values()]
      .filter((record) => record.publicationId === publicationId)
      .map((record) => `${record.objectID.split('#')[1]} ${String(record.access)} ${String(record.sourceVersion)}`)
      .sort(),
  };
};

const setup = () => {
  const clock = createClock();
  const store = createSource();
  const { ledger, entries, useClock } = createLedger();
  useClock(clock.now);
  const algolia = createAlgolia();
  const deps: SyncDeps = {
    source: store.source, ledger, now: clock.now,
    index: createSearchIndexAdapter(algolia.client, 'maag_materials_dev'),
  };
  return { clock, store, entries, algolia, deps };
};

// ~6 KB of Cyrillic per paragraph: three paragraphs give three chunks.
const paragraph = (marker: string) => ({ type: 'paragraph', text: `${marker} ${'открытый текст статьи '.repeat(150)}` });
const openArticle = {
  published: true, title: 'Тестовая статья', tags: ['театр'], imageUrl: 'https://cover.example/a.jpg',
  content: [paragraph('ОДИН'), paragraph('ДВА'), paragraph('ТРИ')],
};
const paidArticle = { ...openArticle, paid: true };
const PUB = 'articles/a1';
const openTextIn = (records: Map<string, Stored>) =>
  /ОДИН|ДВА|ТРИ|открытый текст/.test(JSON.stringify([...records.values()]));

// --- The late write ------------------------------------------------------

describe('late write: H1 times out, H2 writes paid, then H1 lands', () => {
  const playThreeActions = async () => {
    const ctx = setup();
    const states: Record<string, string[]> = {};
    ctx.store.write('articles', 'a1', openArticle); // v1

    // 1. H1 sends the open version and gets a timeout; the request is kept.
    ctx.algolia.delayNextBatch();
    await expect(syncPublicationFromSource(ctx.deps, { collection: 'articles', id: 'a1', owner: 'H1' }))
      .rejects.toThrow('timeout');
    states.afterH1Timeout = ctx.algolia.state(PUB);

    // 2. The editor makes it paid (v2); H2 applies it successfully.
    ctx.store.write('articles', 'a1', paidArticle);
    await syncPublicationFromSource(ctx.deps, { collection: 'articles', id: 'a1', owner: 'H2' });
    states.afterH2 = ctx.algolia.state(PUB);

    // 3. Algolia applies H1's old request.
    ctx.algolia.deliverDelayed();
    states.afterLateH1 = ctx.algolia.state(PUB);
    return { ...ctx, states };
  };

  test('the index after each of the three actions', async () => {
    const { states, algolia, entries } = await playThreeActions();
    expect(states).toEqual({
      afterH1Timeout: [],
      afterH2: ['0 restricted v2'],
      afterLateH1: ['0 open v1', '1 open v1', '2 open v1'],
    });
    expect(openTextIn(algolia.records)).toBe(true);
    // The ledger believes all is well: syncedVersion is v2.
    expect(entries.get(PUB)).toMatchObject({ syncedVersion: 'v2', leaseOwner: null });
    expect(entries.get(PUB)?.verifyAfter).not.toBeNull();
  });

  test('without the ledger check nothing fixes it until the editor saves again', async () => {
    const { clock, algolia, store, deps } = await playThreeActions();
    clock.advance(60 * MIN); // H1 is gone; no event arrives
    expect(openTextIn(algolia.records)).toBe(true);
    // Only a new editorial save (a new event) would repair it:
    store.write('articles', 'a1', paidArticle); // v3
    await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E3' });
    expect(algolia.state(PUB)).toEqual(['0 restricted v3']);
  });

  test('fix A: the platform retries E1 after the late write landed', async () => {
    const { algolia, deps, entries } = await playThreeActions();
    // syncedVersion is already v2; the retry still rewrites from the real index state.
    const retry = await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'H1-retry' });
    expect(retry).toMatchObject({ version: 'v2', rounds: 1, records: 1 });
    expect(algolia.state(PUB)).toEqual(['0 restricted v2']);
    expect(openTextIn(algolia.records)).toBe(false);
    expect(entries.get(PUB)?.syncedVersion).toBe('v2');
  });

  test('fix B: the retry came earlier, H1 can do nothing; the due ledger check repairs it', async () => {
    const ctx = setup();
    ctx.store.write('articles', 'a1', openArticle); // v1
    ctx.algolia.delayNextBatch();
    await expect(syncPublicationFromSource(ctx.deps, { collection: 'articles', id: 'a1', owner: 'H1' })).rejects.toThrow('timeout');
    ctx.store.write('articles', 'a1', paidArticle); // v2
    await syncPublicationFromSource(ctx.deps, { collection: 'articles', id: 'a1', owner: 'H2' });
    // The platform retries E1 before the late write lands: nothing to fix yet.
    await syncPublicationFromSource(ctx.deps, { collection: 'articles', id: 'a1', owner: 'H1-retry' });
    ctx.algolia.deliverDelayed();
    expect(ctx.algolia.state(PUB)).toEqual(['0 open v1', '1 open v1', '2 open v1']);
    expect(ctx.entries.get(PUB)?.syncedVersion).toBe('v2');

    // Not due yet: the check does nothing, the window is still open.
    ctx.clock.advance(5 * MIN);
    expect(await verifyDuePublications(ctx.deps, 'checker')).toEqual([]);
    expect(openTextIn(ctx.algolia.records)).toBe(true);

    // Due: the check reads the real index, sees v1 records against a v2 document, repairs.
    ctx.clock.advance(6 * MIN);
    const [result] = await verifyDuePublications(ctx.deps, 'checker');
    expect(result).toMatchObject({ publicationId: PUB, status: 'repaired', outcome: { version: 'v2' } });
    expect(ctx.algolia.state(PUB)).toEqual(['0 restricted v2']);
    expect(openTextIn(ctx.algolia.records)).toBe(false);

    // The repair is checked too, then the mark is cleared.
    ctx.clock.advance(11 * MIN);
    expect(await verifyDuePublications(ctx.deps, 'checker')).toEqual([{ publicationId: PUB, status: 'verified' }]);
    expect(ctx.entries.get(PUB)?.verifyAfter).toBeNull();
  });
});

// --- Other guarantees ----------------------------------------------------

describe('rounds, deletion, leases', () => {
  test('a deleted document reads as one state: one round, records removed', async () => {
    const { store, algolia, deps } = setup();
    store.write('articles', 'a1', openArticle);
    await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E1' });
    store.remove('articles', 'a1');
    const outcome = await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E2' });
    expect(outcome).toMatchObject({ version: DELETED_VERSION, rounds: 1, records: 0 });
    expect(algolia.state(PUB)).toEqual([]);
    // Syncing the deleted document again is still one round and changes nothing.
    expect(await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E3' }))
      .toMatchObject({ rounds: 1 });
  });

  test('a document that keeps changing: three rounds, then a transient error and a retry', async () => {
    const { store, algolia, deps, entries } = setup();
    store.write('articles', 'a1', openArticle);
    let reads = 0;
    // Every read after the first sees a newer version (an editor saving fast);
    // the fourth version, read by the third re-check, is paid.
    store.onEveryRead(() => {
      reads += 1;
      if (reads > 1) store.write('articles', 'a1', reads === 4 ? paidArticle : openArticle);
    });
    await expect(syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E1' }))
      .rejects.toBeInstanceOf(PublicationUnstableError);
    expect(entries.get(PUB)).toMatchObject({ leaseOwner: null, lastError: expect.stringContaining('PublicationUnstableError') });
    expect(entries.get(PUB)?.verifyAfter).not.toBeNull();

    // The platform retries once the editor stops: one round, latest (paid) version.
    store.onEveryRead(null);
    const retry = await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E1-retry' });
    expect(retry.rounds).toBe(1);
    expect(algolia.state(PUB)).toEqual([`0 restricted ${retry.version}`]);
    expect(openTextIn(algolia.records)).toBe(false);
  });

  test('a busy publication is not written; the retry after the lease expires is', async () => {
    const { store, algolia, deps, clock } = setup();
    store.write('articles', 'a1', openArticle);
    await deps.ledger.acquire(PUB, 'stuck-handler', clock.now(), 120_000);
    await expect(syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E1' }))
      .rejects.toBeInstanceOf(PublicationBusyError);
    expect(algolia.state(PUB)).toEqual([]);
    clock.advance(121_000);
    await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E1-retry' });
    expect(algolia.state(PUB)).toHaveLength(3);
  });

  test('no write after the handler time budget is spent', async () => {
    const { store, algolia, deps, clock } = setup();
    store.write('articles', 'a1', openArticle);
    store.onEveryRead(() => clock.advance(61_000));
    await expect(syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E1' }))
      .rejects.toBeInstanceOf(HandlerDeadlineError);
    expect(algolia.state(PUB)).toEqual([]);
  });

  test('regression: a slow index browse spends the budget, so no batch is sent', async () => {
    const { store, algolia, deps, clock, entries } = setup();
    store.write('articles', 'a1', openArticle);
    // The check before syncPublication passes; the browse then takes 61 s.
    algolia.onBrowse(() => clock.advance(61_000));
    await expect(syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E1' }))
      .rejects.toBeInstanceOf(HandlerDeadlineError);
    expect(algolia.batchesSent()).toBe(0);
    expect(algolia.state(PUB)).toEqual([]);
    // Nothing was sent, so no pending write to verify; the lease is free.
    expect(entries.get(PUB)).toMatchObject({ verifyAfter: null, leaseOwner: null });
    expect(entries.get(PUB)?.lastError).toMatch(/HandlerDeadlineError/);
  });

  test('regression: a slow ledger write spends the budget, so no batch is sent', async () => {
    const { store, algolia, deps, clock, entries } = setup();
    store.write('articles', 'a1', openArticle);
    const startedAt = clock.now();
    // Fast browse; noting the pending write takes the remaining 61 s.
    const slowLedger: SyncDeps = {
      ...deps,
      ledger: {
        ...deps.ledger,
        notePendingWrite: async (publicationId, owner, at) => {
          await deps.ledger.notePendingWrite(publicationId, owner, at);
          clock.advance(61_000);
        },
      },
    };
    await expect(syncPublicationFromSource(slowLedger, { collection: 'articles', id: 'a1', owner: 'E1' }))
      .rejects.toBeInstanceOf(HandlerDeadlineError);
    expect(algolia.batchesSent()).toBe(0);
    expect(algolia.state(PUB)).toEqual([]);
    // The lease is free and the mark stays: one harmless extra check later.
    expect(entries.get(PUB)).toMatchObject({ leaseOwner: null, verifyAfter: startedAt + 10 * MIN });
    expect(entries.get(PUB)?.lastError).toMatch(/HandlerDeadlineError/);
  });

  test('regression: an oversized publication keeps a clear lastError after a successful check', async () => {
    const { store, algolia, deps, clock, entries } = setup();
    store.write('articles', 'a1', openArticle);
    await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E1' });
    store.write('articles', 'a1', { ...openArticle, title: 'Я'.repeat(6_000) });
    await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E2' });
    expect(algolia.state(PUB)).toEqual([]);
    // The removal was a write, so a check is due; the empty index is then consistent.
    clock.advance(11 * MIN);
    expect(await verifyDuePublications(deps, 'checker')).toEqual([{ publicationId: PUB, status: 'verified' }]);
    expect(entries.get(PUB)?.verifyAfter).toBeNull();
    expect(entries.get(PUB)?.lastError).toMatch(/articles\/a1: record metadata alone takes \d+ bytes, limit is 10000/);
  });

  test('a check does not clear a newer pending write noted after it was listed', async () => {
    const { store, deps, clock, entries } = setup();
    store.write('articles', 'a1', openArticle);
    await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E1' });
    clock.advance(11 * MIN);
    const startedAt = clock.now();
    // A handler writes again right before the check runs: a new 10-minute window.
    store.write('articles', 'a1', paidArticle);
    await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E2' });
    const newWindow = entries.get(PUB)?.verifyAfter;
    expect(newWindow).toBeGreaterThan(startedAt);
    expect(await verifyPublication(deps, { publicationId: PUB, owner: 'checker' })).toEqual({ publicationId: PUB, status: 'verified' });
    expect(entries.get(PUB)?.verifyAfter).toBe(newWindow);
  });

  test('an oversized document is removed, not retried forever', async () => {
    const { store, algolia, deps, entries } = setup();
    store.write('articles', 'a1', openArticle);
    await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E1' });
    store.write('articles', 'a1', { ...openArticle, title: 'Я'.repeat(6_000) });
    const outcome = await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E2' });
    expect(outcome.permanentError).toMatch(/limit is 10000/);
    expect(algolia.state(PUB)).toEqual([]);
    expect(entries.get(PUB)?.lastError).toMatch(/limit is 10000/);
  });

  test('firstPerson reads its author; other types never do', async () => {
    const { store, algolia, deps } = setup();
    store.authors.set('au1', { firstName: 'Иван', lastName: 'Петров' });
    store.write('firstPerson', 'f1', { published: true, title: 'о кино', authorId: 'au1', imageUrl: 'https://c.example/f.jpg' });
    store.write('articles', 'a1', { ...openArticle, authorId: 'au1' });
    await syncPublicationFromSource(deps, { collection: 'firstPerson', id: 'f1', owner: 'E1' });
    await syncPublicationFromSource(deps, { collection: 'articles', id: 'a1', owner: 'E2' });
    expect(store.reads.filter((read) => read.startsWith('authors/'))).toEqual(['authors/au1']);
    expect(algolia.records.get('firstPerson/f1#0')?.displayTitle).toBe('Иван Петров о кино');
  });
});

describe('scheduled run limits', () => {
  // Three published articles synced at t0: all three become due 10 minutes later.
  const threeDue = async () => {
    const ctx = setup();
    for (const id of ['a1', 'a2', 'a3']) {
      ctx.store.write('articles', id, openArticle);
      await syncPublicationFromSource(ctx.deps, { collection: 'articles', id, owner: `E-${id}` });
    }
    ctx.clock.advance(11 * MIN);
    return ctx;
  };

  test('maxPublications: the rest stay due for the next run', async () => {
    const { deps, entries } = await threeDue();
    const first = await verifyDuePublicationsBatch(deps, 'run-1', { maxPublications: 2 });
    expect(first).toMatchObject({ due: 3, deferred: 1 });
    expect(first.results.map((result) => result.status)).toEqual(['verified', 'verified']);
    const next = await verifyDuePublicationsBatch(deps, 'run-2', { maxPublications: 2 });
    expect(next).toMatchObject({ due: 1, deferred: 0, results: [{ status: 'verified' }] });
    expect([...entries.values()].every((entry) => entry.verifyAfter === null)).toBe(true);
  });

  test('deadline: no new publication is started once it has passed', async () => {
    const { deps, clock, store } = await threeDue();
    // Each publication's check takes 100 s; the run may start new ones for 150 s.
    store.onEveryRead(() => clock.advance(100_000));
    const batch = await verifyDuePublicationsBatch(deps, 'run-1', { deadlineMs: clock.now() + 150_000 });
    expect(batch).toMatchObject({ due: 3, deferred: 1 });
    expect(batch.results).toHaveLength(2);
  });

  test('a deadline already passed starts nothing and defers everything', async () => {
    const { deps, clock } = await threeDue();
    expect(await verifyDuePublicationsBatch(deps, 'run-1', { deadlineMs: clock.now() }))
      .toEqual({ due: 3, results: [], deferred: 3 });
  });
});
