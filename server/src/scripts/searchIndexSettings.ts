/**
 * Shows or applies SEARCH_INDEX_SETTINGS on the Algolia index named in
 * ALGOLIA_INDEX_NAME. Touches settings only, never records, never Firebase.
 *
 * Usage (run from server/):
 *   npm run search:settings:dry      # read the index, print what would change
 *   npm run search:settings:apply    # write the settings, then verify them
 */
import 'dotenv/config';
import { createAlgoliaClient, readAlgoliaWriteConfig } from '../services/algoliaClient';
import { runSearchIndexSettingsCommand, type SettingsChange } from '../utils/searchIndexSettingsCommand';

const printChanges = (changes: SettingsChange[]): void => {
  for (const { key, current, expected } of changes) {
    console.log(`  ${key}\n    now:  ${JSON.stringify(current)}\n    want: ${JSON.stringify(expected)}`);
  }
};

const run = async (): Promise<void> => {
  const apply = process.argv.includes('--apply');
  const config = readAlgoliaWriteConfig();
  console.log(`Algolia app ${config.appId}, index ${config.indexName}, mode ${apply ? 'APPLY' : 'dry run'}`);

  const result = await runSearchIndexSettingsCommand({
    client: createAlgoliaClient(config), indexName: config.indexName, apply,
  });

  if (result.mode === 'dry-run') {
    if (!result.indexExists) console.log(`Index ${config.indexName} does not exist yet.`);
    if (result.changes.length === 0) {
      console.log('Settings already match. Nothing to do.');
      return;
    }
    console.log(`${result.changes.length} setting(s) would change:`);
    printChanges(result.changes);
    console.log('Dry run: nothing written. Re-run with --apply to write them.');
    return;
  }
  if (result.taskID === null) {
    console.log('Settings already match. Nothing written.');
    return;
  }
  console.log(`${result.indexExisted ? 'Updated' : 'Created'} ${config.indexName}, task ${result.taskID}; settings verified:`);
  printChanges(result.changes);
};

run().catch((error: unknown) => {
  // Only the message: SDK errors carry request traces that are never printed.
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed: ${message}`);
  process.exitCode = 1;
});
