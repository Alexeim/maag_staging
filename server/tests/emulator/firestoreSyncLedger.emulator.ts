import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { EMULATOR_PROJECT_ID } from './requireEmulator';
import { createFirestoreSyncLedger, ledgerDocumentId, SYNC_LEDGER_COLLECTION } from '../../src/services/firestoreSyncLedger';
import { LeaseLostError, PublicationBusyError, type SyncLedger } from '../../src/utils/searchPublicationSync';

const LEASE_MS = 120_000;
const MIN = 60_000;

let app: App;
let db: Firestore;

beforeAll(() => {
  // No credentials: with FIRESTORE_EMULATOR_HOST set, firebase-admin talks to the emulator.
  app = initializeApp({ projectId: EMULATOR_PROJECT_ID }, `ledger-emulator-${Date.now()}`);
  db = getFirestore(app);
});

afterAll(async () => {
  await deleteApp(app);
});

const createClock = (start = 1_000_000) => {
  let time = start;
  return { now: () => time, set: (value: number) => { time = value; }, advance: (ms: number) => { time += ms; } };
};

// Unique publication per test run, so tests never see each other's documents.
let counter = 0;
const newPublicationId = () => {
  counter += 1;
  return `articles/ledger-${Date.now()}-${counter}`;
};

const readEntry = async (publicationId: string) =>
  (await db.collection(SYNC_LEDGER_COLLECTION).doc(ledgerDocumentId(publicationId)).get()).data();

const setup = () => {
  const clock = createClock();
  const ledger: SyncLedger = createFirestoreSyncLedger(db, clock.now);
  return { clock, ledger };
};

