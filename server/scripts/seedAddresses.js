/**
 * Seeds the `addresses` collection from scripts/seedAddresses.json — a
 * hand-curated, deduplicated list of venues pulled from existing `events`
 * documents (see chat history / commit message for how it was built).
 * Skips titles that already exist in the collection, so it's safe to re-run.
 *
 * Usage (run from server/):
 *   node scripts/seedAddresses.js            # dry-run
 *   node scripts/seedAddresses.js --apply     # apply changes
 */

const path = require('path');
const fs = require('fs');
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

const seedData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'seedAddresses.json'), 'utf8'),
);

const run = async () => {
  console.log(`Mode: ${shouldApply ? 'APPLY' : 'DRY RUN'}`);
  console.log('');

  const snapshot = await db.collection('addresses').get();
  const existingTitles = new Set(
    snapshot.docs.map((doc) => (doc.data().title || '').trim().toLowerCase()),
  );

  const toCreate = seedData.filter(
    (entry) => !existingTitles.has(entry.title.trim().toLowerCase()),
  );
  const skipped = seedData.length - toCreate.length;

  toCreate.forEach((entry) => {
    console.log(`[CREATE] "${entry.title}" -> ${entry.address}`);
  });

  console.log('');
  console.log(`Total in seed file: ${seedData.length}`);
  console.log(`Already in DB (skipped): ${skipped}`);
  console.log(`To create: ${toCreate.length}`);

  if (shouldApply) {
    let batch = db.batch();
    let operationsInBatch = 0;
    let created = 0;
    const now = new Date();

    for (const entry of toCreate) {
      const docRef = db.collection('addresses').doc();
      batch.set(docRef, {
        title: entry.title,
        address: entry.address,
        createdAt: now,
      });
      operationsInBatch += 1;
      created += 1;

      if (operationsInBatch === 400) {
        await batch.commit();
        batch = db.batch();
        operationsInBatch = 0;
      }
    }

    if (operationsInBatch > 0) {
      await batch.commit();
    }

    console.log(`Created: ${created}`);
  } else {
    console.log('');
    console.log('DRY RUN. To apply, run:');
    console.log('  node scripts/seedAddresses.js --apply');
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
