import type { Firestore } from 'firebase-admin/firestore';
import {
  LeaseLostError, PublicationBusyError, type LedgerEntry, type LedgerPatch, type SyncLedger,
} from '../utils/searchPublicationSync';

/**
 * SyncLedger on Firestore. One document per publication in
 * `searchIndexSync`; every operation is a transaction (read, check, write),
 * so two handlers racing for the same publication are serialized by
 * Firestore and only one of them can hold the lease.
 *
 * Times are epoch milliseconds from the injected clock (the handlers' own
 * clocks); the 60 s handler budget inside a 120 s lease leaves room for
 * small skew between instances. The Firestore instance is passed in: this
 * module never initializes Firebase.
 */
export const SYNC_LEDGER_COLLECTION = 'searchIndexSync';

// Document ids can't contain '/', publicationIds always do.
export const ledgerDocumentId = (publicationId: string): string => encodeURIComponent(publicationId);

type StoredEntry = Partial<Omit<LedgerEntry, 'publicationId'>> & { publicationId?: string };

const holdsLease = (stored: StoredEntry | undefined, owner: string, now: number): boolean =>
  stored?.leaseOwner === owner && typeof stored.leaseExpiresAt === 'number' && stored.leaseExpiresAt > now;

export const createFirestoreSyncLedger = (
  db: Firestore,
  now: () => number,
  collectionName: string = SYNC_LEDGER_COLLECTION,
): SyncLedger => {
  const ref = (publicationId: string) => db.collection(collectionName).doc(ledgerDocumentId(publicationId));

  return {
    async acquire(publicationId, owner, at, leaseMs) {
      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref(publicationId));
        const stored = snapshot.data() as StoredEntry | undefined;
        const heldByOther = stored?.leaseOwner && stored.leaseOwner !== owner
          && typeof stored.leaseExpiresAt === 'number' && stored.leaseExpiresAt > at;
        if (heldByOther) throw new PublicationBusyError(publicationId);
        transaction.set(ref(publicationId), {
          publicationId, leaseOwner: owner, leaseExpiresAt: at + leaseMs,
        }, { merge: true });
      });
    },

    async notePendingWrite(publicationId, owner, at) {
      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref(publicationId));
        const stored = snapshot.data() as StoredEntry | undefined;
        if (!holdsLease(stored, owner, now())) throw new LeaseLostError(publicationId);
        transaction.update(ref(publicationId), { verifyAfter: Math.max(stored?.verifyAfter ?? 0, at) });
      });
    },

    async release(publicationId, owner, patch: LedgerPatch) {
      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref(publicationId));
        const stored = snapshot.data() as StoredEntry | undefined;
        if (!holdsLease(stored, owner, now())) throw new LeaseLostError(publicationId);
        const update: Record<string, unknown> = { leaseOwner: null, leaseExpiresAt: 0 };
        if (patch.syncedVersion !== undefined) update.syncedVersion = patch.syncedVersion;
        if (patch.lastError !== undefined) update.lastError = patch.lastError;
        // A newer mark (written after the check was listed) is kept.
        const verifyAfter = stored?.verifyAfter;
        if (patch.clearVerifyAfterDueBy !== undefined && typeof verifyAfter === 'number'
          && verifyAfter <= patch.clearVerifyAfterDueBy) {
          update.verifyAfter = null;
        }
        transaction.update(ref(publicationId), update);
      });
    },

    async listDueForVerification(at) {
      // A numeric range filter skips documents whose verifyAfter is null.
      const snapshot = await db.collection(collectionName).where('verifyAfter', '<=', at).get();
      return snapshot.docs
        .map((doc) => (doc.data() as StoredEntry).publicationId)
        .filter((publicationId): publicationId is string => typeof publicationId === 'string');
    },
  };
};
