// Article translation: what gets sent to the provider and how the result is
// assembled. Pure functions — no Firestore, no provider.
import { describe, expect, test } from 'vitest';
import {
  buildTranslatedArticleText,
  computeSourceRevision,
  convertProviderEmphasis,
  extractArticleSegments,
} from '../src/services/articleTranslation';
import {
  richTextHtmlToPlainText,
  sanitizeUntrustedRichTextHtml,
} from '../src/utils/richText';

describe('sanitizeUntrustedRichTextHtml', () => {
  test('keeps editor formatting and drops every original attribute', () => {
    expect(
      sanitizeUntrustedRichTextHtml(
        '<p class="x" onclick="steal()"><strong>Gras</strong>, <em>italique</em>, <u>souligné</u><br></p>',
      ),
    ).toBe('<p><strong>Gras</strong>, <em>italique</em>, <u>souligné</u><br></p>');
  });

  test('neutralises markup a provider should never return', () => {
    const result = sanitizeUntrustedRichTextHtml(
      '<p>Salut <img src=x onerror="alert(1)"><script>alert(1)</script> 3 < 4</p>',
    );
    expect(result).toBe('<p>Salut alert(1) 3 &lt; 4</p>');
  });

  test('keeps only vetted links', () => {
    expect(
      sanitizeUntrustedRichTextHtml(
        '<p><a href="https://maagfrance.fr/article/1" data-x="1">ok</a> <a href="javascript:alert(1)">ko</a></p>',
      ),
    ).toBe(
      '<p><a href="https://maagfrance.fr/article/1" target="_blank" rel="noreferrer">ok</a> ko</p>',
    );
  });

  test('drops the spans found in stored articles but keeps their text', () => {
    expect(
      sanitizeUntrustedRichTextHtml(
        '<p><span class="ql-cursor">x</span><span style="color: rgb(0, 0, 0);">texte</span></p>',
      ),
    ).toBe('<p>xtexte</p>');
  });
});

test('richTextHtmlToPlainText turns paragraphs into lines and decodes entities', () => {
  expect(
    richTextHtmlToPlainText('<p>L&#39;<strong>été</strong></p><p>a<br>b &amp; c</p>'),
  ).toBe("L'été\na\nb & c");
});

// Shapes taken from stored articles, including the awkward ones.
const article = {
  title: 'Заголовок',
  lead: 'Лид',
  leadHtml: '<p>Лид <em>курсив</em></p>',
  subtitle: '',
  cardTitle: 'Карточка',
  imageCaption: '',
  content: [
    {
      id: 'p1',
      type: 'paragraph',
      text: 'Абзац',
      html: '<p><span class="ql-cursor">﻿</span>Абзац <a href="https://maagfrance.fr">ссылка</a></p>',
    },
    { type: 'paragraph', text: 'Только текст' }, // older block: no id, no html
    { id: 'h', type: 'h3', text: 'Подзаголовок', quoteAuthor: 'leftover' },
    { id: 'q', type: 'quote', text: 'Цитата', quoteAuthor: 'Автор' },
    { id: 'i', type: 'image', url: 'https://img/1.jpg', caption: 'Подпись' },
    {
      id: 'c',
      type: 'two-columns',
      left: { type: 'image', content: 'https://img/2.jpg', caption: '' },
      right: { type: 'text', content: 'Колонка', html: '<p>Колонка</p>' },
    },
    { id: 'f', type: 'flipper', slides: [{ imageUrl: 'https://img/3.jpg', caption: 'Слайд' }] },
    {
      type: 'tips-item',
      heading: 'Chaumet. 12, place Vendôme',
      imageUrl: 'https://img/4.jpg',
      imageCaption: '',
      metaItems: [{ icon: 'clock', text: 'Пн – пт', isLink: false, url: '' }],
      html: '<p>Совет</p>',
      text: 'Совет',
      meta1: 'legacy',
    },
    { id: 'l', type: 'link', linkedContentType: 'article', linkedContentId: 'x', linkedContentTitle: 'Чужой' },
    { id: 'n', type: 'brand-new-block', text: 'Новое' },
  ],
};

