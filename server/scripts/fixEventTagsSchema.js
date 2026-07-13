/**
 * Fixes `events` documents whose tags/schema don't match what this app's
 * dashboard actually produces (found via "Нормы тела в Palais de Tokyo",
 * id MEGwEPzKZKsRh04a8ALN — created outside the dashboard, with an English
 * tag value doubling as a district code, plus a stray `techTags` field):
 *
 *   - Drops Paris district codes (e.g. "district-16") from `tags` — a
 *     district belongs in a location field, never in tags, and must never
 *     stand in for a real category tag.
 *   - Translates known English event-tag values to Russian (ballet -> Балет,
 *     etc.), same as articles/culture/paris already store their tags in
 *     Russian.
 *   - Deletes the `techTags` field — unused anywhere in the current schema.
 *
 * Tag values that are neither a known English event tag, already Russian,
 * nor a district code are left untouched and logged as UNRECOGNIZED for
 * manual review — this script never guesses a translation.
 *
 * Usage (run from server/):
 *   node scripts/fixEventTagsSchema.js            # dry-run
 *   node scripts/fixEventTagsSchema.js --apply     # apply changes
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

// Same English -> Russian mapping this app's EventTags.json dictionary used
// before events were switched to storing tags in Russian directly.
const ENGLISH_TO_RUSSIAN_EVENT_TAG = {
  ballet: 'Балет',
  dance: 'Танец',
  opera: 'Опера',
  classicalMusic: 'Классическая музыка',
  cinema: 'Кино',
  theatre: 'Театр',
  exhibitions: 'Выставки',
  festival: 'Фестиваль',
  artMarket: 'Арт-рынок',
  fashion: 'Мода',
  meetup: 'Встреча',
  visit: 'Визит',
  excursion: 'Экскурсия',
  kids: 'Дети',
  paris: 'Париж',
  // Leaked in from other categories' tag dictionaries (Paris subcategories,
  // Culture), same class of mixup as district codes ending up in tags.
  parisEvent: 'Событие', // ParisTags.json subcategory value
  architecture: 'Архитектура', // CultureTags.json / ParisTags.json value
};

const isDistrictTag = (value) => /^district-\d+$/i.test(value);
const isAlreadyRussian = (value) => /[а-яёА-ЯЁ]/.test(value);

const getPatchForDoc = (data) => {
  const patch = {};
  const notes = [];
  let changed = false;

  const rawTags = Array.isArray(data.tags) ? data.tags : [];
  const newTags = [];

  for (const tag of rawTags) {
    if (typeof tag !== 'string' || !tag.trim()) {
      continue;
    }
    const trimmed = tag.trim();

    if (isDistrictTag(trimmed)) {
      notes.push(`drop district tag "${trimmed}"`);
      changed = true;
      continue;
    }

    if (isAlreadyRussian(trimmed)) {
      newTags.push(trimmed);
      continue;
    }

    const translated = ENGLISH_TO_RUSSIAN_EVENT_TAG[trimmed];
    if (translated) {
      notes.push(`translate "${trimmed}" -> "${translated}"`);
      newTags.push(translated);
      changed = true;
      continue;
    }

    notes.push(`UNRECOGNIZED tag "${trimmed}" — left as-is, needs manual review`);
    newTags.push(trimmed);
  }

  if (changed) {
    patch.tags = newTags;
  }

  if (Array.isArray(data.techTags) && data.techTags.length > 0) {
    patch.techTags = admin.firestore.FieldValue.delete();
    notes.push(`delete techTags=${JSON.stringify(data.techTags)}`);
    changed = true;
  }

  return { patch, notes, changed, resultingTags: newTags };
};

const run = async () => {
  console.log(`Mode: ${shouldApply ? 'APPLY' : 'DRY RUN'}`);
  console.log('');

  const snapshot = await db.collection('events').get();
  const matched = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const { patch, notes, changed, resultingTags } = getPatchForDoc(data);
    if (!changed) continue;

    matched.push({ doc, patch, notes, resultingTags });
    console.log(`[MATCH] id=${doc.id} title="${data.title || ''}"`);
    notes.forEach((note) => console.log(`  - ${note}`));
    if (resultingTags.length === 0) {
      console.log('  ! resulting tags array would be EMPTY — needs a real tag added manually');
    }
  }

  console.log('');
  console.log(`Total events scanned: ${snapshot.size}`);
  console.log(`Documents needing a fix: ${matched.length}`);

  if (shouldApply) {
    let batch = db.batch();
    let operationsInBatch = 0;
    let updated = 0;

    for (const { doc, patch } of matched) {
      batch.update(doc.ref, patch);
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
    console.log('  node scripts/fixEventTagsSchema.js --apply');
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fix failed:', error);
    process.exit(1);
  });
