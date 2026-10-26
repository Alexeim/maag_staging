import { createHash } from 'node:crypto';
import type { Article } from '../controllers/articleController';
import {
  richTextHtmlToPlainText,
  sanitizeUntrustedRichTextHtml,
} from '../utils/richText';

// Which parts of an article get translated, and how a translated copy is put
// back together. Pure — no Firestore, no translation provider — so the script
// and the dashboard route share one definition of "the text of an article".
//
// The block types and fields below come from the stored articles (checked on
// 2026-10-26), not only from the renderers: `tips-item` exists only in tips
// articles, ~10% of blocks have no `id`, and `h2`/`h3` carry a leftover
// `quoteAuthor` that nothing renders.

export type TranslationFormat = 'text' | 'html';

export interface TranslationSegment {
  // Path inside the article, e.g. "title" or "content.3.left". Positional,
  // because older blocks have no id; only stable within one source snapshot.
  key: string;
  format: TranslationFormat;
  source: string;
}

export type TranslatedArticleText = Pick<
  Article,
  | 'title'
  | 'lead'
  | 'leadHtml'
  | 'subtitle'
  | 'subtitleHtml'
  | 'intro'
  | 'introHtml'
  | 'cardTitle'
  | 'cardLead'
  | 'imageCaption'
  | 'secondImageCaption'
  | 'content'
>;

type ArticleTextSource = Partial<TranslatedArticleText>;
type Translate = (key: string, source: string, format: TranslationFormat) => string;
type Block = Record<string, unknown>;

const isRecord = (value: unknown): value is Block =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

// Zero-width characters Quill leaves behind (its saved cursor is "﻿").
// Sent as-is they are billed and can come back in odd places.
const ZERO_WIDTH_RE = /[​-‍﻿]/g;

const cleanText = (value: unknown): string =>
  typeof value === 'string' ? value.replace(ZERO_WIDTH_RE, '').trim() : '';

// Walks every translatable string of an article and returns a copy with each
// string replaced by `translate(...)`. Ids, types, urls, icons and anything
// not listed here are copied untouched. The single source of truth for both
// extraction and assembly, so the two can never disagree about the fields.
const mapArticleText = (
  article: ArticleTextSource,
  translate: Translate,
  onUnknownBlockType: (type: string) => void = () => {},
): TranslatedArticleText => {
  const plain = (key: string, value: unknown): string => {
    const source = cleanText(value);
    return source ? translate(key, source, 'text') : '';
  };

  // A rich-text field is stored twice: `html` (what the page renders) and a
  // plain `text` twin. When html exists it is translated and the text is
  // derived from it, so the pair can't drift apart; otherwise the text is.
  const rich = (key: string, html: unknown, text: unknown) => {
    const sourceHtml = sanitizeUntrustedRichTextHtml(cleanText(html));
    if (sourceHtml) {
      const translatedHtml = sanitizeUntrustedRichTextHtml(
        translate(key, sourceHtml, 'html'),
      );
      return { html: translatedHtml, text: richTextHtmlToPlainText(translatedHtml) };
    }
    return { html: '', text: plain(key, text) };
  };

  const mapColumn = (column: unknown, key: string): unknown => {
    if (!isRecord(column)) return column;
    switch (column.type) {
      case 'text': {
        const { html, text } = rich(key, column.html, column.content);
        return { ...column, html, content: text };
      }
      case 'quote':
        return {
          ...column,
          content: plain(key, column.content),
          quoteAuthor: plain(`${key}.quoteAuthor`, column.quoteAuthor),
        };
      case 'image':
        return { ...column, caption: plain(`${key}.caption`, column.caption) };
      default:
        return column;
    }
  };

  const withCaptions = (block: Block, key: string, fields: string[]): Block =>
    fields.reduce<Block>(
      (result, field) => ({ ...result, [field]: plain(`${key}.${field}`, block[field]) }),
      block,
    );

  const mapBlock = (block: unknown, index: number): unknown => {
    if (!isRecord(block)) return block;
    const key = `content.${index}`;

    switch (block.type) {
      case 'paragraph':
      case 'first-paragraph':
        return { ...block, ...rich(key, block.html, block.text) };
      case 'h2':
      case 'h3':
      case 'url-link':
        return { ...block, text: plain(key, block.text) };
      case 'quote':
        return {
          ...block,
          text: plain(key, block.text),
          quoteAuthor: plain(`${key}.quoteAuthor`, block.quoteAuthor),
        };
      case 'qa':
        return {
          ...block,
          question: plain(`${key}.question`, block.question),
          answer: plain(`${key}.answer`, block.answer),
        };
      case 'image':
      case 'video':
        return withCaptions(block, key, ['caption']);
      case 'one-big-one-small':
        return withCaptions(block, key, ['portraitImageCaption', 'landscapeImageCaption']);
      case 'collage':
        return withCaptions(block, key, [
          'leftPortraitImageCaption',
          'topLandscapeImageCaption',
          'mainLandscapeImageCaption',
          'rightPortraitImageCaption',
        ]);
      case 'two-columns':
        return {
          ...block,
          left: mapColumn(block.left, `${key}.left`),
          right: mapColumn(block.right, `${key}.right`),
        };
      case 'three-columns':
        return {
          ...block,
          left: mapColumn(block.left, `${key}.left`),
          center: mapColumn(block.center, `${key}.center`),
          right: mapColumn(block.right, `${key}.right`),
        };
      case 'flipper':
        return {
          ...block,
          slides: Array.isArray(block.slides)
            ? block.slides.map((slide, slideIndex) =>
                isRecord(slide)
                  ? withCaptions(slide, `${key}.slides.${slideIndex}`, ['caption'])
                  : slide,
              )
            : block.slides,
        };
      case 'tips':
        return {
          ...block,
          tips: Array.isArray(block.tips)
            ? block.tips.map((tip, tipIndex) =>
                isRecord(tip) ? { ...tip, text: plain(`${key}.tips.${tipIndex}`, tip.text) } : tip,
              )
            : block.tips,
        };
      case 'tips-item':
        // meta1/meta2 are a legacy shape nothing renders any more
        // (TipsArticleBody reads metaItems only) — copied, not translated.
        return {
          ...block,
          ...rich(key, block.html, block.text),
          heading: plain(`${key}.heading`, block.heading),
          imageCaption: plain(`${key}.imageCaption`, block.imageCaption),
          metaItems: Array.isArray(block.metaItems)
            ? block.metaItems.map((item, itemIndex) =>
                isRecord(item)
                  ? { ...item, text: plain(`${key}.metaItems.${itemIndex}`, item.text) }
                  : item,
              )
            : block.metaItems,
        };
      // Cards rendered from the linked material / an embed: no own text.
      case 'link':
      case 'tweet':
        return block;
      default:
        onUnknownBlockType(typeof block.type === 'string' ? block.type : 'unknown');
        return block;
    }
  };

  const lead = rich('lead', article.leadHtml, article.lead);
  const subtitle = rich('subtitle', article.subtitleHtml, article.subtitle);
  const intro = rich('intro', article.introHtml, article.intro);

  return {
    title: plain('title', article.title),
    lead: lead.text,
    leadHtml: lead.html,
    subtitle: subtitle.text,
    subtitleHtml: subtitle.html,
    intro: intro.text,
    introHtml: intro.html,
    cardTitle: plain('cardTitle', article.cardTitle),
    cardLead: plain('cardLead', article.cardLead),
    imageCaption: plain('imageCaption', article.imageCaption),
    secondImageCaption: plain('secondImageCaption', article.secondImageCaption),
    content: Array.isArray(article.content)
      ? article.content.map((block, index) => mapBlock(block, index))
      : [],
  };
};

