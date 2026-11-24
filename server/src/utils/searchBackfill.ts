import { SEARCH_SOURCES } from './searchCorpus';
import { recordBytes, toPublicationId, type SearchRecordAuthor } from './searchRecords';
import { buildPublicationRecords, type PublicationSource, type SyncOutcome } from './searchPublicationSync';

/**
 * Backfill dry run: reads every search collection page by page in document
 * id order and builds, in memory, the records the index should hold. It is
 * read-only by construction: it gets a page reader and an author reader,
 * no ledger and no index, so it can't take a lease or send a batch.
 */

export interface BackfillDocument {
  id: string;
  data: Record<string, unknown>;
  // toSourceVersion(updateTime) from the same query snapshot.
  version: string;
}

export interface BackfillPageReader {
  /** Up to `limit` documents ordered by id, strictly after `afterId` (null: from the start). */
  readPage(collection: string, afterId: string | null, limit: number): Promise<BackfillDocument[]>;
}

export interface BackfillAuthorReader {
  readAuthor(authorId: string): Promise<SearchRecordAuthor | null>;
}

export interface BackfillIssue {
  publicationId: string;
  message: string;
}

export interface BackfillCollectionStats {
  collection: string;
  pages: number;
  documentsRead: number;
  // Publications with at least one record.
  indexable: number;
  restricted: number;
  records: number;
  maxRecordBytes: number;
  warnings: BackfillIssue[];
  errors: BackfillIssue[];
}

export interface BackfillReport {
  collections: BackfillCollectionStats[];
  totals: Omit<BackfillCollectionStats, 'collection' | 'warnings' | 'errors'> & { warnings: number; errors: number };
  authorReads: number;
}

export const BACKFILL_PAGE_SIZE = 100;

/** Each author is read at most once per run, also under concurrent requests. */
export const createCachedAuthorReader = (reader: BackfillAuthorReader) => {
  const cache = new Map<string, Promise<SearchRecordAuthor | null>>();
  let reads = 0;
  return {
    readAuthor(authorId: string): Promise<SearchRecordAuthor | null> {
      let pending = cache.get(authorId);
      if (!pending) {
        reads += 1;
        pending = reader.readAuthor(authorId);
        cache.set(authorId, pending);
      }
      return pending;
    },
    reads: () => reads,
  };
};

const errorText = (error: unknown): string =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

/** Pages of one collection in id order; each starts strictly after the previous page's last id. */
async function* iteratePages(
  pages: BackfillPageReader, collection: string, pageSize: number,
): AsyncGenerator<BackfillDocument[]> {
  let afterId: string | null = null;
  for (;;) {
    const page = await pages.readPage(collection, afterId, pageSize);
    if (page.length === 0) return;
    yield page;
    if (page.length < pageSize) return;
    // The page is non-empty here.
    afterId = page.at(-1)!.id;
  }
}

const scanCollection = async (
  collection: string,
  pages: BackfillPageReader,
  source: PublicationSource,
  pageSize: number,
): Promise<BackfillCollectionStats> => {
  const stats: BackfillCollectionStats = {
    collection, pages: 0, documentsRead: 0, indexable: 0, restricted: 0, records: 0, maxRecordBytes: 0, warnings: [], errors: [],
  };
  for await (const page of iteratePages(pages, collection, pageSize)) {
    stats.pages += 1;
    for (const doc of page) {
      stats.documentsRead += 1;
      const publicationId = toPublicationId(collection, doc.id);
      try {
        // The same record building as search:sync, from the data already read.
        const built = await buildPublicationRecords(source, collection, doc.id, { exists: true, data: doc.data, version: doc.version });
        built.warnings.forEach((message) => stats.warnings.push({ publicationId, message }));
        if (built.permanentError) stats.errors.push({ publicationId, message: built.permanentError });
        if (built.records.length > 0) {
          stats.indexable += 1;
          if (built.records[0].access === 'restricted') stats.restricted += 1;
          stats.records += built.records.length;
          stats.maxRecordBytes = Math.max(stats.maxRecordBytes, ...built.records.map(recordBytes));
        }
      } catch (error) {
        stats.errors.push({ publicationId, message: errorText(error) });
      }
    }
  }
  return stats;
};

