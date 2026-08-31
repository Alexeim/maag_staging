import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

const db = getDb();

type MaterialContentType =
  | 'article'
  | 'news'
  | 'guide'
  | 'event'
  | 'flipper'
  | 'interview'
  | 'visual-story';

const COLLECTION_BY_TYPE: Record<MaterialContentType, string> = {
  article: 'articles',
  news: 'news',
  guide: 'guides',
  event: 'events',
  flipper: 'flippers',
  interview: 'interviews',
  'visual-story': 'visual-stories',
};

const TYPE_LABELS: Record<MaterialContentType, string> = {
  article: 'Статьи',
  news: 'Новости',
  guide: 'Гиды',
  event: 'События',
  flipper: 'Листалки',
  interview: 'Интервью',
  'visual-story': 'Крупным планом',
};

// Order in which sections appear on the /tag/[tag] page. Events lead the
// page on purpose (no longer mirrors profileLogic.ts's BOOKMARK_TYPE_ORDER,
// which is a separate "my bookmarks" listing).
const TYPE_ORDER: MaterialContentType[] = [
  'event',
  'article',
  'news',
  'guide',
  'flipper',
  'interview',
  'visual-story',
];

// Order in which sections appear on the /author/[id] page — articles lead,
// since that's the main thing an author is known for; events go second.
const AUTHOR_TYPE_ORDER: MaterialContentType[] = [
  'article',
  'event',
  'news',
  'guide',
  'flipper',
  'interview',
  'visual-story',
];

// Each section paginates independently, so every type needs its own query param.
const PAGE_PARAM_BY_TYPE: Record<MaterialContentType, string> = {
  article: 'articlePage',
  news: 'newsPage',
  guide: 'guidePage',
  event: 'eventPage',
  flipper: 'flipperPage',
  interview: 'interviewPage',
  'visual-story': 'visualStoryPage',
};

const PAGE_SIZE = 10;

const getHref = (type: MaterialContentType, id: string): string => {
  if (type === 'interview') return `/interviews/${id}`;
  if (type === 'flipper') return `/flippers/${id}`;
  if (type === 'guide') return `/guide/${id}`;
  if (type === 'visual-story') return `/visual-story/${id}`;
  if (type === 'news') return `/news/${id}`;
  if (type === 'event') return `/events/${id}`;
  return `/article/${id}`;
};

const getImageUrl = (type: MaterialContentType, data: any): string | null => {
  if (type === 'flipper') return data.carouselContent?.[0]?.imageUrl ?? data.imageUrl ?? null;
  if (type === 'visual-story') return data.imageUrl ?? data.slides?.[0]?.imageUrl ?? null;
  return typeof data.imageUrl === 'string' ? data.imageUrl : null;
};

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value.toDate === 'function') {
    const parsed = value.toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }
  const seconds = value.seconds ?? value._seconds;
  const nanoseconds = value.nanoseconds ?? value._nanoseconds ?? 0;
  if (typeof seconds === 'number') {
    return new Date(seconds * 1000 + nanoseconds / 1_000_000);
  }
  return null;
};

const getTime = (value: any): number => toDate(value)?.getTime() ?? 0;

const parsePage = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
};

// Content types that can carry the "самое читаемое" / "записная книжка" /
// "Нетленка" editorial flags — mirrors EDITORIAL_FLAG_CONTENT_TYPE_SET in
// publicLandingController.ts so a flag means the same thing everywhere.
const EDITORIAL_FLAG_TYPES = new Set<MaterialContentType>([
  'article',
  'guide',
  'flipper',
  'interview',
  'visual-story',
]);

interface MaterialItem {
  id: string;
  contentType: MaterialContentType;
  href: string;
  title: string;
  imageUrl: string | null;
  authorId: string | null;
  authorName: string;
  publishedAt: unknown;
  tags: string[];
  isHotContent: boolean;
  isNotebookContent: boolean;
  isMaagChoice: boolean;
  // Only populated for contentType 'event' — needed to pick and render the
  // single featured event card on /tag/[tag].
  startDate?: unknown;
  endDate?: unknown;
  dateType?: 'single' | 'duration';
}

