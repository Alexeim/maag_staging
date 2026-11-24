import { expect, test } from 'vitest';
import { extractSearchDocument, inspectSearchMatch, SEARCH_SOURCES } from '../src/utils/searchCorpus';

const article = SEARCH_SOURCES[0];
const published = {
  id: 'example', title: 'Париж', published: true,
  publishedAt: { _seconds: 1_790_000_000, _nanoseconds: 0 },
};

test('excludes drafts and missing publication flags without coercion', () => {
  for (const flag of [false, undefined, null, 'true', 1]) {
    expect(extractSearchDocument(article, { ...published, published: flag }).document).toBeNull();
  }
});

test('extracts nested text, interview answers, tips, captions and metadata without duplicating rich text', () => {
  const { document, warnings } = extractSearchDocument(article, {
    ...published,
    lead: 'Old introduction', leadHtml: '<p>Свежий <strong>анонс</strong></p>',
    content: [
      { type: 'paragraph', text: 'Stale copy', html: '<p>Святой <em>Антоний</em> &amp; Париж</p>' },
      { type: 'two-columns',
        left: { type: 'text', content: 'Legacy column' },
        right: { type: 'quote', content: 'Цитата', quoteAuthor: 'Автор цитаты' } },
      { type: 'three-columns', center: { type: 'text', content: 'Old', html: '<p>Центральная колонка</p>' } },
      { type: 'qa', question: 'Вопрос?', answer: 'Old answer', answerHtml: '<p>Ответ</p>' },
      { type: 'tips', tips: [{ type: 'location', text: 'Монмартр' }] },
      { type: 'tips-item', heading: 'Совет', text: 'Описание', metaItems: [{ text: 'Бесплатно' }] },
      { type: 'image', content: 'https://private-image.example/token', caption: 'Музей' },
      { type: 'flipper', slides: [{ imageUrl: 'https://image.example', caption: 'Подпись слайда' }] },
      { type: 'link', linkedContentId: 'draft-id', linkedContentTitle: 'Cached draft title', text: 'Cached draft title' },
    ],
    relatedContent: { title: 'Unrelated title' }, authorId: 'private-author-id',
  });
  expect(warnings).toEqual([]);
  expect(document?.introduction).toBe('Свежий анонс');
  expect(document?.body).toBe([
    'Святой Антоний & Париж', 'Legacy column', 'Цитата', 'Автор цитаты',
    'Центральная колонка', 'Вопрос?', 'Ответ', 'Монмартр', 'Описание', 'Совет',
    'Бесплатно', 'Музей', 'Подпись слайда',
  ].join('\n'));
  expect(JSON.stringify(document)).not.toMatch(/Stale|Old|https:|private-author|draft|Unrelated/);
  expect(inspectSearchMatch(document!, 'святой антоний')).toEqual(['body']);
});

test('falls back from empty rich text and warns about unknown formats', () => {
  const result = extractSearchDocument(article, {
    ...published, content: [
      { type: 'paragraph', text: 'Сохранённый текст', html: '<p><br></p>' },
      { type: 'future-block', text: 'Unsupported text' },
    ],
  });
  expect(result.document?.body).toBe('Сохранённый текст');
  expect(result.warnings).toEqual(['content[1]: unsupported block type "future-block"']);
});

test('extracts visual-story quote slides without indexing hidden leftover text', () => {
  const result = extractSearchDocument(SEARCH_SOURCES[7], {
    ...published, slides: [
      { contentType: 'quote', quote: 'Цитата слайда', quoteAuthor: 'Художник', text: 'Hidden draft', html: '<p>Hidden draft</p>', caption: 'Подпись' },
      { contentType: 'text', html: '<p>Текст слайда</p>', text: 'Old text' },
    ],
  });
  expect(result.document?.body).toBe('Цитата слайда\nХудожник\nПодпись\nТекст слайда');
});

test('uses material-specific routes, distinct source ids and publication dates only', () => {
  const tips = extractSearchDocument(article, { ...published, articleType: 'tips' }).document!;
  const opinion = extractSearchDocument(SEARCH_SOURCES[6], { ...published, variant: 'opinion' }).document!;
  expect(tips).toMatchObject({ id: 'articles:example', type: 'tips', href: '/tips/example' });
  expect(opinion).toMatchObject({ id: 'first-person:example', type: 'opinion', href: '/first-person/example' });
  expect(tips.publishedAt).toBe(new Date(1_790_000_000_000).toISOString());
  const result = extractSearchDocument(article, { ...published, publishedAt: null, createdAt: '2020-01-01' });
  expect(result.document?.publishedAt).toBeNull();
  expect(result.warnings).toHaveLength(1);
});

test('diagnostic matching handles case and ё, but does not claim morphology or semantics', () => {
  const document = extractSearchDocument(article, { ...published, title: 'Зелёный сад', content: [{ type: 'paragraph', text: 'Святого Антония' }] }).document!;
  expect(inspectSearchMatch(document, 'ЗЕЛЕНЫЙ')).toEqual(['title']);
  expect(inspectSearchMatch(document, 'Антония')).toEqual(['body']);
  expect(inspectSearchMatch(document, 'Антоний')).toEqual([]);
  expect(inspectSearchMatch(document, '  ')).toEqual([]);
});
