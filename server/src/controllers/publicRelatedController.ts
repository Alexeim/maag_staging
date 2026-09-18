import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

const db = getDb();

// Everything a material page shows as cards: the "Похожие материалы" carousel
// (collection + related + autofill), the news-page sidebar (built from those
// three lists on the page) and in-body link cards. The pages used to build
// these themselves by downloading every material of every type — drafts and
// full `content` blocks included — to pick a dozen cards.
//
// Rules are carried over from the material pages unchanged; the only
// behavioural change is that unpublished materials never become cards.

type PageType = 'article' | 'tips' | 'news' | 'guide' | 'flipper' | 'interview' | 'event';

// Card `contentType` values, as the frontend components expect them.
type CardType =
  | 'article'
  | 'news'
  | 'interview'
  | 'event'
  | 'flipper'
  | 'guide'
  | 'visual-story'
  | 'photoOfTheDay';

const COLLECTION_BY_CARD_TYPE: Record<CardType, string> = {
  article: 'articles',
  news: 'news',
  interview: 'interviews',
  event: 'events',
  flipper: 'flippers',
  guide: 'guides',
  'visual-story': 'visual-stories',
  photoOfTheDay: 'photosOfTheDay',
};

const PAGE_TYPES: Record<PageType, { collection: string; cardType: CardType }> = {
  article: { collection: 'articles', cardType: 'article' },
  tips: { collection: 'articles', cardType: 'article' },
  news: { collection: 'news', cardType: 'news' },
  guide: { collection: 'guides', cardType: 'guide' },
  flipper: { collection: 'flippers', cardType: 'flipper' },
  interview: { collection: 'interviews', cardType: 'interview' },
  event: { collection: 'events', cardType: 'event' },
};

// Keys used in `relatedContent`, in content collections and in link blocks.
// `visualStory` is how those stored references spell the visual-story type.
const CARD_TYPE_BY_REFERENCE: Record<string, CardType> = {
  article: 'article',
  news: 'news',
  interview: 'interview',
  event: 'event',
  flipper: 'flipper',
  guide: 'guide',
  visualStory: 'visual-story',
  'visual-story': 'visual-story',
  photoOfTheDay: 'photoOfTheDay',
};

// Order in which a content collection's materials are listed on the page.
const COLLECTION_REFERENCE_ORDER = [
  'article',
  'event',
  'interview',
  'guide',
  'news',
  'flipper',
  'visualStory',
];

// Only what a card, its badge or an autofill rule reads. `published` is
// fetched to filter on and never sent.
const CARD_FIELDS = [
  'title',
  'cardTitle',
  'cardLead',
  'lead',
  'mainQuote',
  'imageUrl',
  'caption',
  'carouselContent',
  'slides',
  'createdAt',
  'category',
  'articleType',
  'isNews',
  'tags',
  'published',
];

const AUTOFILL_LIMIT = 12;

interface Card {
  id: string;
  contentType: CardType;
  href: string;
  title?: string;
  cardTitle?: string;
  cardLead?: string;
  lead?: string;
  mainQuote?: string;
  imageUrl: string | null;
  createdAt?: unknown;
  category?: string;
  articleType?: string;
  isNews?: boolean;
  tags: string[];
}

type Snapshot = FirebaseFirestore.DocumentSnapshot;

const toTime = (value: any): number => {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value.toMillis === 'function') return value.toMillis();
  const seconds = value.seconds ?? value._seconds;
  return typeof seconds === 'number' ? seconds * 1000 : 0;
};

// Paris district codes ("district-16") must never show up as a tag badge.
const normalizeTags = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag) => Boolean(tag) && !/^district-\d+$/i.test(tag))
    : [];

const toHref = (type: CardType, id: string, data: any): string => {
  if (type === 'event') return `/events/${id}`;
  if (type === 'interview') return `/interviews/${id}`;
  if (type === 'flipper') return `/flippers/${id}`;
  if (type === 'guide') return `/guide/${id}`;
  if (type === 'visual-story') return `/visual-story/${id}`;
  if (type === 'photoOfTheDay') return `/photo-of-the-day/${id}`;
  if (type === 'article' && data.articleType === 'tips') return `/tips/${id}`;
  if (type === 'news' || data.isNews) return `/news/${id}`;
  return `/article/${id}`;
};

