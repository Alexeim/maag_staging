import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/pages/sitemap-content.xml.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const apiNames = ['articlesApi', 'newsApi', 'guidesApi', 'eventsApi', 'interviewsApi', 'flippersApi', 'visualStoriesApi', 'photosOfTheDayApi', 'authorsApi'];
function endpoint(overrides = {}) {
  const api = Object.fromEntries(apiNames.map(name => [name, { list: async () => [] }]));
  Object.assign(api, overrides);
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: () => api, Response, URL, console: { error() {} } });
  return exports.GET({ site: new URL('https://maagfrance.fr') });
}

test('published materials, existing authors, encoded tags, deduplication and dates', async () => {
  const item = { id: 'live', published: true, authorId: 'writer', tags: ['art & culture', 'art & culture'], updatedAt: { seconds: 1700000000 } };
  const response = await endpoint({
    articlesApi: { list: async () => [item, item, { ...item, id: 'draft', published: false }, { id: 'legacy' }, { ...item, id: 'tip', articleType: 'tips', updatedAt: { seconds: Infinity } }] },
    authorsApi: { list: async () => [{ id: 'writer' }, { id: 'unused' }] },
    photosOfTheDayApi: { list: async () => [{ id: 'photo', published: true, authorId: 'photo-only', tags: ['photo-only'] }] },
  });
  const xml = await response.text();
  assert.equal(response.status, 200);
  assert.equal((xml.match(/<loc>https:\/\/maagfrance.fr\/article\/live<\/loc>/g) || []).length, 1);
  assert.match(xml, /\/tips\/tip/);
  assert.match(xml, /\/author\/writer/);
  assert.match(xml, /\/tag\/art%20%26%20culture/);
  assert.match(xml, /<lastmod>2023-11-14<\/lastmod>/);
  assert.match(xml, /\/photo-of-the-day\/photo/);
  assert.doesNotMatch(xml, /draft|legacy|unused|photo-only/);
});

test('any failed source returns an uncached 503 instead of a partial sitemap', async () => {
  for (const name of apiNames) {
    const response = await endpoint({ [name]: { list: async () => { throw new Error('offline'); } } });
    assert.equal(response.status, 503, name);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('retry-after'), '300');
    assert.doesNotMatch(await response.text(), /<urlset/);
  }
});

test('built sitemap index includes both maps and excludes private/deleted pages', () => {
  const index = readFileSync(new URL('../dist/client/sitemap-index.xml', import.meta.url), 'utf8');
  const pages = readFileSync(new URL('../dist/client/sitemap-0.xml', import.meta.url), 'utf8');
  assert.match(index, /https:\/\/maagfrance.fr\/sitemap-content.xml/);
  assert.match(index, /https:\/\/maagfrance.fr\/sitemap-0.xml/);
  assert.doesNotMatch(pages, /\/(building|dashboard|profile|success|cancel|article-variant)(\/|<)/);
});

test('static sitemap cache policy covers compressed variants without changing asset caching', () => {
  const source = readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
  const hook = source.match(/setHeaders\(res, filePath\) \{([\s\S]*?)\n      \},/)[1];
  const setHeaders = new Function('res', 'filePath', hook);
  for (const file of ['sitemap-index.xml', 'sitemap-0.xml', 'sitemap-0.xml.gz', 'sitemap-0.xml.br']) {
    const headers = {};
    setHeaders({ setHeader(name, value) { headers[name] = value; } }, '/dist/client/' + file);
    assert.equal(headers['Cache-Control'], 'public, max-age=0, must-revalidate');
  }
  setHeaders({ setHeader() { assert.fail('Hashed asset cache must remain unchanged'); } }, '/dist/client/_astro/app.abc.js');
});