const toMaterialItem = (
  doc: FirebaseFirestore.QueryDocumentSnapshot,
  type: MaterialContentType,
): MaterialItem => {
  const data = doc.data();
  return {
    id: doc.id,
    contentType: type,
    href: getHref(type, doc.id),
    title: typeof data.title === 'string' ? data.title : '',
    imageUrl: getImageUrl(type, data),
    authorId: typeof data.authorId === 'string' ? data.authorId : null,
    authorName: '',
    publishedAt: data.publishedAt ?? null,
    tags: Array.isArray(data.tags) ? data.tags.filter((tag: unknown) => typeof tag === 'string') : [],
    isHotContent: type !== 'news' && (Boolean(data.isHotContent) || data.category === 'hotContent'),
    isNotebookContent: EDITORIAL_FLAG_TYPES.has(type) && Boolean(data.isNotebookContent),
    isMaagChoice: EDITORIAL_FLAG_TYPES.has(type) && Boolean(data.isMaagChoice),
    ...(type === 'event'
      ? {
          startDate: data.startDate ?? null,
          endDate: data.endDate ?? null,
          dateType: (data.dateType === 'duration' ? 'duration' : 'single') as 'single' | 'duration',
        }
      : {}),
  };
};

// Batch-resolves authorId -> "First Last" for a set of items in a single round trip per unique author.
const attachAuthorNames = async (items: MaterialItem[]): Promise<MaterialItem[]> => {
  const authorIds = Array.from(
    new Set(items.map((item) => item.authorId).filter((id): id is string => Boolean(id))),
  );
  if (authorIds.length === 0) return items;

  const authorDocs = await Promise.all(
    authorIds.map((authorId) => db.collection('authors').doc(authorId).get()),
  );
  const nameById = new Map<string, string>();
  authorDocs.forEach((doc) => {
    if (!doc.exists) return;
    const data = doc.data() as { firstName?: string; lastName?: string } | undefined;
    const name = [data?.firstName, data?.lastName].filter(Boolean).join(' ').trim();
    if (name) nameById.set(doc.id, name);
  });

  return items.map((item) => ({
    ...item,
    authorName: item.authorId ? (nameById.get(item.authorId) ?? '') : '',
  }));
};

const sortByPublishedAtDesc = (left: MaterialItem, right: MaterialItem) =>
  getTime(right.publishedAt) - getTime(left.publishedAt);

const startOfUtcDay = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
};

// /tag/[tag] has no per-tag editorial curation (unlike the landing page's
// "auto-nearest" event slot), so the single featured event is always picked
// automatically: the soonest event that hasn't ended yet. Falls back to null
// (aside just omits the event card) when every tagged event is in the past.
const pickFeaturedEvent = (events: MaterialItem[]): MaterialItem | null => {
  const today = startOfUtcDay(new Date());

  const upcoming = events
    .map((event) => {
      const start = toDate(event.startDate);
      if (!start) return null;
      const end = toDate(event.endDate) ?? start;
      return { event, startDay: startOfUtcDay(start), endDay: startOfUtcDay(end) };
    })
    .filter((entry): entry is { event: MaterialItem; startDay: Date; endDay: Date } => entry !== null)
    .filter((entry) => entry.endDay.getTime() >= today.getTime())
    .sort((left, right) => left.startDay.getTime() - right.startDay.getTime());

  return upcoming[0]?.event ?? null;
};

// isHotContent / isNotebookContent / isMaagChoice are the same 3 flags that
// drive the "самое читаемое" (culture), "записная книжка" (paris) and
// "Нетленка" (landing) rails — on the tag page they all feed the same aside,
// so a match on any one of them pulls the item out of the main list.
const isSidebarCard = (item: MaterialItem): boolean =>
  item.isHotContent || item.isNotebookContent || item.isMaagChoice;