export const dryRunBackfill = async ({ pages, authors, pageSize = BACKFILL_PAGE_SIZE, collections }: {
  pages: BackfillPageReader;
  authors: BackfillAuthorReader;
  pageSize?: number;
  collections?: string[];
}): Promise<BackfillReport> => {
  const cachedAuthors = createCachedAuthorReader(authors);
  // buildPublicationRecords only ever reads authors; the document is already in hand.
  const source: PublicationSource = {
    readDocument: () => Promise.reject(new Error('the backfill never re-reads a document')),
    readAuthor: (authorId) => cachedAuthors.readAuthor(authorId),
  };
  const targets = collections ?? SEARCH_SOURCES.map((s) => s.collection);
  const results: BackfillCollectionStats[] = [];
  // Sequential: one collection at a time keeps Firestore reads gentle.
  for (const collection of targets) results.push(await scanCollection(collection, pages, source, pageSize));

  const sum = (key: 'pages' | 'documentsRead' | 'indexable' | 'restricted' | 'records') =>
    results.reduce((total, stats) => total + stats[key], 0);
  return {
    collections: results,
    totals: {
      pages: sum('pages'),
      documentsRead: sum('documentsRead'),
      indexable: sum('indexable'),
      restricted: sum('restricted'),
      records: sum('records'),
      maxRecordBytes: Math.max(0, ...results.map((stats) => stats.maxRecordBytes)),
      warnings: results.reduce((total, stats) => total + stats.warnings.length, 0),
      errors: results.reduce((total, stats) => total + stats.errors.length, 0),
    },
    authorReads: cachedAuthors.reads(),
  };
};

// --- Apply ---------------------------------------------------------------

/** The only target the first import may write to. */
export const FIRST_IMPORT_TARGET = {
  projectId: 'maag-60419',
  appId: 'IS5SOWASMH',
  indexName: 'maag_materials_dev',
} as const;

export interface ImportTarget {
  projectId: string;
  appId: string;
  indexName: string;
}

/** Throws, naming every mismatch, unless the target is exactly FIRST_IMPORT_TARGET. */
export const assertFirstImportTarget = (target: ImportTarget): void => {
  const mismatches = (Object.keys(FIRST_IMPORT_TARGET) as Array<keyof ImportTarget>)
    .filter((key) => target[key] !== FIRST_IMPORT_TARGET[key])
    .map((key) => `${key} is "${target[key]}", expected "${FIRST_IMPORT_TARGET[key]}"`);
  if (mismatches.length > 0) throw new Error(`--apply refused: ${mismatches.join('; ')}`);
};

export interface BackfillFailure {
  publicationId: string;
  error: string;
}

export interface ApplyCollectionStats {
  collection: string;
  pages: number;
  // Every document id found, drafts included.
  listed: number;
  synced: number;
  // Publications that now have records in the index.
  withRecords: number;
  records: number;
  // Not indexable (e.g. too large): removed, reason kept in the ledger.
  notIndexable: BackfillIssue[];
  failures: BackfillFailure[];
}

export interface ApplyReport {
  collections: ApplyCollectionStats[];
  totals: { pages: number; listed: number; synced: number; withRecords: number; records: number; notIndexable: number; failures: number };
}

/** One publication through the lease-guarded sync; see syncPublicationFromSource. */
export type SyncOne = (collection: string, id: string) => Promise<SyncOutcome>;

/**
 * Lists every document id page by page and hands each one, drafts included,
 * to `syncOne`. The page data is not used: the sync re-reads the current
 * version under its lease, so an edit made after the page was read wins.
 * A failure is recorded and the run goes on.
 */
export const applyBackfill = async ({ pages, syncOne, pageSize = BACKFILL_PAGE_SIZE, collections }: {
  pages: BackfillPageReader;
  syncOne: SyncOne;
  pageSize?: number;
  collections?: string[];
}): Promise<ApplyReport> => {
  const targets = collections ?? SEARCH_SOURCES.map((s) => s.collection);
  const results: ApplyCollectionStats[] = [];
  for (const collection of targets) {
    const stats: ApplyCollectionStats = {
      collection, pages: 0, listed: 0, synced: 0, withRecords: 0, records: 0, notIndexable: [], failures: [],
    };
    for await (const page of iteratePages(pages, collection, pageSize)) {
      stats.pages += 1;
      for (const { id } of page) {
        stats.listed += 1;
        const publicationId = toPublicationId(collection, id);
        try {
          // Sequential on purpose: one publication at a time against Algolia and the ledger.
          const outcome = await syncOne(collection, id);
          stats.synced += 1;
          stats.records += outcome.records;
          if (outcome.records > 0) stats.withRecords += 1;
          if (outcome.permanentError) stats.notIndexable.push({ publicationId, message: outcome.permanentError });
        } catch (error) {
          stats.failures.push({ publicationId, error: errorText(error) });
        }
      }
    }
    results.push(stats);
  }
  const sum = (pick: (stats: ApplyCollectionStats) => number) => results.reduce((total, stats) => total + pick(stats), 0);
  return {
    collections: results,
    totals: {
      pages: sum((s) => s.pages),
      listed: sum((s) => s.listed),
      synced: sum((s) => s.synced),
      withRecords: sum((s) => s.withRecords),
      records: sum((s) => s.records),
      notIndexable: sum((s) => s.notIndexable.length),
      failures: sum((s) => s.failures.length),
    },
  };
};

/** The existing command that retries one publication. */
export const retryCommandFor = (publicationId: string): string =>
  `npm run search:sync -- --publication ${publicationId} --apply`;