describe('Firestore SyncLedger on the emulator', () => {
  test('two simultaneous acquires of one publication: exactly one wins', async () => {
    const { clock, ledger } = setup();
    // Repeated on fresh publications so the race happens many times.
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const publicationId = newPublicationId();
      const results = await Promise.allSettled([
        ledger.acquire(publicationId, 'handler-A', clock.now(), LEASE_MS),
        ledger.acquire(publicationId, 'handler-B', clock.now(), LEASE_MS),
      ]);
      const won = results.filter((result) => result.status === 'fulfilled');
      const lost = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
      expect(won).toHaveLength(1);
      expect(lost).toHaveLength(1);
      expect(lost[0].reason).toBeInstanceOf(PublicationBusyError);
      const winner = results[0].status === 'fulfilled' ? 'handler-A' : 'handler-B';
      expect(await readEntry(publicationId)).toMatchObject({
        publicationId, leaseOwner: winner, leaseExpiresAt: clock.now() + LEASE_MS,
      });
    }
  });

  test('after the lease expires a new handler can take it', async () => {
    const { clock, ledger } = setup();
    const publicationId = newPublicationId();
    const start = clock.now();
    await ledger.acquire(publicationId, 'handler-A', start, LEASE_MS);

    clock.set(start + 60_000);
    await expect(ledger.acquire(publicationId, 'handler-B', clock.now(), LEASE_MS)).rejects.toBeInstanceOf(PublicationBusyError);

    clock.set(start + LEASE_MS + 1_000);
    await ledger.acquire(publicationId, 'handler-B', clock.now(), LEASE_MS);
    expect(await readEntry(publicationId)).toMatchObject({
      leaseOwner: 'handler-B', leaseExpiresAt: start + LEASE_MS + 1_000 + LEASE_MS,
    });
  });

  test('the former owner can neither change the ledger nor free the new lease', async () => {
    const { clock, ledger } = setup();
    const publicationId = newPublicationId();
    const start = clock.now();
    await ledger.acquire(publicationId, 'handler-A', start, LEASE_MS);
    await ledger.notePendingWrite(publicationId, 'handler-A', start + 10 * MIN);

    // A stalls, its lease expires, B takes over and does its own work.
    clock.set(start + LEASE_MS + 1_000);
    await ledger.acquire(publicationId, 'handler-B', clock.now(), LEASE_MS);
    await ledger.notePendingWrite(publicationId, 'handler-B', clock.now() + 10 * MIN);
    const beforeStaleCalls = await readEntry(publicationId);

    // A wakes up: every write is refused, nothing changes.
    await expect(ledger.notePendingWrite(publicationId, 'handler-A', clock.now() + 60 * MIN))
      .rejects.toBeInstanceOf(LeaseLostError);
    await expect(ledger.release(publicationId, 'handler-A', {
      syncedVersion: 'stale-version', lastError: 'stale error', clearVerifyAfterDueBy: Number.MAX_SAFE_INTEGER,
    })).rejects.toBeInstanceOf(LeaseLostError);
    expect(await readEntry(publicationId)).toEqual(beforeStaleCalls);
    expect(beforeStaleCalls).toMatchObject({ leaseOwner: 'handler-B' });

    // B still owns it and can finish normally.
    await ledger.release(publicationId, 'handler-B', { syncedVersion: 'v2', lastError: null });
    expect(await readEntry(publicationId)).toMatchObject({ leaseOwner: null, leaseExpiresAt: 0, syncedVersion: 'v2' });
  });

  test('an owner whose lease expired cannot release it even if nobody took over', async () => {
    const { clock, ledger } = setup();
    const publicationId = newPublicationId();
    await ledger.acquire(publicationId, 'handler-A', clock.now(), LEASE_MS);
    clock.advance(LEASE_MS + 1);
    await expect(ledger.release(publicationId, 'handler-A', { syncedVersion: 'v1' })).rejects.toBeInstanceOf(LeaseLostError);
    expect(await readEntry(publicationId)).not.toHaveProperty('syncedVersion');
  });

  test('finishing an older check keeps a newer verifyAfter mark', async () => {
    const { clock, ledger } = setup();
    const publicationId = newPublicationId();
    const t0 = clock.now();

    // A handler writes: a check becomes due 10 minutes later.
    await ledger.acquire(publicationId, 'handler-1', t0, LEASE_MS);
    await ledger.notePendingWrite(publicationId, 'handler-1', t0 + 10 * MIN);
    await ledger.release(publicationId, 'handler-1', { syncedVersion: 'v1' });

    // 11 minutes later the check is listed...
    clock.set(t0 + 11 * MIN);
    const checkStartedAt = clock.now();
    expect(await ledger.listDueForVerification(checkStartedAt)).toContain(publicationId);

    // ...but before it takes the lease, another handler writes: a newer mark.
    await ledger.acquire(publicationId, 'handler-2', clock.now(), LEASE_MS);
    await ledger.notePendingWrite(publicationId, 'handler-2', checkStartedAt + 10 * MIN);
    await ledger.release(publicationId, 'handler-2', { syncedVersion: 'v2' });

    // The older check finishes: it may only clear marks due by when it started.
    await ledger.acquire(publicationId, 'checker', clock.now(), LEASE_MS);
    await ledger.release(publicationId, 'checker', { clearVerifyAfterDueBy: checkStartedAt, lastError: null });
    expect(await readEntry(publicationId)).toMatchObject({ verifyAfter: checkStartedAt + 10 * MIN, leaseOwner: null });
    expect(await ledger.listDueForVerification(checkStartedAt)).not.toContain(publicationId);

    // Control: once that mark is due, a later check does clear it.
    clock.set(checkStartedAt + 11 * MIN);
    expect(await ledger.listDueForVerification(clock.now())).toContain(publicationId);
    await ledger.acquire(publicationId, 'checker', clock.now(), LEASE_MS);
    await ledger.release(publicationId, 'checker', { clearVerifyAfterDueBy: clock.now() });
    expect(await readEntry(publicationId)).toMatchObject({ verifyAfter: null });
    expect(await ledger.listDueForVerification(clock.now())).not.toContain(publicationId);
  });
});
