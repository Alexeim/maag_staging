import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

type LandingContentType =
  | 'article'
  | 'guide'
  | 'interview'
  | 'flipper'
  | 'visual-story'
  | 'news'
  | 'event'
  | 'photo-of-the-day';

interface LandingTarget {
  type: LandingContentType;
  id: string;
}

const db = getDb();
const landingPlacementsRef = db.collection('editorialPlacements').doc('landing');

const COLLECTION_BY_TYPE: Record<LandingContentType, string> = {
  article: 'articles',
  guide: 'guides',
  interview: 'interviews',
  flipper: 'flippers',
  'visual-story': 'visual-stories',
  news: 'news',
  event: 'events',
  'photo-of-the-day': 'photosOfTheDay',
};

const LANDING_CONTENT_TYPES: LandingContentType[] = [
  'article',
  'guide',
  'interview',
  'flipper',
  'visual-story',
];

const CATEGORY_CONTENT_TYPES: LandingContentType[] = [
  'article',
  'guide',
  'flipper',
  'visual-story',
];

const DEFAULT_LANDING_PLACEMENTS = {
  mainHero: null,
  newsRail: { mode: 'auto-latest', limit: 4 },
  netlenkaRail: { mode: 'auto-latest', limit: 4 },
  cultureHero: null,
  cultureCards: { mode: 'auto-latest', limit: 3 },
  parisHero: null,
  parisCards: { mode: 'auto-latest', limit: 3 },
  eventCard: { mode: 'auto-nearest' },
  cultureInterviewBlock: { mode: 'auto-latest' },
  leSaviezVousFeature: { mode: 'auto-latest' },
  photoOfTheDayFeature: { mode: 'auto-latest' },
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

const normalizeCategory = (value?: string): string => {
  if (!value) return '';
  const normalized = value.trim();
  return normalized === 'hotContent' ? '' : normalized.toLowerCase();
};

const isLeSaviezVousItem = (item: any) => item?.articleType === 'le_saviez_vous';

const getHref = (type: LandingContentType, id: string): string => {
  if (type === 'interview') return `/interviews/${id}`;
  if (type === 'flipper') return `/flippers/${id}`;
  if (type === 'guide') return `/guide/${id}`;
  if (type === 'visual-story') return `/visual-story/${id}`;
  if (type === 'news') return `/news/${id}`;
  if (type === 'event') return `/events/${id}`;
  if (type === 'photo-of-the-day') return `/photo-of-the-day/${id}`;
  return `/article/${id}`;
};

const getImageUrl = (type: LandingContentType, data: any): string | null => {
  if (type === 'flipper') return data.carouselContent?.[0]?.imageUrl ?? data.imageUrl ?? null;
  if (type === 'visual-story') return data.imageUrl ?? data.slides?.[0]?.imageUrl ?? null;
  return data.imageUrl ?? null;
};

const toLandingItem = (
  doc: FirebaseFirestore.DocumentSnapshot,
  type: LandingContentType,
) => {
  const data = doc.data();
  if (!doc.exists || !data) return null;

  return {
    id: doc.id,
    type,
    contentType: type,
    href: getHref(type, doc.id),
    title: data.title ?? '',
    lead: data.lead ?? '',
    cardLead: data.cardLead ?? '',
    imageUrl: getImageUrl(type, data),
    category: data.category ?? '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    isHotContent: Boolean(data.isHotContent) || data.category === 'hotContent',
    isNews: type === 'news',
    articleType: data.articleType ?? null,
    paid: Boolean(data.paid),
    mainQuote: data.mainQuote ?? null,
    interviewee: data.interviewee ?? null,
    content: type === 'interview' ? data.content ?? [] : undefined,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    dateType: data.dateType ?? null,
    caption: data.caption ?? '',
  };
};

const fetchByTarget = async (target: LandingTarget | null) => {
  if (!target?.id || !COLLECTION_BY_TYPE[target.type]) return null;
  const doc = await db.collection(COLLECTION_BY_TYPE[target.type]).doc(target.id).get();
  return toLandingItem(doc, target.type);
};

const fetchByTargets = async (targets: LandingTarget[]) => {
  const items = await Promise.all(targets.map(fetchByTarget));
  return items.filter(Boolean);
};

const fetchLatest = async (type: LandingContentType, limit: number) => {
  const snapshot = await db
    .collection(COLLECTION_BY_TYPE[type])
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => toLandingItem(doc, type))
    .filter(Boolean);
};

