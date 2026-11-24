import { FieldPath, type Firestore } from 'firebase-admin/firestore';
import { SEARCH_SOURCES } from '../utils/searchCorpus';
import { toSourceVersion } from '../utils/searchPublicationSync';
import type { BackfillDocument, BackfillPageReader } from '../utils/searchBackfill';

const SEARCH_COLLECTIONS = new Set<string>(SEARCH_SOURCES.map((source) => source.collection));

/**
 * Pages of a search collection ordered by document id. Unlike
 * orderBy('createdAt') in the API lists, ordering by id never skips a
 * document that lacks some field. The version comes from each document's
 * updateTime in the same query snapshot: no per-document re-read.
 */
export const createFirestoreBackfillReader = (db: Firestore): BackfillPageReader => ({
  async readPage(collection, afterId, limit): Promise<BackfillDocument[]> {
    if (!SEARCH_COLLECTIONS.has(collection)) throw new Error(`Collection "${collection}" is not a search source`);
    let query = db.collection(collection).orderBy(FieldPath.documentId()).limit(limit);
    if (afterId !== null) query = query.startAfter(afterId);
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data(), version: toSourceVersion(doc.updateTime) }));
  },
});