const fetchTaggedItems = async (
  type: MaterialContentType,
  tag: string,
): Promise<MaterialItem[]> => {
  // array-contains + a single equality filter needs no composite index in Firestore.
  const snapshot = await db
    .collection(COLLECTION_BY_TYPE[type])
    .where('tags', 'array-contains', tag)
    .where('published', '==', true)
    .get();

  return snapshot.docs.map((doc) => toMaterialItem(doc, type));
};

const fetchAuthoredItems = async (
  type: MaterialContentType,
  authorId: string,
): Promise<MaterialItem[]> => {
  const snapshot = await db
    .collection(COLLECTION_BY_TYPE[type])
    .where('authorId', '==', authorId)
    .where('published', '==', true)
    .get();

  return snapshot.docs.map((doc) => toMaterialItem(doc, type));
};

/**
 * @description Get all published materials tagged with a given tag, grouped by content type
 * @route GET /api/public/materials-by-tag
 */
export const getMaterialsByTag = async (req: Request, res: Response) => {
  try {
    const tag = typeof req.query.tag === 'string' ? req.query.tag.trim() : '';
    if (!tag) {
      return res.status(400).json({ message: 'Query param "tag" is required' });
    }

    const itemsByTypeArrays = await Promise.all(
      TYPE_ORDER.map((type) => fetchTaggedItems(type, tag)),
    );
    const allItems = await attachAuthorNames(itemsByTypeArrays.flat());

    // Events never appear in the main list — only the single featured one,
    // in the aside — so they're excluded from group-building entirely.
    const featuredEvent = pickFeaturedEvent(allItems.filter((item) => item.contentType === 'event'));

    // Anything flagged for one of the 3 editorial rails also moves out of
    // the main list and into the aside, as a card, instead of a row.
    const sidebarCards = allItems.filter((item) => item.contentType !== 'event' && isSidebarCard(item));
    const sidebarCardKeys = new Set(sidebarCards.map((item) => `${item.contentType}:${item.id}`));

    const listableItems = allItems.filter(
      (item) => item.contentType !== 'event' && !sidebarCardKeys.has(`${item.contentType}:${item.id}`),
    );

    const itemsByType = new Map<MaterialContentType, MaterialItem[]>();
    listableItems.forEach((item) => {
      const list = itemsByType.get(item.contentType) ?? [];
      list.push(item);
      itemsByType.set(item.contentType, list);
    });

    const groups = TYPE_ORDER.filter((type) => type !== 'event').map((type) => {
      const items = (itemsByType.get(type) ?? []).sort(sortByPublishedAtDesc);
      if (items.length === 0) return null;

      const pageParam = PAGE_PARAM_BY_TYPE[type];
      const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
      const page = Math.min(parsePage(req.query[pageParam]), totalPages);
      const start = (page - 1) * PAGE_SIZE;

      return {
        contentType: type,
        label: TYPE_LABELS[type],
        count: items.length,
        page,
        totalPages,
        pageParam,
        items: items.slice(start, start + PAGE_SIZE),
      };
    }).filter((group): group is NonNullable<typeof group> => group !== null);

    res.status(200).json({
      tag,
      totalCount: allItems.length,
      groups,
      featuredEvent,
      sidebarCards,
    });
  } catch (error) {
    console.error('Error getting materials by tag:', error);
    res.status(500).json({ message: 'Server error while getting materials by tag' });
  }
};

/**
 * @description Get all published materials by a given author, grouped by content type
 * @route GET /api/public/materials-by-author
 */
