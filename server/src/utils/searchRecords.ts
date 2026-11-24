import { extractSearchDocument, SEARCH_SOURCES, type SearchSource } from './searchCorpus';

// Algolia Free ("Build") plan: 10 KB per record. The docs do not say whether
// KB is 1000 or 1024 bytes, so the stricter 10 000 bytes is used.
export const ALGOLIA_FREE_PLAN_MAX_RECORD_BYTES = 10_000;

export type SearchAccess = 'open' | 'restricted';

/**
 * One Algolia record. A publication becomes one or more records ("chunks")
 * that share `publicationId`. Restricted records never carry `introduction`
 * or `content`.
 */
export interface SearchRecord {
  objectID: string;
  publicationId: string;
  collection: string;
  sourceId: string;
  type: string;
  href: string;
  title: string;
  tags: string[];
  access: SearchAccess;
  interviewee?: string;
  introduction?: string;
  content?: string;
  chunkIndex: number;
  chunkCount: number;
}

export interface SearchRecordsResult {
  // Always set, also for drafts and deleted documents, so a caller can remove
  // every record of the publication.
  publicationId: string;
  records: SearchRecord[];
  warnings: string[];
}

export interface BuildSearchRecordsInput {
  collection: string;
  // Firestore snapshot id (`snapshot.id`); stored documents have no `id` field.
  id: string;
  // `snapshot.data()`; undefined for a deleted document.
  data: unknown;
  maxRecordBytes?: number;
}

export class SearchRecordTooLargeError extends Error {
  constructor(publicationId: string, bytes: number, limit: number) {
    super(`${publicationId}: record metadata alone takes ${bytes} bytes, limit is ${limit}`);
    this.name = 'SearchRecordTooLargeError';
  }
}

const SOURCE_BY_COLLECTION = new Map<string, SearchSource>(
  SEARCH_SOURCES.map((source) => [source.collection, source]),
);

// Collections whose controllers store `paid: Boolean(paid)` and whose pages
// wrap the body in MaterialRegistrationGate. Older documents may lack the
// field; the site shows them in full, so a missing field means open.
const GATED_COLLECTIONS = new Set(['articles', 'guides', 'interviews', 'flippers', 'visual-stories']);

/**
 * Access contract: `true` closes the text, `false` or a missing field leaves
 * it open. Anything else (a string, a number, null, or any value in a
 * collection without a gate) is treated as closed and reported. The site's
 * gate tests truthiness, so e.g. "true" would also close the page there.
 */
const resolveAccess = (collection: string, value: unknown, warnings: string[]): SearchAccess => {
  if (value === undefined || value === false) return 'open';
  if (value === true && GATED_COLLECTIONS.has(collection)) return 'restricted';
  // Firestore values are JSON-serializable; trimmed so logs never carry text.
  const shown = String(JSON.stringify(value)).slice(0, 40);
  const reason = GATED_COLLECTIONS.has(collection) ? 'unexpected paid value' : 'paid set on a collection without a gate';
  warnings.push(`${reason} ${shown}; gated text excluded`);
  return 'restricted';
};

export const toPublicationId = (collection: string, id: string): string => `${collection}/${id}`;

export const recordBytes = (record: SearchRecord): number =>
  Buffer.byteLength(JSON.stringify(record), 'utf8');

// Bytes a string adds inside a JSON document, escaping included, quotes excluded.
const jsonTextBytes = (text: string): number => Buffer.byteLength(JSON.stringify(text), 'utf8') - 2;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const plain = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

/**
 * Packs `units` joined by `separator` into pieces whose JSON-escaped size is
 * at most `budget` bytes. A unit larger than the budget is split by `split`.
 */
const pack = (
  units: string[],
  separator: string,
  budget: number,
  split: (unit: string) => string[],
): string[] => {
  const pieces: string[] = [];
  let current = '';
  for (const unit of units) {
    if (jsonTextBytes(unit) > budget) {
      if (current) pieces.push(current);
      current = '';
      pieces.push(...split(unit));
      continue;
    }
    const candidate = current ? `${current}${separator}${unit}` : unit;
    if (jsonTextBytes(candidate) <= budget) {
      current = candidate;
    } else {
      pieces.push(current);
      current = unit;
    }
  }
  if (current) pieces.push(current);
  return pieces;
};

