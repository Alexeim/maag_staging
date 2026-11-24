import { planPublicationSync, type SearchIndexAdapter } from './searchIndexSync';
import {
  buildPublicationRecords, parsePublicationId, syncPublicationFromSource,
  type PublicationSource, type SyncDeps, type SyncLedger, type SyncOutcome,
} from './searchPublicationSync';

export type PlannedAction = 'create' | 'update' | 'delete';

export interface PlanRow {
  objectID: string;
  inIndex: boolean;
  // sourceVersion the index holds; null if the record is there without one.
  indexVersion: string | null;
  // Version the record will carry after the sync; null for a delete.
  expectedVersion: string | null;
  action: PlannedAction;
}

export interface DryRunReport {
  mode: 'dry-run';
  publicationId: string;
  document: { exists: boolean; version: string; title: string | null; published: unknown; paid: unknown };
  warnings: string[];
  permanentError: string | null;
  // Non-null when the index settings differ: the publicationId filter may then miss records.
  settingsProblem: string | null;
  rows: PlanRow[];
}

export interface ApplyReport {
  mode: 'apply';
  publicationId: string;
  outcome: SyncOutcome;
}

// The dry run only ever gets read operations: no ledger, no writes to the index.
export type ReadOnlyIndex = Pick<SearchIndexAdapter, 'assertSettings' | 'listPublicationRecords'>;

/**
 * Read-only plan for one publication: one document read (plus its author for
 * firstPerson), records built in memory, the index's actual records for this
 * publicationId, and the action the sync would take on each objectID.
 */
export const dryRunPublicationSync = async (
  { publicationId, source, index }: { publicationId: string; source: PublicationSource; index: ReadOnlyIndex },
): Promise<DryRunReport> => {
  const { collection, id } = parsePublicationId(publicationId);
  const doc = await source.readDocument(collection, id);
  const { records, warnings, permanentError } = await buildPublicationRecords(source, collection, id, doc);

  let settingsProblem: string | null = null;
  try {
    await index.assertSettings();
  } catch (error) {
    settingsProblem = error instanceof Error ? error.message : String(error);
  }

  const indexed = await index.listPublicationRecords(publicationId);
  const indexVersionById = new Map(indexed.map((record) => [record.objectID, record.sourceVersion]));
  // The same planner the real sync uses, so the plan can't drift from --apply.
  const plan = planPublicationSync(publicationId, indexed.map((record) => record.objectID), records);
  const rows: PlanRow[] = [
    ...plan.upsertObjectIDs.map((objectID): PlanRow => ({
      objectID,
      inIndex: indexVersionById.has(objectID),
      indexVersion: indexVersionById.get(objectID) ?? null,
      expectedVersion: doc.version,
      action: indexVersionById.has(objectID) ? 'update' : 'create',
    })),
    ...plan.deleteObjectIDs.map((objectID): PlanRow => ({
      objectID, inIndex: true, indexVersion: indexVersionById.get(objectID) ?? null, expectedVersion: null, action: 'delete',
    })),
  ];

  const data = doc.data ?? {};
  return {
    mode: 'dry-run',
    publicationId,
    document: {
      exists: doc.exists,
      version: doc.version,
      title: typeof data.title === 'string' ? data.title : null,
      published: data.published,
      paid: data.paid,
    },
    warnings,
    permanentError,
    settingsProblem,
    rows,
  };
};

/**
 * `search:sync`. Dry run by default and read-only. With `apply`, refuses to
 * run on drifted index settings, then runs the normal lease-guarded sync.
 */
export const runSearchSyncCommand = async (args: {
  publicationId: string;
  apply: boolean;
  source: PublicationSource;
  index: ReadOnlyIndex & Pick<SearchIndexAdapter, 'syncPublication'>;
  ledger: SyncLedger;
  now: () => number;
  owner: string;
}): Promise<DryRunReport | ApplyReport> => {
  if (!args.apply) {
    // Only the read-only parts are handed over: no ledger, no syncPublication.
    return dryRunPublicationSync({ publicationId: args.publicationId, source: args.source, index: args.index });
  }
  await args.index.assertSettings();
  const { collection, id } = parsePublicationId(args.publicationId);
  const deps: SyncDeps = { source: args.source, ledger: args.ledger, index: args.index, now: args.now };
  const outcome = await syncPublicationFromSource(deps, { collection, id, owner: args.owner });
  return { mode: 'apply', publicationId: args.publicationId, outcome };
};
