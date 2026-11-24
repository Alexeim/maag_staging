import { SEARCH_SOURCES } from './searchCorpus';
import { recordBytes, toPublicationId, type SearchRecordAuthor } from './searchRecords';
import { buildPublicationRecords, type PublicationSource } from './searchPublicationSync';

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

const scanCollection = async (
  collection: string,
  pages: BackfillPageReader,
  source: PublicationSource,
  pageSize: number,
): Promise<BackfillCollectionStats> => {
  const stats: BackfillCollectionStats = {
    collection, pages: 0, documentsRead: 0, indexable: 0, restricted: 0, records: 0, maxRecordBytes: 0, warnings: [], errors: [],
  };
  let afterId: string | null = null;
  // Each page starts strictly after the last id of the previous one.
  for (;;) {
    const page = await pages.readPage(collection, afterId, pageSize);
    if (page.length === 0) break;
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
        stats.errors.push({ publicationId, message: error instanceof Error ? `${error.name}: ${error.message}` : String(error) });
      }
    }
    if (page.length < pageSize) break;
    afterId = page[page.length - 1].id;
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
