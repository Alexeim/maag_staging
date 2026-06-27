import { Request, Response } from 'express';
import { getDb } from '../services/firebase';
import { getCalendarToday } from '../utils/calendarDate';

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
const culturePagePlacementsRef = db.collection('editorialPlacements').doc('culturePage');
const parisPagePlacementsRef = db.collection('editorialPlacements').doc('parisPage');
const calendarPagePlacementsRef = db.collection('editorialPlacements').doc('calendarPage');

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

const EDITORIAL_FLAG_CONTENT_TYPES: LandingContentType[] = [
  'article',
  'guide',
  'flipper',
  'interview',
  'visual-story',
];

const EDITORIAL_FLAG_CONTENT_TYPE_SET = new Set<LandingContentType>(
  EDITORIAL_FLAG_CONTENT_TYPES,
);

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
const isPublished = (data: any) => data?.published === true;

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
  if (!isPublished(data)) return null;

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
    published: Boolean(data.published),
    publishedAt: data.publishedAt ?? null,
    isHotContent:
      type !== 'news' &&
      (Boolean(data.isHotContent) || data.category === 'hotContent'),
    isNotebookContent:
      EDITORIAL_FLAG_CONTENT_TYPE_SET.has(type) && Boolean(data.isNotebookContent),
    isMaagChoice:
      EDITORIAL_FLAG_CONTENT_TYPE_SET.has(type) && Boolean(data.isMaagChoice),
    isMainInCategory: Boolean(data.isMainInCategory),
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
    .limit(Math.max(limit * 3, 10))
    .get();

  return snapshot.docs
    .map((doc) => toLandingItem(doc, type))
    .filter(Boolean)
    .slice(0, limit);
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
    return (await fetchByTargets(Array.isArray(selection.items) ? selection.items : []))
      .filter((item: any) => !item.isHotContent && !item.isMaagChoice);
  }

  const limit = selection.limit ?? 3;
  const candidates = await fetchLatestFromTypes(CATEGORY_CONTENT_TYPES, 24);
  return candidates
    .filter((item: any) => normalizeCategory(item?.category) === category)
    .filter((item: any) => !item.isHotContent && !item.isMaagChoice && !isLeSaviezVousItem(item) && !excludedIds.has(item.id))
    .slice(0, limit);
};

