/**
 * Migration: converts category "news" / "Новости" → isNews: true, category: "culture"
 *
 * Usage (run from server/):
 *   node scripts/migrateNewsCategory.js            # dry-run
 *   node scripts/migrateNewsCategory.js --apply     # apply changes
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const admin = require('firebase-admin');

const applyChanges = process.argv.includes('--apply');

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

async function migrate() {
  const snapshot = await db.collection('articles').get();
  const targetCategories = new Set(['news', 'новости']);

  let matched = 0;
  let updated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const rawCategory = (data.category ?? '').toString().trim().toLowerCase();

    if (!targetCategories.has(rawCategory)) continue;

    matched++;
    console.log(
      `[MATCH] id=${doc.id}  title="${data.title}"  category="${data.category}"  isNews=${data.isNews ?? 'undefined'}`
    );

    if (applyChanges) {
      await db.collection('articles').doc(doc.id).update({
        isNews: true,
        category: 'culture',
      });
      updated++;
      console.log('  → updated: isNews=true, category="culture"');
    }
  }

  console.log('');
  console.log(`Total documents scanned: ${snapshot.size}`);
  console.log(`Matched (news category):  ${matched}`);

  if (applyChanges) {
    console.log(`Updated:                  ${updated}`);
  } else {
    console.log('');
    console.log('DRY RUN. To apply, run:');
    console.log('  node scripts/migrateNewsCategory.js --apply');
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
