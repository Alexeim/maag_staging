import { algoliasearch } from 'algoliasearch';
import { createSearchIndexAdapter, type SearchIndexAdapter, type SearchIndexClient } from '../utils/searchIndexSync';

// The only indexes this code may write. `maag_pilot` is the reference
// snapshot of the pilot and is deliberately not listed.
export const WRITABLE_SEARCH_INDEXES = ['maag_materials_dev', 'maag_materials_prod'] as const;
export type WritableSearchIndex = (typeof WRITABLE_SEARCH_INDEXES)[number];

export interface AlgoliaWriteConfig {
  appId: string;
  writeApiKey: string;
  indexName: WritableSearchIndex;
}

/**
 * Reads the server-side Algolia config. Error messages name the variable,
 * never its value, so a key can't end up in logs.
 */
export const readAlgoliaWriteConfig = (env: NodeJS.ProcessEnv = process.env): AlgoliaWriteConfig => {
  const missing = ['ALGOLIA_APP_ID', 'ALGOLIA_WRITE_API_KEY', 'ALGOLIA_INDEX_NAME']
    .filter((name) => !env[name]?.trim());
  if (missing.length > 0) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  const indexName = env.ALGOLIA_INDEX_NAME!.trim();
  if (!(WRITABLE_SEARCH_INDEXES as readonly string[]).includes(indexName)) {
    throw new Error(`ALGOLIA_INDEX_NAME must be one of ${WRITABLE_SEARCH_INDEXES.join(', ')}`);
  }
  return {
    appId: env.ALGOLIA_APP_ID!.trim(),
    writeApiKey: env.ALGOLIA_WRITE_API_KEY!.trim(),
    indexName: indexName as WritableSearchIndex,
  };
};

// The return type makes the compiler check the real client against our interface.
export const createAlgoliaClient = (config: AlgoliaWriteConfig): SearchIndexClient =>
  algoliasearch(config.appId, config.writeApiKey);

export const createAlgoliaSearchIndex = (config: AlgoliaWriteConfig = readAlgoliaWriteConfig()): SearchIndexAdapter =>
  createSearchIndexAdapter(createAlgoliaClient(config), config.indexName);
