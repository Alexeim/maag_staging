/**
 * Translate one article into French and store it in `articles_fr`
 * (published, with sourceId → the Russian article).
 *
 * Usage (run from server/):
 *   npm run translate:article:dry -- <articleId>    # show what would be sent, call nothing
 *   npm run translate:article:apply -- <articleId>  # translate (paid) and write
 *
 * Region: TRANSLATION_LOCATION (default europe-west1), see services/googleTranslate.ts.
 */

import {
  createFrenchTranslation,
  planArticleTranslation,
} from '../services/articleTranslationStore';

const shouldApply = process.argv.includes('--apply');
const articleId = process.argv.slice(2).find((arg) => !arg.startsWith('--'));

const preview = (text: string) => {
  const flat = text.replace(/\s+/g, ' ');
  return flat.length > 90 ? `${flat.slice(0, 90)}…` : flat;
};

const run = async () => {
  if (!articleId) {
    throw new Error('Pass the article id: npm run translate:article:dry -- <articleId>');
  }

  const plan = await planArticleTranslation(articleId);
  console.log(`Mode:      ${shouldApply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Article:   ${plan.sourceId} "${plan.title}" (${plan.published ? 'published' : 'DRAFT'})`);
  console.log(`Segments:  ${plan.segments.length} ` +
    `(${plan.segments.filter((s) => s.format === 'html').length} html, ` +
    `${plan.segments.filter((s) => s.format === 'text').length} text)`);
  console.log(`Chars:     ${plan.characters}`);
  console.log(`Revision:  ${plan.sourceRevision.slice(0, 12)}…`);
  if (plan.unknownBlockTypes.length > 0) {
    console.log(`WARNING:   unknown block types copied untranslated: ${plan.unknownBlockTypes.join(', ')}`);
  }
  if (plan.existingTranslationId) {
    console.log(`Existing:  already translated → articles_fr/${plan.existingTranslationId}`);
  }
  console.log('');
  plan.segments.slice(0, 5).forEach((segment) => {
    console.log(`  [${segment.format}] ${segment.key.padEnd(18)} ${preview(segment.source)}`);
  });
  if (plan.segments.length > 5) console.log(`  … ${plan.segments.length - 5} more`);

  if (!shouldApply) {
    console.log('');
    console.log(`DRY RUN. To translate and write: npm run translate:article:apply -- ${articleId}`);
    return;
  }

  const created = await createFrenchTranslation(articleId);
  console.log('');
  console.log(
    `Created articles_fr/${created.translationId} ` +
      `(${created.requests} request(s), ${created.characters} chars).`,
  );
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Translation failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
