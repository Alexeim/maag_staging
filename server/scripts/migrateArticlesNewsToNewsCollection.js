/**
 * Migration: copies legacy news from `articles` to `news`.
 *
 * Usage (run from server/):
 *   node scripts/migrateArticlesNewsToNewsCollection.js
 *   node scripts/migrateArticlesNewsToNewsCollection.js --apply-copy
 *   node scripts/migrateArticlesNewsToNewsCollection.js --apply-delete
 *   node scripts/migrateArticlesNewsToNewsCollection.js --cleanup-flags
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const admin = require('firebase-admin');

const shouldCopy = process.argv.includes('--apply-copy');
const shouldDelete = process.argv.includes('--apply-delete');
const shouldCleanupFlags = process.argv.includes('--cleanup-flags');

const enabledModes = [shouldCopy, shouldDelete, shouldCleanupFlags].filter(Boolean).length;

if (enabledModes > 1) {
  console.error('Use only one mode at a time: --apply-copy, --apply-delete, or --cleanup-flags.');
  process.exit(1);
}

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
const articlesCollection = db.collection('articles');
const newsCollection = db.collection('news');

const normalizeStringArray = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];

async function migrate() {
  if (shouldCleanupFlags) {
    await cleanupFlags();
    return;
  }

  const snapshot = await articlesCollection.get();

  let matched = 0;
  let copied = 0;
  let deleted = 0;
  let skippedExisting = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (data.isNews !== true) {
      continue;
    }

    matched += 1;
    console.log(`[MATCH] id=${doc.id} title="${data.title}"`);

    const targetRef = newsCollection.doc(doc.id);

    if (shouldCopy) {
      const targetDoc = await targetRef.get();
      if (targetDoc.exists) {
        skippedExisting += 1;
        console.log('  -> skipped: already exists in news');
      } else {
        const payload = {
          title: data.title ?? '',
          lead: data.lead ?? '',
          cardLead: data.cardLead ?? '',
          authorId: data.authorId ?? '',
          content: Array.isArray(data.content) ? data.content : [],
          imageUrl: data.imageUrl ?? '',
          imageCaption: data.imageCaption ?? '',
          category: typeof data.category === 'string' ? data.category : '',
          tags: normalizeStringArray(data.tags),
          techTags: normalizeStringArray(data.techTags),
          isHotContent: Boolean(data.isHotContent),
          isOnLanding: Boolean(data.isOnLanding),
          isMainInCategory: Boolean(data.isMainInCategory),
          createdAt: data.createdAt ?? admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: data.updatedAt ?? null,
          legacySourceCollection: 'articles',
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await targetRef.set(payload);
        copied += 1;
        console.log('  -> copied to news');
      }
    }

    if (shouldDelete) {
      await articlesCollection.doc(doc.id).delete();
      deleted += 1;
      console.log('  -> deleted from articles');
    }
  }

  console.log('');
  console.log(`Matched:          ${matched}`);
  console.log(`Copied:           ${copied}`);
  console.log(`Skipped existing: ${skippedExisting}`);
  console.log(`Deleted:          ${deleted}`);

  if (!shouldCopy && !shouldDelete) {
    console.log('');
    console.log('DRY RUN.');
    console.log('To copy:   node scripts/migrateArticlesNewsToNewsCollection.js --apply-copy');
    console.log('To delete: node scripts/migrateArticlesNewsToNewsCollection.js --apply-delete');
    console.log('To cleanup legacy flags: node scripts/migrateArticlesNewsToNewsCollection.js --cleanup-flags');
  }
}

async function cleanupFlags() {
  const [articlesSnapshot, newsSnapshot] = await Promise.all([
    articlesCollection.get(),
    newsCollection.get(),
  ]);

  let cleanedArticles = 0;
  let cleanedNews = 0;

  for (const doc of articlesSnapshot.docs) {
    const data = doc.data();
    if (data.isNews === false) {
      await articlesCollection.doc(doc.id).update({
        isNews: admin.firestore.FieldValue.delete(),
      });
      cleanedArticles += 1;
      console.log(`[CLEANUP][articles] removed isNews=false from ${doc.id}`);
    }
  }

  for (const doc of newsSnapshot.docs) {
    const data = doc.data();
    if ('isNews' in data) {
      await newsCollection.doc(doc.id).update({
        isNews: admin.firestore.FieldValue.delete(),
      });
      cleanedNews += 1;
      console.log(`[CLEANUP][news] removed legacy isNews from ${doc.id}`);
    }
  }

  console.log('');
  console.log(`Cleaned articles: ${cleanedArticles}`);
  console.log(`Cleaned news:     ${cleanedNews}`);
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
