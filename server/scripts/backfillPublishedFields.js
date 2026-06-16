/**
 * Backfill published / publishedAt fields for material collections.
 *
 * Usage (run from server/):
 *   node scripts/backfillPublishedFields.js
 *   node scripts/backfillPublishedFields.js --apply
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const admin = require('firebase-admin');

const shouldApply = process.argv.includes('--apply');

if (!admin.apps.length) {
  const firebaseConfigJson = process.env.FIREBASE_CONFIG_JSON;
  if (!firebaseConfigJson) {
    console.error('FIREBASE_CONFIG_JSON is not set in .env');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(firebaseConfigJson)),
  });
}

const db = admin.firestore();
const now = admin.firestore.Timestamp.now();

const collectionsToBackfill = [
  'articles',
  'guides',
  'news',
  'interviews',
  'events',
  'flippers',
  'visual-stories',
  'photosOfTheDay',
];

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const getFallbackPublishedAt = (data) =>
  data.createdAt || data.updatedAt || now;

const getPatchForDoc = (data) => {
  const hasPublished = hasOwn(data, 'published');
  const hasPublishedAt = hasOwn(data, 'publishedAt');
  const published = hasPublished ? Boolean(data.published) : true;
  const publishedAt = published
    ? data.publishedAt || getFallbackPublishedAt(data)
    : null;

  const patch = {};

  if (!hasPublished) {
    patch.published = published;
  }

  if (!hasPublishedAt) {
    patch.publishedAt = publishedAt;
  }

  return patch;
};

const run = async () => {
  let totalScanned = 0;
  let totalMatched = 0;
  let totalUpdated = 0;

  console.log(`Mode: ${shouldApply ? 'APPLY' : 'DRY RUN'}`);
  console.log('');

  for (const collectionName of collectionsToBackfill) {
    const snapshot = await db.collection(collectionName).get();
    totalScanned += snapshot.size;

    const matchedDocs = snapshot.docs
      .map((doc) => ({ doc, patch: getPatchForDoc(doc.data()) }))
      .filter(({ patch }) => Object.keys(patch).length > 0);

    totalMatched += matchedDocs.length;
    console.log(`${collectionName}: ${matchedDocs.length}/${snapshot.size} need update`);

    matchedDocs.slice(0, 5).forEach(({ doc, patch }) => {
      const data = doc.data();
      console.log(
        `  [MATCH] id=${doc.id} title="${data.title || data.caption || ''}" patch=${JSON.stringify({
          ...patch,
          publishedAt: patch.publishedAt ? '[timestamp]' : null,
        })}`,
      );
    });

    if (!shouldApply || matchedDocs.length === 0) {
      continue;
    }

    let batch = db.batch();
    let operationsInBatch = 0;

    for (const { doc, patch } of matchedDocs) {
      batch.update(doc.ref, patch);
      operationsInBatch += 1;
      totalUpdated += 1;

      if (operationsInBatch === 400) {
        await batch.commit();
        batch = db.batch();
        operationsInBatch = 0;
      }
    }

    if (operationsInBatch > 0) {
      await batch.commit();
    }
  }

  console.log('');
  console.log(`Total documents scanned: ${totalScanned}`);
  console.log(`Documents needing update: ${totalMatched}`);

  if (shouldApply) {
    console.log(`Updated: ${totalUpdated}`);
  } else {
    console.log('');
    console.log('DRY RUN. To apply, run:');
    console.log('  node scripts/backfillPublishedFields.js --apply');
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Published fields backfill failed:', error);
    process.exit(1);
  });
