/**
 * Repair helper for editorialPlacements/landing mainHero schema.
 *
 * Usage (run from server/):
 *   node scripts/fixLandingMainHeroSchema.js
 *   node scripts/fixLandingMainHeroSchema.js --apply
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
const landingPlacementsRef = db.collection('editorialPlacements').doc('landing');

const ALLOWED_MAIN_HERO_TYPES = new Set([
  'article',
  'guide',
  'interview',
  'flipper',
  'visual-story',
]);

const normalizeStringId = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeLegacyMainHero = (value) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const type = value.type;
  const id = normalizeStringId(value.id);

  if (!ALLOWED_MAIN_HERO_TYPES.has(type) || !id) {
    return null;
  }

  return {
    mode: 'manual',
    type,
    id,
  };
};

const normalizeRefMainHero = (value) => {
  if (!value || typeof value !== 'object' || !value.ref || typeof value.ref !== 'object') {
    return null;
  }

  const type = value.ref.type;
  const id = normalizeStringId(value.ref.id);

  if (!ALLOWED_MAIN_HERO_TYPES.has(type) || !id) {
    return null;
  }

  return {
    mode: 'manual',
    type,
    id,
  };
};

const normalizeMainHero = (value) => {
  if (value === null) {
    return {
      normalized: null,
      source: 'null',
    };
  }

  const fromRef = normalizeRefMainHero(value);
  if (fromRef) {
    return {
      normalized: fromRef,
      source: 'ref',
    };
  }

  const fromLegacy = normalizeLegacyMainHero(value);
  if (fromLegacy) {
    return {
      normalized: fromLegacy,
      source: 'legacy',
    };
  }

  return {
    normalized: null,
    source: 'invalid',
  };
};

const areEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const run = async () => {
  const landingDoc = await landingPlacementsRef.get();

  if (!landingDoc.exists) {
    console.log('editorialPlacements/landing does not exist.');
    return;
  }

  const rawData = landingDoc.data() || {};
  const rawMainHero = Object.prototype.hasOwnProperty.call(rawData, 'mainHero')
    ? rawData.mainHero
    : undefined;

  const { normalized, source } = normalizeMainHero(rawMainHero);
  const nextData = {
    ...rawData,
    mainHero: normalized,
  };

  console.log('Current mainHero:');
  console.log(JSON.stringify(rawMainHero ?? null, null, 2));
  console.log('');
  console.log(`Normalization source: ${source}`);
  console.log('Next mainHero:');
  console.log(JSON.stringify(normalized, null, 2));
  console.log('');

  if (areEqual(rawMainHero ?? null, normalized)) {
    console.log('No mainHero schema changes are needed.');
    return;
  }

  if (!shouldApply) {
    console.log('DRY RUN.');
    console.log('To apply fix: node scripts/fixLandingMainHeroSchema.js --apply');
    return;
  }

  await landingPlacementsRef.set(nextData);
  console.log('Applied mainHero schema fix to editorialPlacements/landing.');
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Landing mainHero repair failed:', error);
    process.exit(1);
  });