const selectNetlenkaItems = async (selection: any, excludedKeys: Set<string>) => {
  if (!selection) return [];
  if (selection.mode === 'manual') {
    return (await fetchByTargets(Array.isArray(selection.items) ? selection.items : []))
      .filter((item: any) => item.isMaagChoice)
      .filter((item: any) => !excludedKeys.has(`${item.type}:${item.id}`));
  }

  const limit = selection.limit ?? 4;
  const candidates = await fetchLatestFromTypes(LANDING_CONTENT_TYPES, 24);
  return candidates
    .filter((item: any) => item.isMaagChoice)
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
  const today = getCalendarToday();
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

const isLandingPrimaryExcluded = (item: any) =>
  Boolean(item?.isHotContent) || Boolean(item?.isMaagChoice);

const fetchLandingPrimaryTarget = async (target: LandingTarget | null) => {
  const item = await fetchByTarget(target);
  return item && !isLandingPrimaryExcluded(item) ? item : null;
};

const selectLatestInterview = async (selection: any) => {
  if (!selection) return null;
  if (selection.mode === 'manual') {
    return fetchLandingPrimaryTarget({ type: 'interview', id: selection.id });
  }
  const candidates = await fetchLatest('interview', 24);
  return candidates.find((item: any) => !isLandingPrimaryExcluded(item)) ?? null;
};

const selectLeSaviezVous = async (selection: any) => {
  if (!selection) return null;
  if (selection.mode === 'manual') {
    const article = await fetchByTarget({ type: 'article', id: selection.id });
    return article && !isLandingPrimaryExcluded(article)
      ? { ...article, articleType: 'le_saviez_vous' }
      : null;
  }

  const candidates = await fetchLatest('article', 50);
  return (
    candidates.find(
      (item: any) =>
        item.articleType === 'le_saviez_vous' && !isLandingPrimaryExcluded(item),
    ) ??
    candidates.find(
      (item: any) =>
        item.category === 'le_saviez_vous' && !isLandingPrimaryExcluded(item),
    ) ??
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

const DEFAULT_CULTURE_PAGE_PLACEMENTS = {
  schemaVersion: 1,
  hero: null,
  secondaryStories: { mode: 'auto-latest', limit: 4 },
  featuredInterview: { mode: 'auto-latest' },
  sidebarRail: { mode: 'auto-hot', limit: 4 },
};

const DEFAULT_PARIS_PAGE_PLACEMENTS = {
  schemaVersion: 1,
  hero: null,
  secondaryStories: { mode: 'auto-latest', limit: 4 },
  leSaviezVousFeature: { mode: 'auto-latest' },
  sidebarRail: { mode: 'auto-hot', limit: 4 },
};

const DEFAULT_CALENDAR_PAGE_PLACEMENTS = {
  schemaVersion: 1,
  mainCards: null,
  secondaryCards: null,
  updatedAt: null,
  updatedBy: null,
};

const SECTION_FETCH_LIMIT_PER_TYPE = 80;
const SECTION_CONTENT_TYPES: LandingContentType[] = [
  'article',
  'guide',
  'flipper',
  'visual-story',
  'news',
];

const PARIS_PAGE_CONTENT_TYPES = Array.from(
  new Set([...SECTION_CONTENT_TYPES, ...EDITORIAL_FLAG_CONTENT_TYPES]),
);

const normalizeSectionItem = (item: any, category: 'culture' | 'paris') => {
  if (!item) return null;
  if (category === 'culture' && item.contentType === 'interview') {
    return { ...item, category: 'culture' };
  }
  return item;
};

const normalizeSectionCandidates = (
  items: any[],
  category: 'culture' | 'paris',
) =>
  items
    .map((item) => normalizeSectionItem(item, category))
    .filter(Boolean)
    .filter((item: any) => !isLeSaviezVousItem(item))
    .filter((item: any) => normalizeCategory(item.category) === category)
    .sort(
      (left: any, right: any) =>
        getTime(right?.createdAt) - getTime(left?.createdAt),
    );

const isMainInCategoryItem = (item: any) =>
  item?.isMainInCategory === true ||
  item?.isMainInCategory === 'true' ||
  item?.isMainInCategory === 1 ||
  item?.isMainInCategory === '1';

const fetchSectionCandidates = async (category: 'culture' | 'paris') => {
  const types =
    category === 'culture'
      ? [...SECTION_CONTENT_TYPES, 'interview' as LandingContentType]
      : SECTION_CONTENT_TYPES;

  const groups = await Promise.all(
    types.map((type) => fetchLatest(type, SECTION_FETCH_LIMIT_PER_TYPE)),
  );

  return normalizeSectionCandidates(groups.flat(), category);
};

const hasAnyFlag = (item: any, flags: string[]) =>
  flags.some((flag) => Boolean(item?.[flag]));

const fetchSectionHero = async (
  selection: any,
  candidates: any[],
  excludedFlags: string[],
) => {
  if (selection?.mode === 'manual') {
    const item = await fetchByTarget({ type: selection.type, id: selection.id });
    return item && !hasAnyFlag(item, excludedFlags) ? item : null;
  }

  const topItems = candidates.filter(
    (item) => !hasAnyFlag(item, excludedFlags) && item.contentType !== 'interview',
  );
  return topItems.find(isMainInCategoryItem) ?? topItems[0] ?? null;
};

const selectSectionSecondaryStories = async (
  selection: any,
  candidates: any[],
  primaryItem: any,
  excludedFlags: string[],
) => {
  const topItems = candidates.filter(
    (item) => !hasAnyFlag(item, excludedFlags) && item.contentType !== 'interview',
  );
  const topWithoutPrimary = topItems.filter((item) =>
    primaryItem ? item.id !== primaryItem.id : true,
  );

  if (selection === null) return [];
  if (selection?.mode === 'manual') {
    return (await fetchByTargets(Array.isArray(selection.items) ? selection.items : []))
      .filter((item: any) => item && !hasAnyFlag(item, excludedFlags) && item.contentType !== 'interview');
  }

  return topWithoutPrimary.slice(0, selection?.limit ?? 4);
};

const selectSectionSidebarItems = async (
  selection: any,
  candidates: any[],
  excludedIds: Set<string>,
  flag: 'isHotContent' | 'isNotebookContent' = 'isHotContent',
) => {
  if (selection?.mode === 'manual') {
    const items = await fetchByTargets(
      Array.isArray(selection.items) ? selection.items : [],
    );
    return items.filter((item: any) => item[flag]);
  }

  return candidates
    .filter((item: any) => item[flag] && !excludedIds.has(item.id))
    .slice(0, selection?.limit ?? 4);
};

const selectSectionFeaturedInterview = async (
  selection: any,
  candidates: any[],
  excludedIds: Set<string>,
  excludedFlags: string[],
) => {
  if (selection?.mode === 'manual') {
    const item = await fetchByTarget({ type: 'interview', id: selection.id });
    return item && !hasAnyFlag(item, excludedFlags) ? item : null;
  }

  if (!selection || selection.mode === 'auto-latest') {
    return (
      candidates.find(
        (item: any) =>
          item.contentType === 'interview' &&
          !hasAnyFlag(item, excludedFlags) &&
          !excludedIds.has(item.id),
      ) ??
      candidates.find(
        (item: any) =>
          item.contentType === 'interview' && !hasAnyFlag(item, excludedFlags),
      ) ??
      null
    );
  }

  return null;
};

const buildCulturePagePayload = async () => {
  const [placementsDoc, candidates] = await Promise.all([
    culturePagePlacementsRef.get(),
    fetchSectionCandidates('culture'),
  ]);
  const culturePagePlacements = {
    ...DEFAULT_CULTURE_PAGE_PLACEMENTS,
    ...(placementsDoc.exists ? placementsDoc.data() : {}),
  };

  const primaryCultureArticle = await fetchSectionHero(
    culturePagePlacements.hero,
    candidates,
    ['isHotContent'],
  );
  const secondaryStories = await selectSectionSecondaryStories(
    culturePagePlacements.secondaryStories,
    candidates,
    primaryCultureArticle,
    ['isHotContent'],
  );
  const topIds = new Set(
    [primaryCultureArticle?.id, ...secondaryStories.map((item: any) => item?.id)].filter(Boolean),
  );
  const featuredInterview = await selectSectionFeaturedInterview(
    culturePagePlacements.featuredInterview,
    candidates,
    topIds,
    ['isHotContent'],
  );
  const excludedIds = new Set([...topIds, featuredInterview?.id].filter(Boolean));
  const editorialSidebarItems = await selectSectionSidebarItems(
    culturePagePlacements.sidebarRail,
    candidates,
    excludedIds,
  );
  const sidebarIds = new Set(editorialSidebarItems.map((item: any) => item.id));
  const cultureFeed = candidates.filter(
    (item: any) =>
      !excludedIds.has(item.id) &&
      !sidebarIds.has(item.id) &&
      !item.isHotContent,
  );

  return {
    culturePagePlacements,
    primaryCultureArticle,
    secondaryStories,
    editorialSidebarItems,
    cultureFeed,
    featuredInterview,
  };
};

const buildParisPagePayload = async () => {
  const [placementsDoc, allCandidates] = await Promise.all([
    parisPagePlacementsRef.get(),
    fetchLatestFromTypes(PARIS_PAGE_CONTENT_TYPES, SECTION_FETCH_LIMIT_PER_TYPE),
  ]);
  const candidates = normalizeSectionCandidates(allCandidates, 'paris');
  const notebookCandidates = allCandidates.filter(
    (item: any) => item.isNotebookContent,
  );
  const parisPagePlacements = {
    ...DEFAULT_PARIS_PAGE_PLACEMENTS,
    ...(placementsDoc.exists ? placementsDoc.data() : {}),
  };

  const primaryParisArticle = await fetchSectionHero(
    parisPagePlacements.hero,
    candidates,
    ['isHotContent', 'isNotebookContent'],
  );
  const secondaryStories = await selectSectionSecondaryStories(
    parisPagePlacements.secondaryStories,
    candidates,
    primaryParisArticle,
    ['isHotContent', 'isNotebookContent'],
  );
  const topIds = new Set(
    [primaryParisArticle?.id, ...secondaryStories.map((item: any) => item?.id)].filter(Boolean),
  );
  const editorialSidebarItems = await selectSectionSidebarItems(
    parisPagePlacements.sidebarRail,
    notebookCandidates,
    topIds,
    'isNotebookContent',
  );
  const sidebarIds = new Set(editorialSidebarItems.map((item: any) => item.id));
  const parisFeed = candidates.filter(
    (item: any) =>
      !topIds.has(item.id) &&
      !sidebarIds.has(item.id) &&
      !item.isHotContent &&
      !item.isNotebookContent,
  );
  const photoOfTheDay = await selectPhotoOfTheDay({ mode: 'auto-latest' });

  return {
    parisPagePlacements,
    primaryParisArticle,
    secondaryStories,
    editorialSidebarItems,
    parisFeed,
    photoOfTheDay,
  };
};

const extractDescription = (blocks: any): string => {
  if (!Array.isArray(blocks)) return 'Подробнее скоро.';
  const blockWithText = blocks.find(
    (block) => typeof block?.text === 'string' && block.text.trim().length > 0,
  );
  if (!blockWithText) return 'Подробнее скоро.';
  const text = blockWithText.text.trim();
  return text.length > 180 ? `${text.slice(0, 177).trim()}...` : text;
};

const toPublicCalendarEvent = (doc: FirebaseFirestore.DocumentSnapshot) => {
  const data = doc.data();
  if (!doc.exists || !data) return null;
  if (!isPublished(data)) return null;
  const startDate = toDate(data.startDate);
  if (!startDate) return null;
  const endDate = toDate(data.endDate);
  startDate.setUTCHours(0, 0, 0, 0);
  if (endDate) endDate.setUTCHours(0, 0, 0, 0);

  const primaryTag = Array.isArray(data.tags) && data.tags.length > 0 ? data.tags[0] : null;

  return {
    id: doc.id,
    title: data.title ?? 'Событие',
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : null,
    startDate: startDate.toISOString(),
    endDate: endDate ? endDate.toISOString() : null,
    dateType: data.dateType === 'duration' ? 'duration' : 'single',
    address: typeof data.address === 'string' ? data.address : '',
    timeMode:
      data.timeMode === 'start' || data.timeMode === 'range' ? data.timeMode : 'none',
    startTime: typeof data.startTime === 'string' ? data.startTime : null,
    endTime: typeof data.endTime === 'string' ? data.endTime : null,
    category: typeof data.category === 'string' ? data.category : '',
    categoryLabel: primaryTag ?? 'Событие',
    tagLabel: primaryTag ?? 'Событие',
    description: extractDescription(data.content),
    isMainEvent: Boolean(data.isMainEvent),
    url: `/events/${doc.id}`,
  };
};

const fetchCalendarEvents = async () => {
  const snapshot = await db.collection('events').orderBy('startDate', 'desc').get();
  return snapshot.docs
    .map(toPublicCalendarEvent)
    .filter(Boolean)
    .sort(
      (left: any, right: any) =>
        new Date(left.startDate).getTime() - new Date(right.startDate).getTime(),
    );
};

const getComparableCalendarRange = (event: any) => {
  const start = toDate(event?.startDate);
  if (!start) return null;
  const end = toDate(event?.endDate) ?? start;
  return {
    start: resetToUtcMidnight(start),
    end: resetToUtcMidnight(end),
  };
};

const getWeekBounds = (today: Date) => {
  const weekStart = resetToUtcMidnight(today);
  const day = weekStart.getUTCDay();
  weekStart.setUTCDate(weekStart.getUTCDate() - ((day + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
};

const resolveLastChanceEventIds = (events: any[], limit = 4) => {
  const today = getCalendarToday();
  const cutoff = new Date(today);
  cutoff.setUTCDate(today.getUTCDate() + 7);
  cutoff.setUTCHours(23, 59, 59, 999);

  return events
    .filter((event) => {
      const range = getComparableCalendarRange(event);
      if (!range) return false;
      return range.end.getTime() >= today.getTime() && range.end.getTime() <= cutoff.getTime();
    })
    .sort((left, right) => {
      const leftEnd = getComparableCalendarRange(left)?.end.getTime() ?? 0;
      const rightEnd = getComparableCalendarRange(right)?.end.getTime() ?? 0;
      return leftEnd - rightEnd;
    })
    .slice(0, limit)
    .map((event) => event.id);
};

const resolveAutoSecondaryEventIds = (events: any[], limit = 4) => {
  const today = getCalendarToday();
  const { weekStart, weekEnd } = getWeekBounds(today);
  const currentWeekSingleDay: any[] = [];
  const currentWeekDuration: any[] = [];
  const upcomingSingleDay: any[] = [];
  const upcomingDuration: any[] = [];

  events.forEach((event) => {
    const range = getComparableCalendarRange(event);
    if (!range) return;
    const { start, end } = range;
    const isSingleDay = start.getTime() === end.getTime();

    if (start.getTime() <= weekEnd.getTime() && end.getTime() >= weekStart.getTime()) {
      if (isSingleDay) currentWeekSingleDay.push(event);
      else currentWeekDuration.push(event);
      return;
    }

    if (start.getTime() > weekEnd.getTime()) {
      if (isSingleDay) upcomingSingleDay.push(event);
      else upcomingDuration.push(event);
    }
  });

  const byStartDateAsc = (left: any, right: any) =>
    new Date(left.startDate).getTime() - new Date(right.startDate).getTime();

  return [
    ...currentWeekSingleDay.sort(byStartDateAsc),
    ...currentWeekDuration.sort(byStartDateAsc),
    ...upcomingSingleDay.sort(byStartDateAsc),
    ...upcomingDuration.sort(byStartDateAsc),
  ]
    .slice(0, limit)
    .map((event) => event.id);
};

const buildCalendarPagePayload = async () => {
  const [placementsDoc, events] = await Promise.all([
    calendarPagePlacementsRef.get(),
    fetchCalendarEvents(),
  ]);
  const calendarPagePlacements: any = {
    ...DEFAULT_CALENDAR_PAGE_PLACEMENTS,
    ...(placementsDoc.exists ? placementsDoc.data() : {}),
  };
  const eventMap = new Map(events.map((event: any) => [event.id, event]));
  const resolveEventsByIds = (ids: string[] = []) =>
    ids.map((id) => eventMap.get(id)).filter(Boolean);

  const featuredEventCards =
    calendarPagePlacements.mainCards?.mode === 'manual'
      ? resolveEventsByIds(calendarPagePlacements.mainCards.ids).slice(0, 4)
      : [];

  const secondaryCardEvents =
    calendarPagePlacements.secondaryCards?.mode === 'manual'
      ? resolveEventsByIds(calendarPagePlacements.secondaryCards.ids).slice(0, 4)
      : calendarPagePlacements.secondaryCards?.mode ===
          'auto-current-week-single-day-priority'
        ? resolveAutoSecondaryEventIds(
            events,
            calendarPagePlacements.secondaryCards.limit ?? 4,
          )
            .map((id) => eventMap.get(id))
            .filter(Boolean)
        : [];

  const lastChanceCards = resolveLastChanceEventIds(events)
    .map((id) => eventMap.get(id))
    .filter(Boolean);

  return {
    calendarPagePlacements,
    events,
    featuredEventCards,
    topCards: secondaryCardEvents,
    lastChanceCards,
  };
};

export const getPublicLanding = async (_req: Request, res: Response) => {
  try {
    const landingPlacements: any = await getLandingPlacements();
    const mainHeroSelection = landingPlacements.mainHero;
    const mainArticle = mainHeroSelection
      ? await fetchLandingPrimaryTarget({
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
        ? fetchLandingPrimaryTarget({
            type: landingPlacements.cultureHero.type,
            id: landingPlacements.cultureHero.id,
          })
        : null,
      landingPlacements.parisHero
        ? fetchLandingPrimaryTarget({
            type: landingPlacements.parisHero.type,
            id: landingPlacements.parisHero.id,
          })
        : null,
    ]);

    const [cultureCardItems, parisCardItems, maagChoiceItems, leSaviezVousArticle, photoOfTheDay] =
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
        ...maagChoiceItems.map((item: any) => item?.id),
        leSaviezVousArticle?.id,
      ].filter(Boolean),
    );

    const carouselItems = (await fetchLatestFromTypes(CATEGORY_CONTENT_TYPES, 24))
      .filter(
        (item: any) =>
          !item.isHotContent &&
          !item.isMaagChoice &&
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
        maagChoiceItems,
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

export const getPublicCulture = async (_req: Request, res: Response) => {
  try {
    res.status(200).json(await buildCulturePagePayload());
  } catch (error) {
    console.error('Error getting public culture page:', error);
    res.status(500).json({ message: 'Server error while getting public culture page' });
  }
};

export const getPublicParis = async (_req: Request, res: Response) => {
  try {
    res.status(200).json(await buildParisPagePayload());
  } catch (error) {
    console.error('Error getting public paris page:', error);
    res.status(500).json({ message: 'Server error while getting public paris page' });
  }
};

export const getPublicCalendar = async (_req: Request, res: Response) => {
  try {
    res.status(200).json(await buildCalendarPagePayload());
  } catch (error) {
    console.error('Error getting public calendar page:', error);
    res.status(500).json({ message: 'Server error while getting public calendar page' });
  }
};
