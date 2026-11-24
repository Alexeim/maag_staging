import { normalizeFirstPersonVariant } from './firstPersonVariant';
import { richTextHtmlToPlainText } from './richText';

// `collection` is the Firestore collection; HTTP endpoints differ for two sources.
export const SEARCH_SOURCES = [
  { endpoint: 'articles', collection: 'articles', type: 'article', route: 'article' },
  { endpoint: 'news', collection: 'news', type: 'news', route: 'news' },
  { endpoint: 'events', collection: 'events', type: 'event', route: 'events' },
  { endpoint: 'guides', collection: 'guides', type: 'guide', route: 'guide' },
  { endpoint: 'interviews', collection: 'interviews', type: 'interview', route: 'interviews' },
  { endpoint: 'flippers', collection: 'flippers', type: 'flipper', route: 'flippers' },
  { endpoint: 'first-person', collection: 'firstPerson', type: 'first-person', route: 'first-person' },
  { endpoint: 'visual-stories', collection: 'visual-stories', type: 'visual-story', route: 'visual-story' },
  { endpoint: 'photos-of-the-day', collection: 'photosOfTheDay', type: 'photo-of-the-day', route: 'photo-of-the-day' },
] as const;

export type SearchSource = (typeof SEARCH_SOURCES)[number];

export interface SearchDocument {
  id: string;
  sourceId: string;
  type: string;
  href: string;
  title: string;
  introduction: string;
  body: string;
  tags: string[];
  category: string;
  paid: boolean;
  publishedAt: string | null;
}

export interface SearchExtraction {
  document: SearchDocument | null;
  warnings: string[];
}

const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const plain = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

const rich = (html: unknown, fallback: unknown): string =>
  plain(richTextHtmlToPlainText(html)) || plain(fallback);

const join = (parts: string[]): string => [...new Set(parts.filter(Boolean))].join('\n');

const CAPTIONS = [
  'caption', 'imageCaption', 'secondImageCaption', 'portraitImageCaption',
  'landscapeImageCaption', 'leftPortraitImageCaption', 'topLandscapeImageCaption',
  'mainLandscapeImageCaption', 'rightPortraitImageCaption',
] as const;

const BLOCK_TYPES = new Set([
  'paragraph', 'first-paragraph', 'h2', 'h3', 'quote', 'text', 'image', 'video',
  'qa', 'two-columns', 'three-columns', 'one-big-one-small', 'collage', 'flipper',
  'tips', 'tips-item', 'location', 'time', 'money', 'idea', 'like', 'dislike',
  'link', 'url-link', 'tweet',
]);

const extractBody = (value: unknown, path: string, warnings: string[]): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => extractBody(item, `${path}[${index}]`, warnings));
  }
  const node = record(value);
  if (!node) return [];
  const type = plain(node.type);
  if (type && !BLOCK_TYPES.has(type)) {
    warnings.push(`${path}: unsupported block type "${type}"`);
    return [];
  }
  // Related cards belong to another material; do not index their cached titles.
  if (type === 'link' && node.linkedContentId) return [];

  const parts: string[] = [];
  if (type === 'qa') {
    parts.push(plain(node.question), rich(node.answerHtml, node.answer));
  } else if (node.contentType === 'quote') {
    parts.push(plain(node.quote), plain(node.quoteAuthor));
  } else if (type === 'quote') {
    parts.push(plain(node.text) || plain(node.content), plain(node.quoteAuthor));
  } else if (type !== 'image' && type !== 'video') {
    parts.push(rich(node.html, node.text ?? node.content));
  }
  parts.push(plain(node.heading));
  CAPTIONS.forEach((key) => parts.push(plain(node[key])));
  if (!Array.isArray(node.metaItems) || node.metaItems.length === 0) {
    parts.push(plain(node.meta1), plain(node.meta2));
  }
  for (const key of ['left', 'center', 'right', 'slides', 'tips', 'metaItems']) {
    parts.push(...extractBody(node[key], `${path}.${key}`, warnings));
  }
  return parts.filter(Boolean);
};

const publicationDate = (value: unknown): string | null => {
  const timestamp = record(value);
  const seconds = timestamp?._seconds ?? timestamp?.seconds;
  const date = value instanceof Date ? value
    : typeof value === 'string' ? new Date(value)
      : typeof seconds === 'number' ? new Date(seconds * 1000) : null;
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

export const extractSearchDocument = (source: SearchSource, value: unknown): SearchExtraction => {
  const data = record(value);
  const warnings: string[] = [];
  if (!data || data.published !== true) return { document: null, warnings };
  const sourceId = plain(data.id);
  const title = plain(data.title);
  if (!sourceId || !title) {
    return { document: null, warnings: ['Published material is missing its id or title'] };
  }
  const route = source.type === 'article' && data.articleType === 'tips' ? 'tips' : source.route;
  const type = source.type === 'first-person' ? normalizeFirstPersonVariant(data.variant)
    : route === 'tips' ? 'tips' : source.type;
  const body: string[] = [];
  for (const key of ['content', 'tips', 'carouselContent', 'slides', 'additionalInfo']) {
    body.push(...extractBody(data[key], key, warnings));
  }
  CAPTIONS.forEach((key) => body.push(plain(data[key])));
  body.push(plain(data.mainQuote), plain(data.interviewee));
  const publishedAt = publicationDate(data.publishedAt);
  if (!publishedAt) warnings.push('Published material is missing a valid publishedAt');
  return {
    document: {
      id: `${source.endpoint}:${sourceId}`,
      sourceId,
      type,
      href: `/${route}/${encodeURIComponent(sourceId)}`,
      title,
      introduction: join([
        rich(data.leadHtml, data.lead), rich(data.subtitleHtml, data.subtitle),
        rich(data.introHtml, data.intro), plain(data.cardTitle), plain(data.cardLead),
      ].filter((text) => text !== title)),
      body: join(body),
      tags: Array.isArray(data.tags) ? [...new Set(data.tags.map(plain).filter(Boolean))] : [],
      category: plain(data.category),
      paid: data.paid === true,
      publishedAt,
    },
    warnings,
  };
};

// Diagnostic literal matching only: this is not a production search engine.
export const normalizeSearchText = (text: string): string =>
  text.normalize('NFKC').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();

export const inspectSearchMatch = (document: SearchDocument, query: string): string[] => {
  const needle = normalizeSearchText(query);
  if (!needle) return [];
  const fields = {
    title: document.title, introduction: document.introduction,
    body: document.body, tags: document.tags.join(' '),
  };
  return Object.entries(fields)
    .filter(([, text]) => normalizeSearchText(text).includes(needle))
    .map(([field]) => field);
};