export const getMaterialsByAuthor = async (req: Request, res: Response) => {
  try {
    const authorId = typeof req.query.authorId === 'string' ? req.query.authorId.trim() : '';
    if (!authorId) {
      return res.status(400).json({ message: 'Query param "authorId" is required' });
    }

    const authorDoc = await db.collection('authors').doc(authorId).get();
    if (!authorDoc.exists) {
      return res.status(404).json({ message: 'Author not found' });
    }
    const authorData = authorDoc.data() as {
      firstName?: string;
      lastName?: string;
      avatar?: string;
      bio?: string;
      socialLinks?: {
        instagram?: string;
        linkedin?: string;
        facebook?: string;
        telegram?: string;
        site?: string;
      };
    };

    const itemsByTypeArrays = await Promise.all(
      AUTHOR_TYPE_ORDER.map((type) => fetchAuthoredItems(type, authorId)),
    );
    const allItems = await attachAuthorNames(itemsByTypeArrays.flat());

    const itemsByType = new Map<MaterialContentType, MaterialItem[]>();
    allItems.forEach((item) => {
      const list = itemsByType.get(item.contentType) ?? [];
      list.push(item);
      itemsByType.set(item.contentType, list);
    });

    const groups = AUTHOR_TYPE_ORDER.map((type) => {
      const items = (itemsByType.get(type) ?? []).sort(sortByPublishedAtDesc);
      if (items.length === 0) return null;

      const pageParam = PAGE_PARAM_BY_TYPE[type];
      const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
      const page = Math.min(parsePage(req.query[pageParam]), totalPages);
      const start = (page - 1) * PAGE_SIZE;

      return {
        contentType: type,
        label: TYPE_LABELS[type],
        count: items.length,
        page,
        totalPages,
        pageParam,
        items: items.slice(start, start + PAGE_SIZE),
      };
    }).filter((group): group is NonNullable<typeof group> => group !== null);

    res.status(200).json({
      author: {
        id: authorDoc.id,
        firstName: authorData?.firstName ?? '',
        lastName: authorData?.lastName ?? '',
        avatar: authorData?.avatar ?? '',
        bio: authorData?.bio ?? '',
        socialLinks: authorData?.socialLinks ?? {},
      },
      totalCount: allItems.length,
      groups,
    });
  } catch (error) {
    console.error('Error getting materials by author:', error);
    res.status(500).json({ message: 'Server error while getting materials by author' });
  }
};

const buildFlatListingResponse = async (type: 'news' | 'interview', req: Request) => {
  const snapshot = await db
    .collection(COLLECTION_BY_TYPE[type])
    .where('published', '==', true)
    .get();

  const items = snapshot.docs
    .map((doc) => toMaterialItem(doc, type))
    .sort(sortByPublishedAtDesc);
  const itemsWithAuthors = await attachAuthorNames(items);

  const totalPages = Math.max(1, Math.ceil(itemsWithAuthors.length / PAGE_SIZE));
  const page = Math.min(parsePage(req.query.page), totalPages);
  const start = (page - 1) * PAGE_SIZE;

  return {
    label: TYPE_LABELS[type],
    count: itemsWithAuthors.length,
    page,
    totalPages,
    items: itemsWithAuthors.slice(start, start + PAGE_SIZE),
  };
};

/**
 * @description Get all published news, paginated
 * @route GET /api/public/news
 */
export const getPublicNews = async (req: Request, res: Response) => {
  try {
    res.status(200).json(await buildFlatListingResponse('news', req));
  } catch (error) {
    console.error('Error getting public news listing:', error);
    res.status(500).json({ message: 'Server error while getting public news listing' });
  }
};

/**
 * @description Get all published interviews, paginated
 * @route GET /api/public/interviews
 */
export const getPublicInterviews = async (req: Request, res: Response) => {
  try {
    res.status(200).json(await buildFlatListingResponse('interview', req));
  } catch (error) {
    console.error('Error getting public interviews listing:', error);
    res.status(500).json({ message: 'Server error while getting public interviews listing' });
  }
};
