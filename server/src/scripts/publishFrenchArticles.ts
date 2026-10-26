/** Publish existing French translations without changing their machine review status. */
import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from '../services/firebase';
import { FR_COLLECTION } from '../services/articlesFr';

const apply = process.argv.includes('--apply');

const run = async (): Promise<void> => {
  const db = getDb();
  const [translations, sources] = await Promise.all([
    db.collection(FR_COLLECTION).get(),
    db.collection('articles').get(),
  ]);
  const sourceById = new Map(sources.docs.map((doc) => [doc.id, doc.data()]));
  const changes = translations.docs.filter((doc) => {
    const data = doc.data();
    return data.published !== true || !data.publishedAt;
  });
  for (const doc of changes) {
    const sourceId: unknown = doc.data().sourceId;
    if (typeof sourceId !== 'string' || !sourceById.has(sourceId)) {
      throw new Error(`Missing source for articles_fr/${doc.id}; nothing was written`);
    }
  }
  console.log(JSON.stringify({ mode: apply ? 'APPLY' : 'DRY RUN',
    total: translations.size, toUpdate: changes.length }));
  if (!apply) return;
  for (let offset = 0; offset < changes.length; offset += 450) {
    const batch = db.batch();
    for (const doc of changes.slice(offset, offset + 450)) {
      const data = doc.data();
      const source = sourceById.get(String(data.sourceId));
      batch.update(doc.ref, {
        published: true,
        publishedAt: data.publishedAt ?? source?.publishedAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { lastUpdateTime: doc.updateTime });
    }
    await batch.commit();
  }
  const verified = await db.collection(FR_COLLECTION).get();
  const incomplete = verified.docs.filter((doc) => doc.data().published !== true || !doc.data().publishedAt);
  console.log(JSON.stringify({ verified: verified.size, published: verified.size - incomplete.length,
    incomplete: incomplete.map((doc) => doc.id) }));
  if (incomplete.length > 0) throw new Error('French publication verification failed');
};

run().then(() => process.exit(0)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