const fetchLatestFromTypes = async (
  types: LandingContentType[],
  perTypeLimit: number,
) => {
  const groups = await Promise.all(types.map((type) => fetchLatest(type, perTypeLimit)));
  return groups
    .flat()
    .sort((left, right) => getTime(right?.createdAt) - getTime(left?.createdAt));
};

const selectNewsRail = async (selection: any) => {
  if (!selection) return [];
  if (selection.mode === 'manual') {
    return fetchByTargets(
      (Array.isArray(selection.ids) ? selection.ids : []).map((id: string) => ({
        type: 'news',
        id,
      })),
    );
  }
  return fetchLatest('news', selection.limit ?? 4);
};

const selectCategoryItems = async (
  category: 'culture' | 'paris',
  selection: any,
  excludedIds: Set<string>,
) => {
  if (!selection) return [];
  if (selection.mode === 'manual') {
    return fetchByTargets(Array.isArray(selection.items) ? selection.items : []);
  }

  const limit = selection.limit ?? 3;
  const candidates = await fetchLatestFromTypes(CATEGORY_CONTENT_TYPES, 24);
  return candidates
    .filter((item: any) => normalizeCategory(item?.category) === category)
    .filter((item: any) => !item.isHotContent && !isLeSaviezVousItem(item) && !excludedIds.has(item.id))
    .slice(0, limit);
};

const selectNetlenkaItems = async (selection: any, excludedKeys: Set<string>) => {
  if (!selection) return [];
  if (selection.mode === 'manual') {
    return (await fetchByTargets(Array.isArray(selection.items) ? selection.items : []))
      .filter((item: any) => item.isHotContent)
      .filter((item: any) => !excludedKeys.has(`${item.type}:${item.id}`));
  }

  const limit = selection.limit ?? 4;
  const candidates = await fetchLatestFromTypes(LANDING_CONTENT_TYPES, 24);
  return candidates
    .filter((item: any) => item.isHotContent)
    .filter((item: any) => !excludedKeys.has(`${item.type}:${item.id}`))
    .slice(0, limit);
};

const resetToUtcMidnight = (date: Date) => {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
};

const normalizeEvents = (events: any[]) =>
  events
    .map((event) => {
      const startDate = toDate(event?.startDate);
      const endDate = toDate(event?.endDate);
      if (!startDate) return null;
      return {
        ...event,
        startDate,
        endDate,
        startDay: resetToUtcMidnight(startDate),
        endDay: resetToUtcMidnight(endDate ?? startDate),
      };
    })
    .filter(Boolean);

const isSingleDayEvent = (event: any) =>
  event.startDay.getTime() === event.endDay.getTime();

const sortByCreatedAtDesc = (left: any, right: any) =>
  getTime(right?.createdAt) - getTime(left?.createdAt);

const selectAutoLandingEvent = async () => {
  const events = await fetchLatest('event', 100);
  const today = resetToUtcMidnight(new Date());
  const normalizedEvents = normalizeEvents(events);

  const singleDayEventsForToday = normalizedEvents
    .filter(
      (event: any) =>
        isSingleDayEvent(event) && event.startDay.getTime() === today.getTime(),
    )
    .sort(sortByCreatedAtDesc);

  if (singleDayEventsForToday[0]) return singleDayEventsForToday[0];

  const activeRangeEvents = normalizedEvents
    .filter(
      (event: any) =>
        !isSingleDayEvent(event) &&
        event.startDay.getTime() <= today.getTime() &&
        event.endDay.getTime() >= today.getTime(),
    )
    .sort(sortByCreatedAtDesc);

  if (activeRangeEvents[0]) return activeRangeEvents[0];

  return (
    normalizedEvents
      .filter((event: any) => event.endDay.getTime() >= today.getTime())
      .sort((left: any, right: any) => left.startDay.getTime() - right.startDay.getTime())[0] ??
    null
  );
};

const selectEventCard = async (selection: any) => {
  if (!selection) return null;
  if (selection.mode === 'manual') {
    return fetchByTarget({ type: 'event', id: selection.id });
  }
  return selectAutoLandingEvent();
};

const selectLatestInterview = async (selection: any) => {
  if (!selection) return null;
  if (selection.mode === 'manual') {
    return fetchByTarget({ type: 'interview', id: selection.id });
  }
  const [latest] = await fetchLatest('interview', 1);
  return latest ?? null;
};