const toImageUrl = (type: CardType, data: any): string | null => {
  if (type === 'flipper') return data.carouselContent?.[0]?.imageUrl || null;
  if (type === 'visual-story') return data.imageUrl || data.slides?.[0]?.imageUrl || null;
  return data.imageUrl || null;
};

const toCard = (type: CardType, doc: Snapshot): Card => {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    contentType: type,
    href: toHref(type, doc.id, data),
    title: data.title,
    cardTitle: data.cardTitle,
    cardLead: type === 'photoOfTheDay' ? data.caption || '' : data.cardLead,
    lead: data.lead,
    mainQuote: data.mainQuote,
    imageUrl: toImageUrl(type, data),
    createdAt: data.createdAt,
    category: data.category,
    articleType: data.articleType,
    isNews: type === 'news' ? true : data.isNews,
    tags: type === 'photoOfTheDay' ? [] : normalizeTags(data.tags),
  };
};

const isPublishedDoc = (doc: Snapshot) => doc.exists && doc.data()?.published === true;

const cardKey = (card: Card) => `${card.contentType}:${card.id}`;

// Fetches the given references by id, card fields only, and keeps the
// published ones. Order of `refs` is preserved.
const fetchCardsByReference = async (
  refs: Array<{ type: CardType; id: string }>,
): Promise<Card[]> => {
  if (refs.length === 0) return [];
  const docRefs = refs.map((ref) => db.collection(COLLECTION_BY_CARD_TYPE[ref.type]).doc(ref.id));
  const docs = await db.getAll(...docRefs, { fieldMask: CARD_FIELDS });
  return docs
    .map((doc, index) => (isPublishedDoc(doc) ? toCard(refs[index].type, doc) : null))
    .filter((card): card is Card => card !== null);
};

const toIdList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((id): id is string => typeof id === 'string' && Boolean(id.trim())).map((id) => id.trim())
    : [];

// Link blocks can sit inside nested structures (sections, columns), so walk
// the whole document rather than only the top-level `content` array.
const collectLinkReferences = (
  value: unknown,
  found: Map<string, { key: string; type: CardType; id: string }>,
) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectLinkReferences(item, found));
    return;
  }
  if (!value || typeof value !== 'object') return;

  const block = value as Record<string, unknown>;
  if (
    block.type === 'link' &&
    typeof block.linkedContentType === 'string' &&
    typeof block.linkedContentId === 'string' &&
    block.linkedContentId.trim()
  ) {
    const type = CARD_TYPE_BY_REFERENCE[block.linkedContentType];
    const id = block.linkedContentId.trim();
    // Keyed by the block's own spelling, which is what ArticleBody looks up.
    const key = `${block.linkedContentType}:${id}`;
    if (type) found.set(key, { key, type, id });
  }

  Object.values(block).forEach((child) => collectLinkReferences(child, found));
};

// The article page matches "culture" and "Культура" as the same section.
const ARTICLE_CATEGORY_LABELS: Record<string, string> = {
  culture: 'Культура',
  paris: 'Париж',
  hotContent: 'Самое Читаемое',
};

const normalizeArticleCategory = (value?: string | null): string | null => {
  if (!value) return null;
  const normalizedValue = value.trim().toLowerCase();
  const entry = Object.entries(ARTICLE_CATEGORY_LABELS).find(
    ([key, label]) =>
      key.toLowerCase() === normalizedValue || label.toLowerCase() === normalizedValue,
  );
  return entry ? entry[0] : normalizedValue;
};

const isStandardArticle = (data: any) =>
  !data?.isNews && data?.articleType !== 'tips' && data?.articleType !== 'le_saviez_vous';

// Returns the candidate filter for a page's autofill, or null when the page
// type has no autofill (events).
const buildAutofillFilter = (
  pageType: PageType,
  current: any,
): ((data: any) => boolean) | null => {
  if (pageType === 'article') {
    const currentCategory = normalizeArticleCategory(current.category);
    return (data) =>
      isStandardArticle(data) && normalizeArticleCategory(data.category) === currentCategory;
  }
  if (pageType === 'tips') {
    const rawCategory = current.category ?? current.header?.category ?? null;
    const currentCategory = rawCategory?.toLowerCase() ?? null;
    return (data) =>
      data.articleType === 'tips' &&
      (!currentCategory || data.category?.toLowerCase() === currentCategory);
  }
  if (pageType === 'news') {
    const currentCategory = current.category?.toLowerCase?.() ?? null;
    return (data) => !currentCategory || data.category?.toLowerCase() === currentCategory;
  }
  if (pageType === 'guide') {
    const rawCategory = current.category ?? null;
    return (data) => !rawCategory || data.category === rawCategory;
  }
  if (pageType === 'flipper' || pageType === 'interview') {
    return () => true;
  }
  return null;
};

