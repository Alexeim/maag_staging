import type { IndexSettings } from 'algoliasearch';
import { findSettingsDrift, SEARCH_INDEX_SETTINGS } from './searchIndexSettings';
import type { SearchIndexClient } from './searchIndexSync';

export type AlgoliaFailureKind = 'missing-index' | 'access-denied' | 'other';

/**
 * Classifies an Algolia SDK error by its HTTP status (ApiError.status) or
 * class name, without reading anything else from it: the error object also
 * carries request traces, which are never printed.
 */
export const classifyAlgoliaError = (error: unknown): { kind: AlgoliaFailureKind; status: number | null; message: string } => {
  const status = typeof (error as { status?: unknown })?.status === 'number' ? (error as { status: number }).status : null;
  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error);
  if (status === 404 || name === 'IndexNotFoundError') return { kind: 'missing-index', status, message };
  if (status === 401 || status === 403) return { kind: 'access-denied', status, message };
  return { kind: 'other', status, message };
};

export class SearchSettingsCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchSettingsCommandError';
  }
}

const accessDenied = (indexName: string, operation: string, status: number | null): SearchSettingsCommandError =>
  new SearchSettingsCommandError(
    `Access denied (HTTP ${status}) on ${operation} for index ${indexName}: check ALGOLIA_APP_ID, `
    + 'and that ALGOLIA_WRITE_API_KEY is valid, allows this index and has the settings and editSettings rights.',
  );

export interface SettingsChange {
  key: string;
  current: unknown;
  expected: unknown;
}

export type SettingsCommandResult =
  | { mode: 'dry-run'; indexExists: boolean; changes: SettingsChange[] }
  | { mode: 'apply'; indexExisted: boolean; changes: SettingsChange[]; taskID: number | null };

/** Remote settings, or null when the index does not exist. */
const readRemoteSettings = async (client: SearchIndexClient, indexName: string): Promise<IndexSettings | null> => {
  try {
    return await client.getSettings({ indexName });
  } catch (error) {
    const failure = classifyAlgoliaError(error);
    if (failure.kind === 'missing-index') return null;
    if (failure.kind === 'access-denied') throw accessDenied(indexName, 'getSettings', failure.status);
    throw error;
  }
};

const changesFor = (remote: IndexSettings | null): SettingsChange[] => {
  const keys = remote ? findSettingsDrift(remote) : Object.keys(SEARCH_INDEX_SETTINGS);
  return keys.map((key) => ({
    key,
    current: remote ? (remote as Record<string, unknown>)[key] ?? null : null,
    expected: (SEARCH_INDEX_SETTINGS as Record<string, unknown>)[key],
  }));
};

/**
 * Dry run by default: reads the index and reports what would change.
 * With `apply`, writes SEARCH_INDEX_SETTINGS, waits for the task and reads
 * the settings back; any remaining difference is an error, not a success.
 */
export const runSearchIndexSettingsCommand = async ({ client, indexName, apply }: {
  client: SearchIndexClient; indexName: string; apply: boolean;
}): Promise<SettingsCommandResult> => {
  const remote = await readRemoteSettings(client, indexName);
  const changes = changesFor(remote);
  if (!apply) return { mode: 'dry-run', indexExists: remote !== null, changes };
  if (changes.length === 0) return { mode: 'apply', indexExisted: true, changes, taskID: null };

  let taskID: number;
  try {
    ({ taskID } = await client.setSettings({ indexName, indexSettings: SEARCH_INDEX_SETTINGS }));
  } catch (error) {
    const failure = classifyAlgoliaError(error);
    // Nothing was written: the key may not edit settings.
    if (failure.kind === 'access-denied') throw accessDenied(indexName, 'setSettings', failure.status);
    throw error;
  }
  try {
    await client.waitForTask({ indexName, taskID });
  } catch (error) {
    const failure = classifyAlgoliaError(error);
    // The write was accepted; only its status can't be read (getTask needs addObject).
    if (failure.kind === 'access-denied') {
      throw new SearchSettingsCommandError(
        `Access denied (HTTP ${failure.status}) on waitForTask for index ${indexName}: setSettings was accepted `
        + `as task ${taskID} and may already be applied, but its status can't be read. Check that `
        + 'ALGOLIA_WRITE_API_KEY has the addObject right on this index, then run the dry run to see the current settings.',
      );
    }
    throw error;
  }

  // The docs do not promise that setSettings creates a missing index: verify.
  const after = await readRemoteSettings(client, indexName);
  if (after === null) {
    throw new SearchSettingsCommandError(`Index ${indexName} still does not exist after setSettings (task ${taskID}).`);
  }
  const drift = findSettingsDrift(after);
  if (drift.length > 0) {
    throw new SearchSettingsCommandError(`Index ${indexName} settings still differ after task ${taskID}: ${drift.join(', ')}`);
  }
  return { mode: 'apply', indexExisted: remote !== null, changes, taskID };
};