describe('extractArticleSegments', () => {
  const { segments, unknownBlockTypes } = extractArticleSegments(article);
  const byKey = Object.fromEntries(segments.map((segment) => [segment.key, segment]));

  test('sends every stored kind of text, skipping empty fields', () => {
    expect(segments.map((segment) => segment.key)).toEqual([
      'lead',
      'title',
      'cardTitle',
      'content.0',
      'content.1',
      'content.2',
      'content.3',
      'content.3.quoteAuthor',
      'content.4.caption',
      'content.5.right',
      'content.6.slides.0.caption',
      'content.7',
      'content.7.heading',
      'content.7.metaItems.0',
    ]);
  });

  test('sends html for rich text, cleaned of editor leftovers', () => {
    expect(byKey['content.0']).toEqual({
      key: 'content.0',
      format: 'html',
      source:
        '<p>Абзац <a href="https://maagfrance.fr" target="_blank" rel="noreferrer">ссылка</a></p>',
    });
    expect(byKey['content.1'].format).toBe('text');
  });

  test('reports block types it does not know instead of skipping them silently', () => {
    expect(unknownBlockTypes).toEqual(['brand-new-block']);
  });
});

describe('buildTranslatedArticleText', () => {
  const { segments } = extractArticleSegments(article);
  const translations = Object.fromEntries(
    segments.map(({ key, format, source }) => [
      key,
      format === 'html' ? source.replace(/>([^<]+)</g, '>FR $1<') : `FR ${source}`,
    ]),
  );
  const result = buildTranslatedArticleText(article, translations);
  const content = result.content as Record<string, any>[];

  test('fills translated text and derives the plain twin from html', () => {
    expect(result.title).toBe('FR Заголовок');
    expect(result.leadHtml).toBe('<p>FR Лид <em>FR курсив</em></p>');
    expect(result.lead).toBe('FR Лид FR курсив');
    expect(content[0].text).toBe('FR Абзац FR ссылка');
    expect(content[5].right).toMatchObject({ html: '<p>FR Колонка</p>', content: 'FR Колонка' });
    expect(content[7].metaItems[0]).toEqual({ icon: 'clock', text: 'FR Пн – пт', isLink: false, url: '' });
  });

  test('copies ids, urls and untranslatable blocks untouched', () => {
    expect(content[0].id).toBe('p1');
    expect(content[4].url).toBe('https://img/1.jpg');
    expect(content[5].left.content).toBe('https://img/2.jpg');
    expect(content[7].meta1).toBe('legacy');
    expect(content[8]).toEqual(article.content[8]);
    expect(content[9]).toEqual(article.content[9]);
  });

  test('refuses to build a partly translated article', () => {
    const { 'content.3': _dropped, ...incomplete } = translations;
    expect(() => buildTranslatedArticleText(article, incomplete)).toThrow(
      'Missing translation for "content.3"',
    );
  });
});

describe('convertProviderEmphasis', () => {
  test('turns the model’s Markdown italics into <em> in html, drops them in text', () => {
    expect(
      convertProviderEmphasis('<p>Si *Tapiola* y gagne, le *Poème de l’extase*…</p>', '<p>…</p>', 'html'),
    ).toBe('<p>Si <em>Tapiola</em> y gagne, le <em>Poème de l’extase</em>…</p>');
    expect(convertProviderEmphasis('Le *Larghetto*', 'Larghetto', 'text')).toBe('Le Larghetto');
  });

  test('leaves asterisks alone when the source had some', () => {
    expect(convertProviderEmphasis('*note*', '*сноска*', 'text')).toBe('*note*');
  });

  test('ends up as real italics in a built article', () => {
    const source = { title: 'T', content: [{ type: 'paragraph', text: 'Абзац', html: '<p>Абзац</p>' }] };
    const built = buildTranslatedArticleText(source, {
      title: '*T*',
      'content.0': '<p>Le *Larghetto*</p>',
    });
    expect(built.title).toBe('T');
    expect((built.content as Record<string, string>[])[0]).toMatchObject({
      html: '<p>Le <em>Larghetto</em></p>',
      text: 'Le Larghetto',
    });
  });
});

describe('computeSourceRevision', () => {
  const revisionOf = (source: Parameters<typeof extractArticleSegments>[0]) =>
    computeSourceRevision(extractArticleSegments(source).segments);

  test('changes with the text, not with an image', () => {
    const base = revisionOf(article);
    const newText = { ...article, title: 'Другой заголовок' };
    const newImage = {
      ...article,
      content: article.content.map((block) =>
        block.type === 'image' ? { ...block, url: 'https://img/other.jpg' } : block,
      ),
    };
    expect(revisionOf(newText)).not.toBe(base);
    expect(revisionOf(newImage)).toBe(base);
  });
});
