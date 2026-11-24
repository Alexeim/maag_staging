import type { Firestore } from 'firebase-admin/firestore';
import { SEARCH_SOURCES } from '../utils/searchCorpus';
import type { SearchRecordAuthor } from '../utils/searchRecords';
import { DELETED_VERSION, toSourceVersion, type PublicationSource, type SourceDocument } from '../utils/searchPublicationSync';

const SEARCH_COLLECTIONS = new Set<string>(SEARCH_SOURCES.map((source) => source.collection));

// A Firestore document id can't contain '/': `collection(c).doc('a/b')` would
// silently read a nested document. Refuse instead, so the path stays exact.
const assertDocumentId = (id: string): void => {
  if (!id || id.includes('/')) throw new Error(`Invalid document id "${id}"`);
};

/**
 * PublicationSource on Firestore: one read per call, by exact path.
 * The version is the snapshot's server-side updateTime; a missing document
 * reads as DELETED_VERSION, so repeated reads of it are one state.
 * The Firestore instance is passed in: this module never initializes Firebase.
 */
export const createFirestorePublicationSource = (db: Firestore): PublicationSource => ({
  async readDocument(collection, id): Promise<SourceDocument> {
    if (!SEARCH_COLLECTIONS.has(collection)) throw new Error(`Collection "${collection}" is not a search source`);
    assertDocumentId(id);
    const snapshot = await db.collection(collection).doc(id).get();
    if (!snapshot.exists || !snapshot.updateTime) return { exists: false, version: DELETED_VERSION };
    return { exists: true, data: snapshot.data(), version: toSourceVersion(snapshot.updateTime) };
  },

  async readAuthor(authorId): Promise<SearchRecordAuthor | null> {
    assertDocumentId(authorId);
    const snapshot = await db.collection('authors').doc(authorId).get();
    if (!snapshot.exists) return null;
    // Only what the records use; the rest of the author profile stays out.
    const { firstName, lastName, noBgAvatar } = snapshot.data() ?? {};
    return { firstName, lastName, noBgAvatar };
  },
});