export const extractArticleSegments = (
  article: ArticleTextSource,
): { segments: TranslationSegment[]; unknownBlockTypes: string[] } => {
  const segments: TranslationSegment[] = [];
  const unknownBlockTypes = new Set<string>();
  mapArticleText(
    article,
    (key, source, format) => {
      segments.push({ key, format, source });
      return source;
    },
    (type) => unknownBlockTypes.add(type),
  );
  return { segments, unknownBlockTypes: [...unknownBlockTypes] };
};

// Translation LLM marks titles and terms as Markdown italics (*Tapiola*,
// *forte*), which would show up as literal asterisks. Unless the source
// segment had asterisks of its own, they become real italics in html and are
// dropped in plain text.
const MARKDOWN_EMPHASIS_RE = /\*([^*\n]+?)\*/g;

export const convertProviderEmphasis = (
  translated: string,
  source: string,
  format: TranslationFormat,
): string => {
  if (source.includes('*')) return translated;
  return translated.replace(MARKDOWN_EMPHASIS_RE, format === 'html' ? '<em>$1</em>' : '$1');
};

// Throws on any missing segment: a partly translated article is never built.
export const buildTranslatedArticleText = (
  article: ArticleTextSource,
  translations: Record<string, string>,
): TranslatedArticleText =>
  mapArticleText(article, (key, source, format) => {
    const translated = translations[key];
    if (typeof translated !== 'string' || !translated.trim()) {
      throw new Error(`Missing translation for "${key}"`);
    }
    return convertProviderEmphasis(translated, source, format);
  });

// Fingerprint of the translatable text only. A translation whose
// sourceRevision differs from the original's current one is stale; changing an
// image does not change it, so it never forces a paid re-translation.
export const computeSourceRevision = (segments: TranslationSegment[]): string =>
  createHash('sha256')
    .update(JSON.stringify(segments.map(({ key, format, source }) => [key, format, source])))
    .digest('hex');
