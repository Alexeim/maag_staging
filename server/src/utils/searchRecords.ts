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
  // Only for type 'first-person': author name + stored title tail.
  displayTitle?: string;
  // The public card cover; also set on restricted records.
  imageUrl?: string;
  tags: string[];
  access: SearchAccess;
  interviewee?: string;
  introduction?: string;
  content?: string;
  // Version of the Firestore document the record was built from; lets a
  // later check spot records written from an older version (a late write).
  sourceVersion?: string;
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
  // `authors/{data.authorId}`, read by the caller (sync handler, backfill);
  // this function never does I/O. Used by firstPerson only.
  author?: SearchRecordAuthor | null;
  // Document version (see searchPublicationSync.ts), copied into every chunk.
  sourceVersion?: string;
  maxRecordBytes?: number;
}

export interface SearchRecordAuthor {
  firstName?: unknown;
  lastName?: unknown;
  noBgAvatar?: unknown;
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

const nonEmpty = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

// Same join as attachAuthorNames() in the public controllers.
export const authorDisplayName = (author: SearchRecordAuthor | null | undefined): string =>
  [nonEmpty(author?.firstName), nonEmpty(author?.lastName)].filter(Boolean).join(' ');

// Mirrors composeFirstPersonTitle in src/lib/utils/firstPerson.ts (the server
// can't import the frontend `@/` alias): name + single space + tail.
export const composeFirstPersonTitle = (authorName: string, title: string): string => {
  const name = authorName.trim();
  const text = title.trim();
  if (!name) return text;
  if (!text) return name;
  return `${name} ${text}`;
};

/**
 * The card cover, by the rules of publicMaterialsController (getImageUrl and
 * the firstPerson portrait fallback in attachAuthorNames), which feed the
 * MaterialResultRow listings. Empty strings count as no image.
 */
export const cardImageUrl = (
  collection: string,
  data: Record<string, unknown>,
  author: SearchRecordAuthor | null | undefined,
): string | null => {
  const firstOf = (list: unknown): string | null =>
    Array.isArray(list) ? nonEmpty(asRecord(list[0])?.imageUrl) : null;
  const own = nonEmpty(data.imageUrl);
  if (collection === 'flippers') return firstOf(data.carouselContent) ?? own;
  if (collection === 'visual-stories') return own ?? firstOf(data.slides);
  // firstPerson documents saved before the main image became required.
  if (collection === 'firstPerson') return own ?? nonEmpty(author?.noBgAvatar);
  return own;
};

/**
 * Display-only card fields. "first-person" stores only the headline's tail,
 * so its displayTitle prepends the author's name; "opinion" keeps `title`
 * and gets no displayTitle. Without a name the tail is shown, as on the site.
 */
const cardFields = (
  collection: string,
  data: Record<string, unknown>,
  extracted: { type: string; title: string },
  author: SearchRecordAuthor | null | undefined,
  warnings: string[],
): Pick<SearchRecord, 'displayTitle' | 'imageUrl'> => {
  const fields: Pick<SearchRecord, 'displayTitle' | 'imageUrl'> = {};
  if (extracted.type === 'first-person') {
    const authorName = authorDisplayName(author);
    if (!authorName) warnings.push('author name missing; displayTitle is the stored title tail');
    fields.displayTitle = composeFirstPersonTitle(authorName, extracted.title);
  }
  const imageUrl = cardImageUrl(collection, data, author);
  if (imageUrl) fields.imageUrl = imageUrl;
  return fields;
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
  author,
  sourceVersion,
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
    ...cardFields(collection, document, extracted, author, warnings),
    tags: extracted.tags,
    access,
    ...(interviewee ? { interviewee } : {}),
    ...(sourceVersion ? { sourceVersion } : {}),
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