// Last resort for a "word" longer than a whole chunk (e.g. a pasted URL):
// split by code points so a multi-byte character is never cut in half.
const splitByCharacters = (text: string, budget: number): string[] =>
  pack(Array.from(text), '', budget, () => {
    throw new Error('A single character exceeds the chunk budget');
  });

const splitByWords = (text: string, budget: number): string[] =>
  pack(text.split(' ').filter(Boolean), ' ', budget, (word) => splitByCharacters(word, budget));

// Paragraph boundaries first, then words, then characters.
const splitText = (text: string, budget: number): string[] =>
  pack(text.split('\n').filter(Boolean), '\n', budget, (paragraph) => splitByWords(paragraph, budget));

// Room left for `content` once the rest of a chunk is serialized. Chunk index
// and count are measured at their widest so the budget never shrinks later.
const contentBudget = (skeleton: SearchRecord, limit: number): number => {
  const widest: SearchRecord = {
    ...skeleton,
    objectID: `${skeleton.publicationId}#9999`,
    content: '',
    chunkIndex: 9999,
    chunkCount: 9999,
  };
  const bytes = recordBytes(widest);
  if (bytes >= limit) throw new SearchRecordTooLargeError(skeleton.publicationId, bytes, limit);
  return limit - bytes;
};

export const buildSearchRecords = ({
  collection,
  id,
  data,
  maxRecordBytes = ALGOLIA_FREE_PLAN_MAX_RECORD_BYTES,
}: BuildSearchRecordsInput): SearchRecordsResult => {
  const source = SOURCE_BY_COLLECTION.get(collection);
  if (!source) throw new Error(`Collection "${collection}" is not a search source`);
  const publicationId = toPublicationId(collection, id);
  const document = asRecord(data);
  if (!document) return { publicationId, records: [], warnings: [] };

  // The snapshot id wins over any stored `id` field.
  const { document: extracted, warnings } = extractSearchDocument(source, { ...document, id });
  if (!extracted) return { publicationId, records: [], warnings };

  const access = resolveAccess(collection, document.paid, warnings);
  const interviewee = collection === 'interviews' ? plain(document.interviewee) : '';
  // Explicit whitelist: nothing else from the stored document reaches a record.
  const base: SearchRecord = {
    objectID: '',
    publicationId,
    collection,
    sourceId: id,
    type: extracted.type,
    href: extracted.href,
    title: extracted.title,
    tags: extracted.tags,
    access,
    ...(interviewee ? { interviewee } : {}),
    chunkIndex: 0,
    chunkCount: 1,
  };

  let records: SearchRecord[];
  if (access === 'restricted') {
    contentBudget(base, maxRecordBytes);
    records = [{ ...base, objectID: `${publicationId}#0` }];
  } else {
    const introduction = extracted.introduction;
    const first: SearchRecord = introduction ? { ...base, introduction } : base;
    const firstBudget = contentBudget(first, maxRecordBytes);
    const restBudget = contentBudget(base, maxRecordBytes);
    // One budget for every chunk: the smaller one, since chunk 0 also
    // carries the introduction. Wastes a little room, keeps the split simple.
    const pieces = splitText(extracted.body, Math.min(firstBudget, restBudget));
    const contents = pieces.length > 0 ? pieces : [''];
    records = contents.map((content, index) => ({
      ...(index === 0 ? first : base),
      objectID: `${publicationId}#${index}`,
      content,
      chunkIndex: index,
      chunkCount: contents.length,
    }));
  }

  for (const record of records) {
    const bytes = recordBytes(record);
    if (bytes > maxRecordBytes) throw new SearchRecordTooLargeError(record.objectID, bytes, maxRecordBytes);
  }
  return { publicationId, records, warnings };
};
