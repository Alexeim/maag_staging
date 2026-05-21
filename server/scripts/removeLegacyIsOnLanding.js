/**
 * Cleanup / seed helper for legacy isOnLanding flags.
 *
 * Usage (run from server/):
 *   node scripts/removeLegacyIsOnLanding.js
 *   node scripts/removeLegacyIsOnLanding.js --apply
 *   node scripts/removeLegacyIsOnLanding.js --seed-landing-doc
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const admin = require('firebase-admin');

const shouldApply = process.argv.includes('--apply');
const shouldSeedLandingDoc = process.argv.includes('--seed-landing-doc');

if (shouldApply && shouldSeedLandingDoc) {
  console.error('Use only one mode at a time: --apply or --seed-landing-doc.');
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
const collectionsToCleanup = [
  'articles',
  'guides',
  'visual-stories',
  'events',
  'news',
];

const normalizeMainHeroCandidate = (doc, type, hrefPrefix) => ({
  id: doc.id,
  type,
  title: doc.data()?.title || '',
  href: `${hrefPrefix}/${doc.id}`,
});

const getLegacyMainHeroSeed = async () => {
  const [articlesSnapshot, guidesSnapshot, newsSnapshot] = await Promise.all([
    db.collection('articles').orderBy('createdAt', 'desc').get(),
    db.collection('guides').orderBy('createdAt', 'desc').get(),
    db.collection('news').orderBy('createdAt', 'desc').get(),
  ]);

  const pinnedArticle = articlesSnapshot.docs.find((doc) => Boolean(doc.data()?.isOnLanding));
  if (pinnedArticle) {
    return normalizeMainHeroCandidate(pinnedArticle, 'article', '/article');
  }

  const pinnedNews = newsSnapshot.docs.find((doc) => Boolean(doc.data()?.isOnLanding));
  if (pinnedNews) {
    console.warn(
      `[SEED WARNING] News ${pinnedNews.id} has legacy isOnLanding=true, but news can not become mainHero in the new model.`,
    );
  }

  const pinnedGuide = guidesSnapshot.docs.find((doc) => Boolean(doc.data()?.isOnLanding));
  if (pinnedGuide) {
    return normalizeMainHeroCandidate(pinnedGuide, 'guide', '/guide');
  }

  return null;
};

const getLegacyFeaturedEventId = async () => {
  const eventsSnapshot = await db.collection('events').orderBy('startDate', 'desc').get();
  const pinnedEvent = eventsSnapshot.docs.find((doc) => Boolean(doc.data()?.isOnLanding));
  return pinnedEvent?.id ?? null;
};

const printDryRunSummary = async () => {
  let total = 0;

  for (const collectionName of collectionsToCleanup) {
    const snapshot = await db.collection(collectionName).get();
    const matched = snapshot.docs.filter((doc) => Object.prototype.hasOwnProperty.call(doc.data(), 'isOnLanding'));
    total += matched.length;
    console.log(`${collectionName}: ${matched.length}`);
  }

  console.log('');
  console.log(`Total legacy isOnLanding fields: ${total}`);
  console.log('');
  console.log('DRY RUN.');
  console.log('To apply cleanup: node scripts/removeLegacyIsOnLanding.js --apply');
  console.log('To print seed payload: node scripts/removeLegacyIsOnLanding.js --seed-landing-doc');
};

const applyCleanup = async () => {
  let total = 0;

  for (const collectionName of collectionsToCleanup) {
    const snapshot = await db.collection(collectionName).get();
    const matched = snapshot.docs.filter((doc) => Object.prototype.hasOwnProperty.call(doc.data(), 'isOnLanding'));

    if (matched.length === 0) {
      console.log(`${collectionName}: 0`);
      continue;
    }

    let batch = db.batch();
    let operationsInBatch = 0;

    for (const doc of matched) {
      batch.update(doc.ref, {
        isOnLanding: admin.firestore.FieldValue.delete(),
      });
      operationsInBatch += 1;
      total += 1;

      if (operationsInBatch === 400) {
        await batch.commit();
        batch = db.batch();
        operationsInBatch = 0;
      }
    }

    if (operationsInBatch > 0) {
      await batch.commit();
    }

    console.log(`${collectionName}: ${matched.length}`);
  }

  console.log('');
  console.log(`Removed legacy isOnLanding fields: ${total}`);
};

const printSeedPayload = async () => {
  const [mainHero, featuredEventId] = await Promise.all([
    getLegacyMainHeroSeed(),
    getLegacyFeaturedEventId(),
  ]);

  const payload = {
    schemaVersion: 1,
    mainHero: mainHero ? { type: mainHero.type, id: mainHero.id } : null,
    featuredEventId,
    featuredInterviewInCultureId: null,
    updatedAt: null,
    updatedBy: null,
  };

  console.log(JSON.stringify(payload, null, 2));
};

const run = async () => {
  if (shouldSeedLandingDoc) {
    await printSeedPayload();
    return;
  }

  if (shouldApply) {
    await applyCleanup();
    return;
  }

  await printDryRunSummary();
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Legacy cleanup failed:', error);
    process.exit(1);
  });