const selectLeSaviezVous = async (selection: any) => {
  if (!selection) return null;
  if (selection.mode === 'manual') {
    const article = await fetchByTarget({ type: 'article', id: selection.id });
    return article ? { ...article, articleType: 'le_saviez_vous' } : null;
  }

  const candidates = await fetchLatest('article', 50);
  return (
    candidates.find((item: any) => item.articleType === 'le_saviez_vous') ??
    candidates.find((item: any) => item.category === 'le_saviez_vous') ??
    null
  );
};

const selectPhotoOfTheDay = async (selection: any) => {
  if (!selection) return null;
  if (selection.mode === 'manual') {
    return fetchByTarget({ type: 'photo-of-the-day', id: selection.id });
  }
  const [latest] = await fetchLatest('photo-of-the-day', 1);
  return latest ?? null;
};

const getLandingPlacements = async () => {
  const doc = await landingPlacementsRef.get();
  return {
    ...DEFAULT_LANDING_PLACEMENTS,
    ...(doc.exists ? doc.data() : {}),
  };
};

export const getPublicLanding = async (_req: Request, res: Response) => {
  try {
    const landingPlacements: any = await getLandingPlacements();
    const mainHeroSelection = landingPlacements.mainHero;
    const mainArticle = mainHeroSelection
      ? await fetchByTarget({
          type: mainHeroSelection.type,
          id: mainHeroSelection.id,
        })
      : null;

    const [newsArticles, landingEvent, latestInterview] = await Promise.all([
      selectNewsRail(landingPlacements.newsRail),
      selectEventCard(landingPlacements.eventCard),
      selectLatestInterview(landingPlacements.cultureInterviewBlock),
    ]);

    const mainHeroKey = mainArticle ? `${mainArticle.type}:${mainArticle.id}` : null;
    const latestInterviewKey = latestInterview
      ? `${latestInterview.type}:${latestInterview.id}`
      : null;

    const [cultureHero, parisHero] = await Promise.all([
      landingPlacements.cultureHero
        ? fetchByTarget({
            type: landingPlacements.cultureHero.type,
            id: landingPlacements.cultureHero.id,
          })
        : null,
      landingPlacements.parisHero
        ? fetchByTarget({
            type: landingPlacements.parisHero.type,
            id: landingPlacements.parisHero.id,
          })
        : null,
    ]);

    const [cultureCardItems, parisCardItems, hotContentItems, leSaviezVousArticle, photoOfTheDay] =
      await Promise.all([
        selectCategoryItems(
          'culture',
          landingPlacements.cultureCards,
          new Set([mainArticle?.id, cultureHero?.id].filter(Boolean) as string[]),
        ),
        selectCategoryItems(
          'paris',
          landingPlacements.parisCards,
          new Set([mainArticle?.id, parisHero?.id].filter(Boolean) as string[]),
        ),
        selectNetlenkaItems(
          landingPlacements.netlenkaRail,
          new Set([mainHeroKey, latestInterviewKey].filter(Boolean) as string[]),
        ),
        selectLeSaviezVous(landingPlacements.leSaviezVousFeature),
        selectPhotoOfTheDay(landingPlacements.photoOfTheDayFeature),
      ]);

    const displayedIds = new Set(
      [
        mainArticle?.id,
        cultureHero?.id,
        ...cultureCardItems.map((item: any) => item?.id),
        parisHero?.id,
        ...parisCardItems.map((item: any) => item?.id),
        latestInterview?.id,
        ...hotContentItems.map((item: any) => item?.id),
        leSaviezVousArticle?.id,
      ].filter(Boolean),
    );

    const carouselItems = (await fetchLatestFromTypes(CATEGORY_CONTENT_TYPES, 24))
      .filter(
        (item: any) =>
          !item.isHotContent &&
          !item.isNews &&
          !isLeSaviezVousItem(item) &&
          !displayedIds.has(item.id),
      )
      .slice(0, 20);

    res.status(200).json({
      landingPlacements,
      mainBlock: {
        mainArticle,
        newsArticles,
        landingEvent,
      },
      body: {
        landingPlacements,
        cultureHero,
        cultureCardItems,
        parisHero,
        parisCardItems,
        hotContentItems,
        latestInterview,
        carouselItems,
        leSaviezVousArticle,
        photoOfTheDay,
      },
    });
  } catch (error) {
    console.error('Error getting public landing:', error);
    res.status(500).json({ message: 'Server error while getting public landing' });
  }
};
