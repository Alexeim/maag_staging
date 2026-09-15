/**
 * One-off migration: converts the legacy single `tips` field on an article
 * document into a regular `tips` content block appended to `content`.
 *
 * Before this migration, every article could have at most one tips box,
 * stored in a dedicated `tips` field and always rendered at the very bottom
 * of the article, outside of the `content` blocks array. After it, `tips` is
 * just another block type inside `content`, so it can be repeated and moved
 * like any other block.
 *
 * This script appends the migrated block at the end of `content` for each
 * article, which preserves the exact visual position the tips box already
 * had (it was always rendered after all content blocks). It then removes the
 * legacy `tips` field from the document.
 *
 * Usage (run from server/):
 *   node scripts/migrateTipsToContentBlock.js            # dry run, no writes
 *   node scripts/migrateTipsToContentBlock.js --apply    # writes changes
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const crypto = require('crypto');
const admin = require('firebase-admin');

const APPLY = process.argv.includes('--apply');

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

const TIP_TYPES = new Set([
  'location',
  'time',
  'money',
  'idea',
  'like',
  'dislike',
  'link',
]);

// Mirrors the normalizeTips logic that used to live in articleController.ts:
// dedupe by type, drop empty/unknown entries, keep url only for 'link'.
function normalizeTips(tips) {
  if (!Array.isArray(tips)) {
    return [];
  }
  const deduped = new Set();
  const normalized = [];
  for (const rawTip of tips) {
    if (!rawTip || typeof rawTip !== 'object') continue;
    const type = String(rawTip.type ?? '').trim().toLowerCase();
    const text = String(rawTip.text ?? '').trim();
    if (!type || !TIP_TYPES.has(type) || !text || deduped.has(type)) continue;
    const url =
      type === 'link' && typeof rawTip.url === 'string' ? rawTip.url.trim() : undefined;
    deduped.add(type);
    normalized.push({ type, text, ...(url ? { url } : {}) });
  }
  return normalized;
}

async function migrate() {
  console.log(`Mode: ${APPLY ? 'APPLY (writing changes)' : 'DRY RUN (no writes)'}`);

  const snapshot = await db.collection('articles').get();
  console.log(`Scanned ${snapshot.size} article(s).`);

  let migrated = 0;
  let skippedNoTips = 0;
  let skippedAlreadyBlock = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const normalizedTips = normalizeTips(data.tips);

    if (normalizedTips.length === 0) {
      skippedNoTips += 1;
      continue;
    }

    const content = Array.isArray(data.content) ? data.content : [];
    const hasTipsBlock = content.some((block) => block && block.type === 'tips');
    if (hasTipsBlock) {
      // Article was already re-saved through the new editor after the code
      // deploy; don't duplicate the tips block.
      skippedAlreadyBlock += 1;
      continue;
    }

    const tipsBlock = {
      id: crypto.randomUUID(),
      type: 'tips',
      position: content.length,
      tips: normalizedTips,
    };

    console.log(
      `- ${doc.id}: migrating ${normalizedTips.length} tip(s) into a content block at position ${tipsBlock.position}`,
    );

    if (APPLY) {
      batch.update(doc.ref, {
        content: [...content, tipsBlock],
        tips: admin.firestore.FieldValue.delete(),
      });
      batchCount += 1;
      if (batchCount >= 400) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    migrated += 1;
  }

  if (APPLY && batchCount > 0) {
    await batch.commit();
  }

  console.log('---');
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped (no tips): ${skippedNoTips}`);
  console.log(`Skipped (already has a tips block): ${skippedAlreadyBlock}`);
  if (!APPLY) {
    console.log('Dry run only — rerun with --apply to write these changes.');
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
