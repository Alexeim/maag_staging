import { getDb, deleteFileFromStorage } from './firebase';
import {
  normalizeContentCollectionId,
  syncSingleContentCollectionMembershipInTransaction,
} from '../utils/contentCollections';

const db = getDb();
const eventsCollection = db.collection('events');
const contentCollectionsCollection = db.collection('contentCollections');

// Every material collection whose documents may carry a
// `relatedContent.event` array pointing back at an event. When an event is
// deleted these arrays must lose its id, otherwise other materials keep
// rendering a dead "читайте также" link.
const RELATED_CONTENT_COLLECTIONS = [
  'articles',
  'events',
  'interviews',
  'guides',
  'news',
  'flippers',
  'visual-stories',
] as const;

/**
 * Best-effort conversion of whatever a Firestore doc holds in a date field
 * (Timestamp | Date | ISO string | epoch ms) into a real Date, or null.
 */
export const toDate = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (
    typeof value === 'object' &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    const parsed = (value as { toDate: () => Date }).toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

/**
 * Collect every Storage image URL owned by an event document: the cover plus
 * anything embedded in its content blocks. Extracted verbatim from the old
 * inline logic in `deleteEvent` so both delete paths stay in sync.
 */
export const collectEventImageUrls = (eventData: Record<string, unknown>): string[] => {
  const urls: string[] = [];

  if (typeof eventData.imageUrl === 'string' && eventData.imageUrl) {
    urls.push(eventData.imageUrl);
  }

  if (Array.isArray(eventData.content)) {
    for (const block of eventData.content) {
      if (!block || typeof block !== 'object') {
        continue;
      }
      const typed = block as Record<string, unknown>;
      if (typed.type === 'image' && typeof typed.url === 'string' && typed.url) {
        urls.push(typed.url);
      }
      if (typed.type === 'one-big-one-small') {
        if (typeof typed.portraitImageUrl === 'string' && typed.portraitImageUrl) {
          urls.push(typed.portraitImageUrl);
        }
        if (typeof typed.landscapeImageUrl === 'string' && typed.landscapeImageUrl) {
          urls.push(typed.landscapeImageUrl);
        }
      }
    }
  }

  return urls;
};

/**
 * Remove `eventId` from the `relatedContent.event` array of every material that
 * references it. Runs one array-contains query per collection; the event count
 * touched by a nightly purge is tiny, so this stays cheap.
 */
const removeEventBackreferences = async (eventId: string): Promise<number> => {
  let cleaned = 0;

  for (const collectionName of RELATED_CONTENT_COLLECTIONS) {
    const snapshot = await db
      .collection(collectionName)
      .where('relatedContent.event', 'array-contains', eventId)
      .get();

    for (const doc of snapshot.docs) {
      const current = (doc.data()?.relatedContent as { event?: unknown })?.event;
      if (!Array.isArray(current)) {
        continue;
      }
      // Only touch the nested array — deliberately not bumping `updatedAt`, so
      // purging an unrelated event doesn't reshuffle "recently edited" views.
      await doc.ref.update({
        'relatedContent.event': current.filter((id) => id !== eventId),
      });
      cleaned += 1;
    }
  }

  return cleaned;
};

export interface PurgeEventResult {
  id: string;
  status: 'purged' | 'not-found';
  imagesDeleted: number;
  backrefsCleaned: number;
}

/**
 * Permanently delete a single event and everything hanging off it:
 *   1. its Storage images (cover + embedded, non-transactional);
 *   2. `relatedContent.event` backreferences from other materials;
 *   3. its membership in a content collection, then the doc itself (atomic).
 *
 * Shared by the HTTP `deleteEvent` controller and the `purgeOldEvents` job so
 * there is exactly one correct way to remove an event.
 */
export const purgeEventById = async (id: string): Promise<PurgeEventResult> => {
  const eventRef = eventsCollection.doc(id);
  const eventDoc = await eventRef.get();

  if (!eventDoc.exists) {
    return { id, status: 'not-found', imagesDeleted: 0, backrefsCleaned: 0 };
  }

  const eventData = eventDoc.data() as Record<string, unknown>;
  const previousContentCollectionId = normalizeContentCollectionId(
    eventData.contentCollectionId,
  );

  const imageUrls = collectEventImageUrls(eventData);
  if (imageUrls.length > 0) {
    console.log(`[Event Purge] Deleting ${imageUrls.length} associated image(s) for ${id}.`);
    await Promise.all(imageUrls.map((url) => deleteFileFromStorage(url)));
  }

  const backrefsCleaned = await removeEventBackreferences(id);

  await db.runTransaction(async (transaction) => {
    await syncSingleContentCollectionMembershipInTransaction({
      transaction,
      collectionsCollection: contentCollectionsCollection,
      previousCollectionId: previousContentCollectionId,
      nextCollectionId: null,
      contentType: 'event',
      materialId: id,
      now: new Date(),
    });
    transaction.delete(eventRef);
  });

  return {
    id,
    status: 'purged',
    imagesDeleted: imageUrls.length,
    backrefsCleaned,
  };
};

export interface PurgeableEvent {
  id: string;
  title?: string;
  startDate: Date | null;
  endDate: Date | null;
  dateType?: 'single' | 'duration';
  isMainEvent: boolean;
  contentCollectionId: string | null;
  published?: boolean;
}

/**
 * Flatten a raw Firestore event doc into the minimal shape the expiry rule
 * needs (dates already converted to Date).
 */
export const toPurgeableEvent = (
  doc: FirebaseFirestore.QueryDocumentSnapshot,
): PurgeableEvent => {
  const data = doc.data();
  return {
    id: doc.id,
    title: typeof data.title === 'string' ? data.title : undefined,
    startDate: toDate(data.startDate),
    endDate: toDate(data.endDate),
    dateType:
      data.dateType === 'duration'
        ? 'duration'
        : data.dateType === 'single'
          ? 'single'
          : undefined,
    isMainEvent: Boolean(data.isMainEvent),
    contentCollectionId: normalizeContentCollectionId(data.contentCollectionId),
    published: typeof data.published === 'boolean' ? data.published : undefined,
  };
};

export interface EventExpiryOptions {
  /** Reference "now" — passed in explicitly so a run is deterministic/testable. */
  now: Date;
  /** Days that must pass after an event ends before it may be deleted forever. */
  graceDays: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Decide whether an event is old enough to be permanently deleted.
 *
 * Policy (tune the two guards / graceDays to taste):
 *   - curated or headline events are never auto-deleted;
 *   - an event is "over" on its end date (single-day events store
 *     `endDate: null`, so we fall back to `startDate`);
 *   - it becomes deletable only once the full grace window has elapsed
 *     since it ended;
 *   - anything without a usable date is left for a human.
 */
export const isEventExpired = (
  event: PurgeableEvent,
  options: EventExpiryOptions,
): boolean => {
  // Spare events an editor is still actively using — removing those should be
  // a deliberate manual action, never a side effect of the nightly job.
  if (event.isMainEvent || event.contentCollectionId !== null) {
    return false;
  }

  // `dateType` is only a UI hint; the stored data already encodes it —
  // single events have `endDate === null`, so this covers both shapes.
  const endsAt = event.endDate ?? event.startDate;
  if (!endsAt) {
    return false;
  }

  const deleteAfterMs = endsAt.getTime() + options.graceDays * MS_PER_DAY;
  return deleteAfterMs < options.now.getTime();
};
