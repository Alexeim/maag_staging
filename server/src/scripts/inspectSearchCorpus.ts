import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import {
  extractSearchDocument, inspectSearchMatch, SEARCH_SOURCES,
  type SearchDocument, type SearchSource,
} from '../utils/searchCorpus';
import { buildSearchRecords, recordBytes } from '../utils/searchRecords';

type Issue = { source: string; id: string | null; message: string };
interface RecordStats {
  indexed: number; restricted: number; records: number; maxRecordBytes: number; recordErrors: number;
}

// Same call the sync handler will make: the API's `id` plays snapshot.id and
// is removed from the data, as a stored Firestore document has no such field.
// Extraction warnings are already reported by the caller, so only new ones
// (access contract) are added here.
const collectRecordStats = (
  source: SearchSource, item: unknown, extractionWarnings: string[],
  stats: RecordStats, warnings: Issue[], recordErrors: Issue[],
): void => {
  const { id: rawId, ...stored } = (item ?? {}) as Record<string, unknown>;
  const id = typeof rawId === 'string' && rawId ? rawId : null;
  try {
    if (!id) throw new Error('API item without a string id');
    const built = buildSearchRecords({ collection: source.collection, id, data: stored });
    built.warnings.filter((message) => !extractionWarnings.includes(message))
      .forEach((message) => warnings.push({ source: source.endpoint, id, message }));
    if (built.records.length > 0) stats.indexed += 1;
    if (built.records[0]?.access === 'restricted') stats.restricted += 1;
    stats.records += built.records.length;
    stats.maxRecordBytes = Math.max(stats.maxRecordBytes, ...built.records.map(recordBytes));
  } catch (error) {
    recordErrors.push({ source: source.endpoint, id, message: error instanceof Error ? error.message : String(error) });
    stats.recordErrors += 1;
  }
};

// Reads editorial API snapshots, but never initializes Firebase or writes to it.
const run = async (): Promise<void> => {
  const { values } = parseArgs({
    options: {
      'input-dir': { type: 'string' },
      'api-base-url': { type: 'string' },
      output: { type: 'string' },
      query: { type: 'string', multiple: true },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log('Usage: npm run search:inspect -- (--input-dir DIR | --api-base-url URL) --output FILE [--query TEXT ...]');
    console.log('Input files: articles.json, news.json, events.json, guides.json, interviews.json,');
    console.log('flippers.json, first-person.json, visual-stories.json, photos-of-the-day.json.');
    console.log('API base example: http://localhost:3000 (without /api). GET requests only.');
    return;
  }
  if (Boolean(values['input-dir']) === Boolean(values['api-base-url']) || !values.output) {
    throw new Error('Specify exactly one of --input-dir / --api-base-url, and --output. Use --help for usage.');
  }
  const inputDir = values['input-dir'] ? resolve(values['input-dir']) : null;
  const apiBase = values['api-base-url'] ? new URL(values['api-base-url']) : null;
  if (apiBase && (!['http:', 'https:'].includes(apiBase.protocol) || apiBase.username || apiBase.password || apiBase.search || apiBase.hash || apiBase.pathname !== '/')) {
    throw new Error('--api-base-url must be an HTTP(S) origin without credentials, path or query.');
  }
  const documents: SearchDocument[] = [];
  const warnings: Array<{ source: string; id: string | null; message: string }> = [];
  const recordErrors: Issue[] = [];
  const sources: Array<{
    endpoint: string; capturedAt: string; received: number; published: number;
    extracted: number; textBytes: number;
  } & RecordStats> = [];
  const ids = new Set<string>();
  const textBytes = (document: SearchDocument): number => Buffer.byteLength([
    document.title, document.introduction, document.body, document.tags.join(' '),
  ].join('\n'), 'utf8');

  const load = async (source: SearchSource): Promise<{ data: unknown; capturedAt: string }> => {
    if (inputDir) {
      const file = resolve(inputDir, `${source.endpoint}.json`);
      const [json, details] = await Promise.all([readFile(file, 'utf8'), stat(file)]);
      return { data: JSON.parse(json) as unknown, capturedAt: details.mtime.toISOString() };
    }
    const response = await fetch(new URL(`/api/${source.endpoint}`, apiBase!), {
      method: 'GET', redirect: 'error', signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`${source.endpoint}: HTTP ${response.status}`);
    return { data: await response.json() as unknown, capturedAt: new Date().toISOString() };
  };

  // Sequential reads keep this manual inspection gentle on the existing API.
  for (const source of SEARCH_SOURCES) {
    const { data, capturedAt } = await load(source);
    if (!Array.isArray(data)) throw new Error(`${source.endpoint}: expected a JSON array`);
    let published = 0;
    const extracted: SearchDocument[] = [];
    const recordStats: RecordStats = { indexed: 0, restricted: 0, records: 0, maxRecordBytes: 0, recordErrors: 0 };
    for (const item of data as unknown[]) {
      if (item && typeof item === 'object' && 'published' in item && item.published === true) published += 1;
      const result = extractSearchDocument(source, item);
      for (const message of result.warnings) {
        warnings.push({ source: source.endpoint, id: result.document?.sourceId ?? null, message });
      }
      collectRecordStats(source, item, result.warnings, recordStats, warnings, recordErrors);
      if (!result.document) continue;
      if (ids.has(result.document.id)) throw new Error(`Duplicate material: ${result.document.id}`);
      ids.add(result.document.id);
      extracted.push(result.document);
    }
    documents.push(...extracted);
    sources.push({
      endpoint: source.endpoint, capturedAt, received: data.length, published,
      extracted: extracted.length, textBytes: extracted.reduce((sum, doc) => sum + textBytes(doc), 0),
      ...recordStats,
    });
  }
  documents.sort((left, right) => left.id.localeCompare(right.id));
  const totalBytes = documents.reduce((sum, doc) => sum + textBytes(doc), 0);
  const queries = (values.query ?? []).map((query) => {
    const matches = documents.flatMap((document) => {
      const fields = inspectSearchMatch(document, query);
      return fields.length ? [{ id: document.id, title: document.title, href: document.href, fields }] : [];
    });
    return { query, total: matches.length, examples: matches.slice(0, 5) };
  });
  const corpus = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: inputDir ? { mode: 'local-snapshots', path: inputDir } : { mode: 'editorial-api', origin: apiBase!.origin },
    scope: 'Published materials from nine editorial lists; French collections and author-profile lookups are not included. API lists can omit documents without their orderBy field.',
    purpose: 'Local inspection only, including paid-marked materials. Not a public endpoint or production search index.',
    sources,
    summary: {
      documents: documents.length, textBytes: totalBytes, warnings: warnings.length,
      records: sources.reduce((sum, source) => sum + source.records, 0),
      maxRecordBytes: Math.max(0, ...sources.map((source) => source.maxRecordBytes)),
      recordErrors: recordErrors.length,
    },
    warnings,
    recordErrors,
    queries,
    documents,
  };
  const output = resolve(values.output);
  if (inputDir && SEARCH_SOURCES.some((source) => output === resolve(inputDir, `${source.endpoint}.json`))) {
    throw new Error('--output must not overwrite an input snapshot');
  }
  await mkdir(dirname(output), { recursive: true });
  const temporary = `${output}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(corpus, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  await rename(temporary, output);
  console.table(sources.map(({ capturedAt: _capturedAt, ...source }) => source));
  console.log(JSON.stringify({ output, summary: corpus.summary, warnings, recordErrors, queries }, null, 2));
  // The file is still written so the errors can be inspected, but the run fails.
  if (recordErrors.length > 0) process.exitCode = 1;
};

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
