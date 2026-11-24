import { describe, expect, test } from 'vitest';
import type { IndexSettings } from 'algoliasearch';
import { SEARCH_INDEX_SETTINGS } from '../src/utils/searchIndexSettings';
import {
  classifyAlgoliaError, runSearchIndexSettingsCommand, SearchSettingsCommandError,
} from '../src/utils/searchIndexSettingsCommand';
import type { SearchIndexClient } from '../src/utils/searchIndexSync';

const apiError = (status: number, message = `HTTP ${status}`) => Object.assign(new Error(message), { status });

/**
 * Fake index whose existence and failures are scripted. `settings === null`
 * means the index does not exist (getSettings → 404).
 */
const createSettingsFake = (options: {
  settings: IndexSettings | null;
  getError?: Error;
  setError?: Error;
  waitError?: Error;
  setCreatesIndex?: boolean;
  setIgnoresKeys?: string[];
}) => {
  let settings = options.settings;
  const writes: IndexSettings[] = [];
  const client: SearchIndexClient = {
    async browseObjects() { throw new Error('not used'); },
    async batch() { throw new Error('not used'); },
    async waitForTask() {
      if (options.waitError) throw options.waitError;
      return {};
    },
    async getSettings() {
      if (options.getError) throw options.getError;
      if (settings === null) throw apiError(404, 'Index does not exist');
      return settings;
    },
    async setSettings({ indexSettings }) {
      if (options.setError) throw options.setError;
      writes.push(indexSettings);
      if (settings === null && options.setCreatesIndex === false) return { taskID: 7 };
      const applied = Object.fromEntries(Object.entries(indexSettings)
        .filter(([key]) => !(options.setIgnoresKeys ?? []).includes(key)));
      settings = { ...(settings ?? {}), ...applied };
      return { taskID: 7 };
    },
  };
  return { client, writes };
};

const run = (client: SearchIndexClient, apply: boolean) =>
  runSearchIndexSettingsCommand({ client, indexName: 'maag_materials_dev', apply });

describe('dry run (default)', () => {
  test('existing index with other settings: reports every change, writes nothing', async () => {
    const fake = createSettingsFake({ settings: { searchableAttributes: ['title'] } });
    const result = await run(fake.client, false);
    expect(result).toMatchObject({ mode: 'dry-run', indexExists: true });
    expect(result.changes.map((change) => change.key)).toEqual(Object.keys(SEARCH_INDEX_SETTINGS));
    expect(result.changes[0]).toEqual({
      key: 'searchableAttributes', current: ['title'], expected: SEARCH_INDEX_SETTINGS.searchableAttributes,
    });
    expect(fake.writes).toEqual([]);
  });

  test('missing index: says so, lists all settings as new, writes nothing', async () => {
    const fake = createSettingsFake({ settings: null });
    const result = await run(fake.client, false);
    expect(result).toMatchObject({ mode: 'dry-run', indexExists: false });
    expect(result.changes.every((change) => change.current === null)).toBe(true);
    expect(fake.writes).toEqual([]);
  });

  test('settings already match: no changes', async () => {
    const fake = createSettingsFake({ settings: { ...SEARCH_INDEX_SETTINGS, distinct: 1 } });
    expect(await run(fake.client, false)).toEqual({ mode: 'dry-run', indexExists: true, changes: [] });
  });
});

describe('--apply', () => {
  test('writes once, then verifies by reading back', async () => {
    const fake = createSettingsFake({ settings: {} });
    const result = await run(fake.client, true);
    expect(result).toMatchObject({ mode: 'apply', indexExisted: true, taskID: 7 });
    expect(fake.writes).toEqual([SEARCH_INDEX_SETTINGS]);
  });

  test('settings already match: nothing written', async () => {
    const fake = createSettingsFake({ settings: { ...SEARCH_INDEX_SETTINGS } });
    expect(await run(fake.client, true)).toMatchObject({ mode: 'apply', taskID: null });
    expect(fake.writes).toEqual([]);
  });

  test('missing index that setSettings creates: reported as created', async () => {
    const fake = createSettingsFake({ settings: null });
    expect(await run(fake.client, true)).toMatchObject({ mode: 'apply', indexExisted: false, taskID: 7 });
  });

  test('missing index that setSettings does not create: an error, not a success', async () => {
    const fake = createSettingsFake({ settings: null, setCreatesIndex: false });
    await expect(run(fake.client, true)).rejects.toThrow(/still does not exist after setSettings/);
  });

  test('settings that do not stick: an error naming the keys', async () => {
    const fake = createSettingsFake({ settings: {}, setIgnoresKeys: ['distinct'] });
    await expect(run(fake.client, true)).rejects.toThrow(/still differ after task 7: distinct/);
  });
});

describe('access and other failures', () => {
  test.each([401, 403])('HTTP %i on read: an access error that names rights, not the key', async (status) => {
    const fake = createSettingsFake({ settings: {}, getError: apiError(status, 'Invalid Application-ID or API key') });
    const error = await run(fake.client, false).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SearchSettingsCommandError);
    expect((error as Error).message).toMatch(new RegExp(`Access denied \\(HTTP ${status}\\) on getSettings for index maag_materials_dev`));
    expect((error as Error).message).toMatch(/settings and editSettings/);
  });

  test('HTTP 403 on write (key can read but not edit settings)', async () => {
    const fake = createSettingsFake({ settings: {}, setError: apiError(403, 'Method not allowed with this API key') });
    await expect(run(fake.client, true)).rejects.toThrow(/Access denied \(HTTP 403\) on setSettings/);
  });

  test('HTTP 403 on waitForTask: the write happened, the message says so and names addObject', async () => {
    const fake = createSettingsFake({ settings: {}, waitError: apiError(403, 'Method not allowed with this API key') });
    const error = await run(fake.client, true).catch((caught: unknown) => caught);
    expect(fake.writes).toEqual([SEARCH_INDEX_SETTINGS]);
    expect(error).toBeInstanceOf(SearchSettingsCommandError);
    const { message } = error as Error;
    expect(message).toMatch(/Access denied \(HTTP 403\) on waitForTask for index maag_materials_dev/);
    expect(message).toMatch(/accepted as task 7 and may already be applied/);
    expect(message).toMatch(/addObject/);
    expect(message).not.toMatch(/on setSettings/);
  });

  test('other failures are passed through unchanged', async () => {
    const failure = apiError(500, 'Internal error');
    const fake = createSettingsFake({ settings: {}, getError: failure });
    await expect(run(fake.client, false)).rejects.toBe(failure);
  });

  test('classification by status or by SDK error class name', () => {
    expect(classifyAlgoliaError(apiError(404)).kind).toBe('missing-index');
    expect(classifyAlgoliaError(Object.assign(new Error('x'), { name: 'IndexNotFoundError' })).kind).toBe('missing-index');
    expect(classifyAlgoliaError(apiError(403)).kind).toBe('access-denied');
    expect(classifyAlgoliaError(new Error('network')).kind).toBe('other');
  });
});