/**
 * @description Cards for one material page: collection, related, autofill and in-body links
 * @route GET /api/public/related/:type/:id
 */
export const getPublicRelated = async (req: Request, res: Response) => {
  try {
    const pageType = req.params.type as PageType;
    const page = PAGE_TYPES[pageType];
    if (!page) {
      return res.status(400).json({ message: `Unknown material type "${req.params.type}"` });
    }

    // The material itself is not required to be published: admins preview
    // drafts on their real page and should see the same cards. Only cards
    // are filtered — no unpublished material is ever returned as one.
    const currentDoc = await db.collection(page.collection).doc(req.params.id).get();
    if (!currentDoc.exists) {
      return res.status(404).json({ message: 'Material not found' });
    }
    const current = currentDoc.data() ?? {};
    const currentKey = `${page.cardType}:${currentDoc.id}`;

    // 1. Content collection the material belongs to.
    let collection: Card[] = [];
    const collectionId =
      typeof current.contentCollectionId === 'string' ? current.contentCollectionId.trim() : '';
    if (collectionId) {
      const collectionDoc = await db.collection('contentCollections').doc(collectionId).get();
      const content = collectionDoc.data()?.content ?? {};
      const refs = COLLECTION_REFERENCE_ORDER.flatMap((reference) =>
        toIdList(content[reference]).map((id) => ({
          type: CARD_TYPE_BY_REFERENCE[reference],
          id,
        })),
      );
      collection = await fetchCardsByReference(refs);
    }

    const seenKeys = new Set<string>([currentKey]);
    collection = collection.filter((card) => {
      const key = cardKey(card);
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

    // 2. Materials an editor linked by hand, in stored order.
    const relatedRefs = Object.entries(current.relatedContent ?? {}).flatMap(([reference, ids]) => {
      const type = CARD_TYPE_BY_REFERENCE[reference];
      return type ? toIdList(ids).map((id) => ({ type, id })) : [];
    });
    const related = (await fetchCardsByReference(relatedRefs)).filter((card) => {
      const key = cardKey(card);
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

    // 3. Autofill: newest published materials of the page's own type that
    // match its rule, minus anything already shown above.
    let autofill: Card[] = [];
    const matchesRule = buildAutofillFilter(pageType, current);
    if (matchesRule) {
      const snapshot = await db
        .collection(page.collection)
        .where('published', '==', true)
        .select(...CARD_FIELDS)
        .get();
      autofill = snapshot.docs
        .filter((doc) => !seenKeys.has(`${page.cardType}:${doc.id}`) && matchesRule(doc.data()))
        .sort((left, right) => toTime(right.data().createdAt) - toTime(left.data().createdAt))
        .slice(0, AUTOFILL_LIMIT)
        .map((doc) => toCard(page.cardType, doc));
    }

    // 4. Cards for link blocks inside the material's body, keyed the way
    // ArticleBody looks them up ("<linkedContentType>:<id>").
    const linkRefs = new Map<string, { key: string; type: CardType; id: string }>();
    collectLinkReferences(current, linkRefs);
    const linkEntries = Array.from(linkRefs.values());
    const linkDocs =
      linkEntries.length > 0
        ? await db.getAll(
            ...linkEntries.map((entry) =>
              db.collection(COLLECTION_BY_CARD_TYPE[entry.type]).doc(entry.id),
            ),
            { fieldMask: CARD_FIELDS },
          )
        : [];
    const linked: Record<string, Card> = {};
    linkDocs.forEach((doc, index) => {
      if (isPublishedDoc(doc)) {
        linked[linkEntries[index].key] = toCard(linkEntries[index].type, doc);
      }
    });

    res.status(200).json({ collection, related, autofill, linked });
  } catch (error) {
    console.error('Error getting public related cards:', error);
    res.status(500).json({ message: 'Server error while getting related cards' });
  }
};
