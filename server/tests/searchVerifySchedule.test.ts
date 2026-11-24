import { describe, expect, test } from 'vitest';
import { SYNC_DEFAULTS, type SyncDeps, type VerifyBatchLimits, type VerifyBatchResult } from '../src/utils/searchPublicationSync';
import { runScheduledVerification, SEARCH_VERIFY_LIMITS, SEARCH_VERIFY_TIMEOUT_SECONDS } from '../src/utils/searchVerifySchedule';
import type { TriggerLogger } from '../src/utils/searchSyncTrigger';

const createLog = () => {
  const lines: Array<{ level: string; message: string; fields: Record<string, unknown> }> = [];
  const log: TriggerLogger = {
    info: (message, fields) => { lines.push({ level: 'info', message, fields }); },
    error: (message, fields) => { lines.push({ level: 'error', message, fields }); },
  };
  return { log, lines };
};

const deps = { now: () => 5_000_000 } as unknown as SyncDeps;

describe('scheduled verification run', () => {
  test('runs the batch with its own owner and the run limits, logs a summary without text', async () => {
    const calls: Array<{ owner: string; limits: VerifyBatchLimits }> = [];
    const { log, lines } = createLog();
    const batch: VerifyBatchResult = {
      due: 4,
      deferred: 1,
      results: [
        { publicationId: 'articles/a1', status: 'verified' },
        { publicationId: 'interviews/i1', status: 'repaired', outcome: { publicationId: 'interviews/i1', version: 'v2', rounds: 1, records: 1, permanentError: null } },
        { publicationId: 'news/n1', status: 'failed', error: 'PublicationBusyError: news/n1 is being synced by another handler' },
      ],
    };
    const result = await runScheduledVerification({
      getDeps: () => deps, log, newId: () => 'u1',
      verifyBatch: async (_deps, owner, limits) => { calls.push({ owner, limits: limits ?? {} }); return batch; },
    });
    expect(result).toBe(batch);
    expect(calls).toEqual([{
      owner: 'schedule:u1',
      limits: { maxPublications: SEARCH_VERIFY_LIMITS.maxPublications, deadlineMs: 5_000_000 + SEARCH_VERIFY_LIMITS.runBudgetMs },
    }]);
    expect(lines).toEqual([{
      level: 'info', message: 'search verification run',
      fields: {
        owner: 'schedule:u1', due: 4, verified: 1, repaired: 1, failed: 1, deferred: 1,
        repairedPublications: ['interviews/i1'],
        failedPublications: [{ publicationId: 'news/n1', error: 'PublicationBusyError: news/n1 is being synced by another handler' }],
      },
    }]);
  });

  test('a per-publication failure does not fail the run', async () => {
    const { log } = createLog();
    await expect(runScheduledVerification({
      getDeps: () => deps, log,
      verifyBatch: async () => ({ due: 1, deferred: 0, results: [{ publicationId: 'articles/a1', status: 'failed', error: 'X' }] }),
    })).resolves.toMatchObject({ due: 1 });
  });

  test('a failure of the run itself is logged and rethrown', async () => {
    const { log, lines } = createLog();
    await expect(runScheduledVerification({
      getDeps: () => deps, log, newId: () => 'u2',
      verifyBatch: async () => { throw new Error('ledger query failed'); },
    })).rejects.toThrow('ledger query failed');
    expect(lines).toEqual([{
      level: 'error', message: 'search verification run failed', fields: { owner: 'schedule:u2', error: 'Error: ledger query failed' },
    }]);
  });

  test('limits leave room for one late publication inside the function timeout', () => {
    // Last start + its handler budget must end before the function is killed.
    expect(SEARCH_VERIFY_LIMITS.runBudgetMs + SYNC_DEFAULTS.handlerTimeoutMs)
      .toBeLessThan(SEARCH_VERIFY_TIMEOUT_SECONDS * 1000);
  });
});
