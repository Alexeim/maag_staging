/**
 * Compresses existing Firebase Storage images to WebP (max 1920px, quality 82).
 * Handles all image folders. Skips videos and already-small WebP files.
 *
 * Usage (run from server/):
 *   node scripts/compressStorageImages.js --dry-run
 *   node scripts/compressStorageImages.js
 *   node scripts/compressStorageImages.js --folder=articles
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const admin = require('firebase-admin');
const sharp = require('sharp');

const DRY_RUN = process.argv.includes('--dry-run');
const FOLDER_ARG = process.argv.find((a) => a.startsWith('--folder='))?.split('=')[1];

const MAX_WIDTH = 1920;
const WEBP_QUALITY = 82;
const SKIP_BELOW_KB = 200;

const FOLDERS = [
  'articles/',
  'interviews/',
  'guides/',
  'flippers/',
  'visual-stories/',
  'tips-articles/',
];

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp',
  'image/heic',
  'image/heif',
]);

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

const bucket = admin.storage().bucket(
  process.env.FIREBASE_STORAGE_BUCKET || 'maag-60419.firebasestorage.app'
);

async function processFile(file) {
  const [metadata] = await file.getMetadata();
  const contentType = (metadata.contentType || '').toLowerCase();
  const sizeKb = Math.round(Number(metadata.size) / 1024);
  const filePath = file.name;

  if (!IMAGE_MIME_TYPES.has(contentType)) {
    return { filePath, sizeKb, action: 'SKIP', reason: `not an image (${contentType || 'unknown'})` };
  }

  if (contentType === 'image/webp' && sizeKb < SKIP_BELOW_KB) {
    return { filePath, sizeKb, action: 'SKIP', reason: `already WebP at ${sizeKb}kb` };
  }

  if (DRY_RUN) {
    return { filePath, sizeKb, action: 'COMPRESS', reason: `${contentType}, ${sizeKb}kb` };
  }

  const [buffer] = await file.download();
  const compressed = await sharp(buffer)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const newSizeKb = Math.round(compressed.length / 1024);

  await bucket.file(filePath).save(compressed, {
    metadata: { contentType: 'image/webp' },
    resumable: false,
  });

  return { filePath, sizeKb, action: 'COMPRESS', newSizeKb };
}

async function run() {
  console.log('\n Firebase Storage image compressor');
  console.log(`   Mode    : ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE — files will be overwritten'}`);

  const foldersToProcess = FOLDER_ARG
    ? [FOLDER_ARG.endsWith('/') ? FOLDER_ARG : `${FOLDER_ARG}/`]
    : FOLDERS;

  console.log(`   Folders : ${foldersToProcess.join(', ')}\n`);

  if (!DRY_RUN) {
    console.log('   WARNING: This will permanently overwrite original files.');
    console.log('   Starting in 3 seconds... (Ctrl+C to abort)\n');
    await new Promise((r) => setTimeout(r, 3000));
  }

  let total = 0;
  let compressed = 0;
  let skipped = 0;
  let errors = 0;
  let savedKb = 0;

  for (const folder of foldersToProcess) {
    console.log(`--- ${folder}`);
    const [files] = await bucket.getFiles({ prefix: folder });

    for (const file of files) {
      total++;
      let result;
      try {
        result = await processFile(file);
      } catch (err) {
        errors++;
        console.log(`  ERROR : ${file.name} — ${err.message}`);
        continue;
      }

      if (result.action === 'SKIP') {
        skipped++;
        console.log(`  skip  : ${result.filePath} (${result.reason})`);
      } else {
        compressed++;
        if (DRY_RUN) {
          console.log(`  would : ${result.filePath} (${result.sizeKb}kb, ${result.reason})`);
        } else {
          const saving = result.sizeKb - result.newSizeKb;
          savedKb += saving;
          console.log(`  done  : ${result.filePath} (${result.sizeKb}kb -> ${result.newSizeKb}kb, saved ${saving}kb)`);
        }
      }
    }
  }

  console.log('\n' + '-'.repeat(50));
  console.log('Summary:');
  console.log(`  Total scanned  : ${total}`);
  console.log(`  ${DRY_RUN ? 'Would compress' : 'Compressed    '} : ${compressed}`);
  console.log(`  Skipped        : ${skipped}`);
  console.log(`  Errors         : ${errors}`);
  if (!DRY_RUN && savedKb > 0) {
    console.log(`  Total saved    : ${(savedKb / 1024).toFixed(1)} MB`);
  }
  if (DRY_RUN && compressed > 0) {
    console.log('\n  Run without --dry-run to apply changes.');
  }
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
