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
  'visual-story': 'Visual Story',
};

// Order in which sections appear on the /tag/[tag] page, mirrors profileLogic.ts's BOOKMARK_TYPE_ORDER.
const TYPE_ORDER: MaterialContentType[] = [
  'article',
  'news',
  'guide',
  'event',
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

    const itemsByType = new Map<MaterialContentType, MaterialItem[]>();
    allItems.forEach((item) => {
      const list = itemsByType.get(item.contentType) ?? [];
      list.push(item);
      itemsByType.set(item.contentType, list);
    });

    const groups = TYPE_ORDER.map((type) => {
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
    });
  } catch (error) {
    console.error('Error getting materials by tag:', error);
    res.status(500).json({ message: 'Server error while getting materials by tag' });
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
