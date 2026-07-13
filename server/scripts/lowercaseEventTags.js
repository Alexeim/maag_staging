/**
 * Lowercases `tags` on `events` documents so event tags match the casing
 * convention already used by articles/guides/news (Culture/Paris tag
 * dictionaries are all lowercase). EventTags.json used to be capitalized
 * ("Балет", "Танец"...) and got copied verbatim into the DB by
 * fixEventTagsSchema.js — this fixes that follow-up mismatch.
 *
 * Usage (run from server/):
 *   node scripts/lowercaseEventTags.js            # dry-run
 *   node scripts/lowercaseEventTags.js --apply     # apply changes
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

const run = async () => {
  console.log(`Mode: ${shouldApply ? 'APPLY' : 'DRY RUN'}`);
  console.log('');

  const snapshot = await db.collection('events').get();
  const matched = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const rawTags = Array.isArray(data.tags) ? data.tags : [];
    const lowered = rawTags.map((tag) => (typeof tag === 'string' ? tag.toLowerCase() : tag));

    const changed = rawTags.some((tag, i) => tag !== lowered[i]);
    if (!changed) continue;

    matched.push({ doc, tags: lowered });
    console.log(`[MATCH] id=${doc.id} title="${data.title || ''}" ${JSON.stringify(rawTags)} -> ${JSON.stringify(lowered)}`);
  }

  console.log('');
  console.log(`Total events scanned: ${snapshot.size}`);
  console.log(`Documents needing lowercasing: ${matched.length}`);

  if (shouldApply) {
    let batch = db.batch();
    let operationsInBatch = 0;
    let updated = 0;

    for (const { doc, tags } of matched) {
      batch.update(doc.ref, { tags });
      operationsInBatch += 1;
      updated += 1;

      if (operationsInBatch === 400) {
        await batch.commit();
        batch = db.batch();
        operationsInBatch = 0;
      }
    }

    if (operationsInBatch > 0) {
      await batch.commit();
    }

    console.log(`Updated: ${updated}`);
  } else {
    console.log('');
    console.log('DRY RUN. To apply, run:');
    console.log('  node scripts/lowercaseEventTags.js --apply');
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Lowercasing failed:', error);
    process.exit(1);
  });
