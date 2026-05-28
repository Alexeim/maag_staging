import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

export type LandingMainHeroType =
  | 'article'
  | 'guide'
  | 'interview'
  | 'flipper'
  | 'visual-story';

export interface LandingMainHeroSelection {
  mode: 'manual';
  type: LandingMainHeroType;
  id: string;
}

export interface LandingNewsRailAutoSelection {
  mode: 'auto-latest';
  limit: number;
}

export interface LandingNewsRailManualSelection {
  mode: 'manual';
  ids: string[];
}

export type LandingNewsRailSelection =
  | LandingNewsRailAutoSelection
  | LandingNewsRailManualSelection;

export type LandingNetlenkaItemType = LandingMainHeroType;

export interface LandingNetlenkaItemTarget {
  type: LandingNetlenkaItemType;
  id: string;
}

export interface LandingNetlenkaRailAutoSelection {
  mode: 'auto-latest';
  limit: number;
}

export interface LandingNetlenkaRailManualSelection {
  mode: 'manual';
  items: LandingNetlenkaItemTarget[];
}

export type LandingNetlenkaRailSelection =
  | LandingNetlenkaRailAutoSelection
  | LandingNetlenkaRailManualSelection;

export type LandingCategoryCardsItemType = Exclude<
  LandingMainHeroType,
  'interview'
>;

export interface LandingCategoryCardsItemTarget {
  type: LandingCategoryCardsItemType;
  id: string;
}

export interface LandingCategoryHeroSelection {
  mode: 'manual';
  type: LandingCategoryCardsItemType;
  id: string;
}

export interface LandingCategoryCardsAutoSelection {
  mode: 'auto-latest';
  limit: number;
}

export interface LandingCategoryCardsManualSelection {
  mode: 'manual';
  items: LandingCategoryCardsItemTarget[];
}

export type LandingCategoryCardsSelection =
  | LandingCategoryCardsAutoSelection
  | LandingCategoryCardsManualSelection;

export interface LandingEventCardAutoSelection {
  mode: 'auto-nearest';
}

export interface LandingEventCardManualSelection {
  mode: 'manual';
  id: string;
}

export type LandingEventCardSelection =
  | LandingEventCardAutoSelection
  | LandingEventCardManualSelection;

export interface LandingCultureInterviewAutoSelection {
  mode: 'auto-latest';
}

export interface LandingCultureInterviewManualSelection {
  mode: 'manual';
  id: string;
}

export type LandingCultureInterviewBlockSelection =
  | LandingCultureInterviewAutoSelection
  | LandingCultureInterviewManualSelection;

export interface CalendarPageManualCardsSelection {
  mode: 'manual';
  ids: string[];
}

export interface CalendarPageSecondaryCardsAutoSelection {
  mode: 'auto-current-week-single-day-priority';
  limit: number;
}

export type CalendarPageMainCardsSelection = CalendarPageManualCardsSelection;

export type CalendarPageSecondaryCardsSelection =
  | CalendarPageManualCardsSelection
  | CalendarPageSecondaryCardsAutoSelection;

export interface LandingPlacementsDocument {
  schemaVersion: 4;
  mainHero: LandingMainHeroSelection | null;
  newsRail: LandingNewsRailSelection | null;
  netlenkaRail: LandingNetlenkaRailSelection | null;
  cultureHero: LandingCategoryHeroSelection | null;
  cultureCards: LandingCategoryCardsSelection | null;
  parisHero: LandingCategoryHeroSelection | null;
  parisCards: LandingCategoryCardsSelection | null;
  eventCard: LandingEventCardSelection | null;
  cultureInterviewBlock: LandingCultureInterviewBlockSelection | null;
  leSaviezVousFeature: SectionPageLeSaviezVousSelection | null;
  updatedAt: Date | null;
  updatedBy: string | null;
}

export interface CalendarPagePlacementsDocument {
  schemaVersion: 1;
  mainCards: CalendarPageMainCardsSelection | null;
  secondaryCards: CalendarPageSecondaryCardsSelection | null;
  updatedAt: Date | null;
  updatedBy: string | null;
}

export type SectionPageHeroType = LandingMainHeroType;

export interface SectionPageHeroManualSelection {
  mode: 'manual';
  type: SectionPageHeroType;
  id: string;
}

export interface SectionPageSecondaryStoriesAutoSelection {
  mode: 'auto-latest';
  limit: number;
}

export interface SectionPageSecondaryItemTarget {
  type: SectionPageHeroType;
  id: string;
}

export interface SectionPageSecondaryStoriesManualSelection {
  mode: 'manual';
  items: SectionPageSecondaryItemTarget[];
}

export type SectionPageSecondaryStoriesSelection =
  | SectionPageSecondaryStoriesAutoSelection
  | SectionPageSecondaryStoriesManualSelection;

export interface SectionPageFeaturedInterviewAutoSelection {
  mode: 'auto-latest';
}

export interface SectionPageFeaturedInterviewManualSelection {
  mode: 'manual';
  id: string;
}

export type SectionPageFeaturedInterviewSelection =
  | SectionPageFeaturedInterviewAutoSelection
  | SectionPageFeaturedInterviewManualSelection;

export interface SectionPageSidebarRailAutoSelection {
  mode: 'auto-hot';
  limit: number;
}

export interface SectionPageSidebarRailManualSelection {
  mode: 'manual';
  items: SectionPageSecondaryItemTarget[];
}

export type SectionPageSidebarRailSelection =
  | SectionPageSidebarRailAutoSelection
  | SectionPageSidebarRailManualSelection;

export interface SectionPageLeSaviezVousAutoSelection {
  mode: 'auto-latest';
}

export interface SectionPageLeSaviezVousManualSelection {
  mode: 'manual';
  id: string;
}

export type SectionPageLeSaviezVousSelection =
  | SectionPageLeSaviezVousAutoSelection
  | SectionPageLeSaviezVousManualSelection;

export interface CulturePagePlacementsDocument {
  schemaVersion: 1;
  hero: SectionPageHeroManualSelection | null;
  secondaryStories: SectionPageSecondaryStoriesSelection | null;
  featuredInterview: SectionPageFeaturedInterviewSelection | null;
  sidebarRail: SectionPageSidebarRailSelection | null;
  updatedAt: Date | null;
  updatedBy: string | null;
}

export interface ParisPagePlacementsDocument {
  schemaVersion: 1;
  hero: SectionPageHeroManualSelection | null;
  secondaryStories: SectionPageSecondaryStoriesSelection | null;
  leSaviezVousFeature: SectionPageLeSaviezVousSelection | null;
  sidebarRail: SectionPageSidebarRailSelection | null;
  updatedAt: Date | null;
  updatedBy: string | null;
}

const db = getDb();
const placementsCollection = db.collection('editorialPlacements');
const landingPlacementsRef = placementsCollection.doc('landing');
const calendarPagePlacementsRef = placementsCollection.doc('calendarPage');
const culturePagePlacementsRef = placementsCollection.doc('culturePage');
const parisPagePlacementsRef = placementsCollection.doc('parisPage');

const MAIN_HERO_COLLECTIONS: Record<LandingMainHeroType, string> = {
  article: 'articles',
  guide: 'guides',
  interview: 'interviews',
  flipper: 'flippers',
  'visual-story': 'visual-stories',
};

const NETLENKA_COLLECTIONS: Record<LandingNetlenkaItemType, string> = {
  ...MAIN_HERO_COLLECTIONS,
};

const CATEGORY_CARDS_COLLECTIONS: Record<LandingCategoryCardsItemType, string> = {
  article: MAIN_HERO_COLLECTIONS.article,
  guide: MAIN_HERO_COLLECTIONS.guide,
  flipper: MAIN_HERO_COLLECTIONS.flipper,
  'visual-story': MAIN_HERO_COLLECTIONS['visual-story'],
};

const DEFAULT_NEWS_RAIL_LIMIT = 4;
const MAX_NEWS_RAIL_LIMIT = 12;
const DEFAULT_CATEGORY_CARDS_LIMIT = 3;
const MAX_CATEGORY_CARDS_LIMIT = 3;
const CALENDAR_PAGE_CARD_LIMIT = 4;
const DEFAULT_SECTION_PAGE_SECONDARY_LIMIT = 3;
const MAX_SECTION_PAGE_SECONDARY_LIMIT = 6;
const DEFAULT_SECTION_PAGE_SIDEBAR_LIMIT = 4;
const MAX_SECTION_PAGE_SIDEBAR_LIMIT = 8;

const SECTION_PAGE_HERO_COLLECTIONS: Record<SectionPageHeroType, string> = {
  ...MAIN_HERO_COLLECTIONS,
};

const createDefaultLandingPlacements = (): LandingPlacementsDocument => ({
  schemaVersion: 4,
  mainHero: null,
  newsRail: {
    mode: 'auto-latest',
    limit: DEFAULT_NEWS_RAIL_LIMIT,
  },
  netlenkaRail: {
    mode: 'auto-latest',
    limit: DEFAULT_NEWS_RAIL_LIMIT,
  },
  cultureHero: null,
  cultureCards: {
    mode: 'auto-latest',
    limit: DEFAULT_CATEGORY_CARDS_LIMIT,
  },
  parisHero: null,
  parisCards: {
    mode: 'auto-latest',
    limit: DEFAULT_CATEGORY_CARDS_LIMIT,
  },
  eventCard: {
    mode: 'auto-nearest',
  },
  cultureInterviewBlock: {
    mode: 'auto-latest',
  },
  leSaviezVousFeature: {
    mode: 'auto-latest',
  },
  updatedAt: null,
  updatedBy: null,
});

const createDefaultCalendarPagePlacements = (): CalendarPagePlacementsDocument => ({
  schemaVersion: 1,
  mainCards: null,
  secondaryCards: null,
  updatedAt: null,
  updatedBy: null,
});

const normalizeStringId = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeStringIds = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const ids = value
    .map(normalizeStringId)
    .filter((id): id is string => Boolean(id));

  return Array.from(new Set(ids));
};

const normalizePositiveLimit = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const normalized = Math.trunc(value);
  if (normalized <= 0 || normalized > MAX_NEWS_RAIL_LIMIT) {
    return null;
  }

  return normalized;
};

const normalizeCalendarPageLimit = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const normalized = Math.trunc(value);
  if (normalized !== CALENDAR_PAGE_CARD_LIMIT) {
    return null;
  }

  return normalized;
};

const normalizeCategoryCardsLimit = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const normalized = Math.trunc(value);
  if (normalized <= 0 || normalized > MAX_CATEGORY_CARDS_LIMIT) {
    return null;
  }

  return normalized;
};

const isAllowedMainHeroType = (value: unknown): value is LandingMainHeroType =>
  value === 'article' ||
  value === 'guide' ||
  value === 'interview' ||
  value === 'flipper' ||
  value === 'visual-story';

const isAllowedNetlenkaItemType = (
  value: unknown,
): value is LandingNetlenkaItemType => isAllowedMainHeroType(value);

const isAllowedCategoryCardsItemType = (
  value: unknown,
): value is LandingCategoryCardsItemType =>
  value === 'article' ||
  value === 'guide' ||
  value === 'flipper' ||
  value === 'visual-story';

const normalizeMainHeroSelection = (value: unknown): LandingMainHeroSelection | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const mode = (value as { mode?: unknown }).mode;
  const type = (value as { type?: unknown }).type;
  const id = normalizeStringId((value as { id?: unknown }).id);

  if (!isAllowedMainHeroType(type) || !id) {
    return null;
  }

  if (mode === undefined) {
    return {
      mode: 'manual',
      type,
      id,
    };
  }

  if (mode !== 'manual') {
    return null;
  }

  return {
    mode: 'manual',
    type,
    id,
  };
};

const normalizeNewsRailSelection = (value: unknown): LandingNewsRailSelection | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const mode = (value as { mode?: unknown }).mode;

  if (mode === 'auto-latest') {
    const limit =
      normalizePositiveLimit((value as { limit?: unknown }).limit) ??
      DEFAULT_NEWS_RAIL_LIMIT;
    return {
      mode: 'auto-latest',
      limit,
    };
  }

  if (mode === 'manual') {
    const ids = normalizeStringIds((value as { ids?: unknown }).ids);
    if (!ids || ids.length === 0) {
      return null;
    }

    return {
      mode: 'manual',
      ids,
    };
  }

  return null;
};

const normalizeNetlenkaItemTarget = (
  value: unknown,
): LandingNetlenkaItemTarget | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const type = (value as { type?: unknown }).type;
  const id = normalizeStringId((value as { id?: unknown }).id);

  if (!isAllowedNetlenkaItemType(type) || !id) {
    return null;
  }

  return {
    type,
    id,
  };
};

const normalizeNetlenkaItemTargets = (
  value: unknown,
): LandingNetlenkaItemTarget[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value
    .map(normalizeNetlenkaItemTarget)
    .filter((item): item is LandingNetlenkaItemTarget => Boolean(item));

  const uniqueItems = Array.from(
    new Map(items.map((item) => [`${item.type}:${item.id}`, item])).values(),
  );

  return uniqueItems;
};

const normalizeNetlenkaRailSelection = (
  value: unknown,
): LandingNetlenkaRailSelection | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const mode = (value as { mode?: unknown }).mode;

  if (mode === 'auto-latest') {
    const limit =
      normalizePositiveLimit((value as { limit?: unknown }).limit) ??
      DEFAULT_NEWS_RAIL_LIMIT;
    return {
      mode: 'auto-latest',
      limit,
    };
  }

  if (mode === 'manual') {
    const items = normalizeNetlenkaItemTargets((value as { items?: unknown }).items);
    if (!items || items.length === 0) {
      return null;
    }

    return {
      mode: 'manual',
      items,
    };
  }

  return null;
};

const normalizeCategoryCardsItemTarget = (
  value: unknown,
): LandingCategoryCardsItemTarget | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const type = (value as { type?: unknown }).type;
  const id = normalizeStringId((value as { id?: unknown }).id);

  if (!isAllowedCategoryCardsItemType(type) || !id) {
    return null;
  }

  return {
    type,
    id,
  };
};

const normalizeCategoryHeroSelection = (
  value: unknown,
): LandingCategoryHeroSelection | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const mode = (value as { mode?: unknown }).mode;
  const target = normalizeCategoryCardsItemTarget(value);

  if (!target || (mode !== undefined && mode !== 'manual')) {
    return null;
  }

  return {
    mode: 'manual',
    type: target.type,
    id: target.id,
  };
};

const normalizeCategoryCardsItemTargets = (
  value: unknown,
): LandingCategoryCardsItemTarget[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value
    .map(normalizeCategoryCardsItemTarget)
    .filter((item): item is LandingCategoryCardsItemTarget => Boolean(item));

  return Array.from(
    new Map(items.map((item) => [`${item.type}:${item.id}`, item])).values(),
  );
};

const normalizeCategoryCardsSelection = (
  value: unknown,
): LandingCategoryCardsSelection | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const mode = (value as { mode?: unknown }).mode;

  if (mode === 'auto-latest') {
    const limit =
      normalizeCategoryCardsLimit((value as { limit?: unknown }).limit) ??
      DEFAULT_CATEGORY_CARDS_LIMIT;
    return {
      mode: 'auto-latest',
      limit,
    };
  }

  if (mode === 'manual') {
    const items = normalizeCategoryCardsItemTargets((value as { items?: unknown }).items);
    if (!items || items.length === 0 || items.length > MAX_CATEGORY_CARDS_LIMIT) {
      return null;
    }

    return {
      mode: 'manual',
      items,
    };
  }

  return null;
};

const normalizeEventCardSelection = (value: unknown): LandingEventCardSelection | null => {
  const legacyId = normalizeStringId(value);
  if (legacyId) {
    return {
      mode: 'manual',
      id: legacyId,
    };
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const mode = (value as { mode?: unknown }).mode;

  if (mode === 'auto-nearest') {
    return { mode: 'auto-nearest' };
  }

  if (mode === 'manual') {
    const id = normalizeStringId((value as { id?: unknown }).id);
    if (!id) {
      return null;
    }

    return {
      mode: 'manual',
      id,
    };
  }

  return null;
};

const normalizeCultureInterviewBlockSelection = (
  value: unknown,
): LandingCultureInterviewBlockSelection | null => {
  const legacyId = normalizeStringId(value);
  if (legacyId) {
    return {
      mode: 'manual',
      id: legacyId,
    };
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const mode = (value as { mode?: unknown }).mode;

  if (mode === 'auto-latest') {
    return { mode: 'auto-latest' };
  }

  if (mode === 'manual') {
    const id = normalizeStringId((value as { id?: unknown }).id);
    if (!id) {
      return null;
    }

    return {
      mode: 'manual',
      id,
    };
  }

  return null;
};

const normalizeCalendarManualCardsSelection = (
  value: unknown,
): CalendarPageManualCardsSelection | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const mode = (value as { mode?: unknown }).mode;
  if (mode !== 'manual') {
    return null;
  }

  const ids = normalizeStringIds((value as { ids?: unknown }).ids);
  if (!ids || ids.length === 0 || ids.length > CALENDAR_PAGE_CARD_LIMIT) {
    return null;
  }

  return {
    mode: 'manual',
    ids,
  };
};

const normalizeCalendarSecondaryCardsSelection = (
  value: unknown,
): CalendarPageSecondaryCardsSelection | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const mode = (value as { mode?: unknown }).mode;

  if (mode === 'manual') {
    return normalizeCalendarManualCardsSelection(value);
  }

  if (
    mode === 'auto-current-week-single-day-priority' ||
    mode === 'auto-current-single-day-priority'
  ) {
    const limit =
      normalizeCalendarPageLimit((value as { limit?: unknown }).limit) ??
      CALENDAR_PAGE_CARD_LIMIT;

    return {
      mode: 'auto-current-week-single-day-priority',
      limit,
    };
  }

  return null;
};

const normalizeLandingPlacements = (
  value: FirebaseFirestore.DocumentData | undefined,
): LandingPlacementsDocument => {
  const defaults = createDefaultLandingPlacements();
  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const mainHero = normalizeMainHeroSelection(value.mainHero);

  const newsRailRaw = 'newsRail' in value ? value.newsRail : undefined;
  const newsRail = newsRailRaw === null
    ? null
    : (normalizeNewsRailSelection(newsRailRaw) ?? defaults.newsRail);

  const netlenkaRailRaw = 'netlenkaRail' in value ? value.netlenkaRail : undefined;
  const netlenkaRail = netlenkaRailRaw === null
    ? null
    : (normalizeNetlenkaRailSelection(netlenkaRailRaw) ?? defaults.netlenkaRail);

  const cultureHeroRaw = 'cultureHero' in value ? value.cultureHero : undefined;
  const cultureHero = cultureHeroRaw === null
    ? null
    : (normalizeCategoryHeroSelection(cultureHeroRaw) ?? defaults.cultureHero);

  const cultureCardsRaw = 'cultureCards' in value ? value.cultureCards : undefined;
  const cultureCards = cultureCardsRaw === null
    ? null
    : (normalizeCategoryCardsSelection(cultureCardsRaw) ?? defaults.cultureCards);

  const parisHeroRaw = 'parisHero' in value ? value.parisHero : undefined;
  const parisHero = parisHeroRaw === null
    ? null
    : (normalizeCategoryHeroSelection(parisHeroRaw) ?? defaults.parisHero);

  const parisCardsRaw = 'parisCards' in value ? value.parisCards : undefined;
  const parisCards = parisCardsRaw === null
    ? null
    : (normalizeCategoryCardsSelection(parisCardsRaw) ?? defaults.parisCards);

  const eventCardRaw = 'eventCard' in value ? value.eventCard : undefined;
  const eventCard = eventCardRaw === null
    ? null
    : (normalizeEventCardSelection(eventCardRaw)
        ?? normalizeEventCardSelection(value.featuredEventId)
        ?? defaults.eventCard);

  const cultureInterviewRaw = 'cultureInterviewBlock' in value ? value.cultureInterviewBlock : undefined;
  const cultureInterviewBlock = cultureInterviewRaw === null
    ? null
    : (normalizeCultureInterviewBlockSelection(cultureInterviewRaw)
        ?? normalizeCultureInterviewBlockSelection(value.featuredInterviewInCultureId)
        ?? defaults.cultureInterviewBlock);

  const leSaviezVousRaw = 'leSaviezVousFeature' in value ? value.leSaviezVousFeature : undefined;
  const leSaviezVousFeature = leSaviezVousRaw === null
    ? null
    : (normalizeSectionPageLeSaviezVousSelection(leSaviezVousRaw) ?? defaults.leSaviezVousFeature);

  return {
    schemaVersion: 4,
    mainHero,
    newsRail,
    netlenkaRail,
    cultureHero,
    cultureCards,
    parisHero,
    parisCards,
    eventCard,
    cultureInterviewBlock,
    leSaviezVousFeature,
    updatedAt:
      value.updatedAt instanceof Date ? value.updatedAt : value.updatedAt ?? null,
    updatedBy: normalizeStringId(value.updatedBy),
  };
};

const normalizeCalendarPagePlacements = (
  value: FirebaseFirestore.DocumentData | undefined,
): CalendarPagePlacementsDocument => {
  const defaults = createDefaultCalendarPagePlacements();
  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const mainCardsRaw = 'mainCards' in value ? value.mainCards : undefined;
  const mainCards = mainCardsRaw === null
    ? null
    : (normalizeCalendarManualCardsSelection(mainCardsRaw) ?? defaults.mainCards);

  const secondaryCardsRaw = 'secondaryCards' in value ? value.secondaryCards : undefined;
  const secondaryCards = secondaryCardsRaw === null
    ? null
    : (normalizeCalendarSecondaryCardsSelection(secondaryCardsRaw) ?? defaults.secondaryCards);

  return {
    schemaVersion: 1,
    mainCards,
    secondaryCards,
    updatedAt:
      value.updatedAt instanceof Date ? value.updatedAt : value.updatedAt ?? null,
    updatedBy: normalizeStringId(value.updatedBy),
  };
};

const assertDocumentExists = async (collectionName: string, id: string) => {
  const doc = await db.collection(collectionName).doc(id).get();
  return doc.exists;
};

const assertDocumentsExist = async (collectionName: string, ids: string[]) => {
  const existence = await Promise.all(
    ids.map(async (id) => ({ id, exists: await assertDocumentExists(collectionName, id) })),
  );

  return existence.filter((entry) => !entry.exists).map((entry) => entry.id);
};

interface NetlenkaItemStatus extends LandingNetlenkaItemTarget {
  exists: boolean;
  isHotContent: boolean;
}

interface CategoryCardsItemStatus extends LandingCategoryCardsItemTarget {
  exists: boolean;
}

const getNetlenkaItemStatuses = async (
  items: LandingNetlenkaItemTarget[],
): Promise<NetlenkaItemStatus[]> => {
  const uniqueItems = Array.from(
    new Map(items.map((item) => [`${item.type}:${item.id}`, item])).values(),
  );

  return Promise.all(
    uniqueItems.map(async (item) => {
      const doc = await db.collection(NETLENKA_COLLECTIONS[item.type]).doc(item.id).get();
      const data = doc.data();

      return {
        ...item,
        exists: doc.exists,
        isHotContent: doc.exists && data?.isHotContent === true,
      };
    }),
  );
};

const getCategoryCardsItemStatuses = async (
  items: LandingCategoryCardsItemTarget[],
): Promise<CategoryCardsItemStatus[]> => {
  const uniqueItems = Array.from(
    new Map(items.map((item) => [`${item.type}:${item.id}`, item])).values(),
  );

  return Promise.all(
    uniqueItems.map(async (item) => {
      const doc = await db
        .collection(CATEGORY_CARDS_COLLECTIONS[item.type])
        .doc(item.id)
        .get();

      return {
        ...item,
        exists: doc.exists,
      };
    }),
  );
};

const sanitizeNetlenkaRailSelection = async (
  netlenkaRail: LandingNetlenkaRailSelection | null,
): Promise<LandingNetlenkaRailSelection | null> => {
  if (!netlenkaRail || netlenkaRail.mode !== 'manual') {
    return netlenkaRail;
  }

  const statuses = await getNetlenkaItemStatuses(netlenkaRail.items);
  const allowedKeys = new Set(
    statuses
      .filter((item) => item.exists && item.isHotContent)
      .map((item) => `${item.type}:${item.id}`),
  );

  const sanitizedItems = netlenkaRail.items.filter((item) =>
    allowedKeys.has(`${item.type}:${item.id}`),
  );

  if (sanitizedItems.length === 0) {
    return null;
  }

  if (sanitizedItems.length === netlenkaRail.items.length) {
    return netlenkaRail;
  }

  return {
    mode: 'manual',
    items: sanitizedItems,
  };
};

const sanitizeCategoryCardsSelection = async (
  selection: LandingCategoryCardsSelection | null,
): Promise<LandingCategoryCardsSelection | null> => {
  if (!selection || selection.mode !== 'manual') {
    return selection;
  }

  const statuses = await getCategoryCardsItemStatuses(selection.items);
  const allowedKeys = new Set(
    statuses
      .filter((item) => item.exists)
      .map((item) => `${item.type}:${item.id}`),
  );

  const sanitizedItems = selection.items.filter((item) =>
    allowedKeys.has(`${item.type}:${item.id}`),
  );

  if (sanitizedItems.length === 0) {
    return null;
  }

  if (sanitizedItems.length === selection.items.length) {
    return selection;
  }

  return {
    mode: 'manual',
    items: sanitizedItems,
  };
};

export const getLandingPlacements = async (_req: Request, res: Response) => {
  try {
    const landingDoc = await landingPlacementsRef.get();
    if (!landingDoc.exists) {
      return res.status(200).json(createDefaultLandingPlacements());
    }

    const normalizedPlacements = normalizeLandingPlacements(landingDoc.data());
    const sanitizedNetlenkaRail = await sanitizeNetlenkaRailSelection(
      normalizedPlacements.netlenkaRail,
    );
    const sanitizedCultureCards = await sanitizeCategoryCardsSelection(
      normalizedPlacements.cultureCards,
    );
    const sanitizedParisCards = await sanitizeCategoryCardsSelection(
      normalizedPlacements.parisCards,
    );
    const responsePayload = {
      ...normalizedPlacements,
      netlenkaRail: sanitizedNetlenkaRail,
      cultureCards: sanitizedCultureCards,
      parisCards: sanitizedParisCards,
    };

    if (
      JSON.stringify(sanitizedNetlenkaRail) !== JSON.stringify(normalizedPlacements.netlenkaRail) ||
      JSON.stringify(sanitizedCultureCards) !== JSON.stringify(normalizedPlacements.cultureCards) ||
      JSON.stringify(sanitizedParisCards) !== JSON.stringify(normalizedPlacements.parisCards)
    ) {
      await landingPlacementsRef.set(
        {
          ...responsePayload,
          updatedAt: landingDoc.data()?.updatedAt ?? normalizedPlacements.updatedAt ?? null,
          updatedBy: landingDoc.data()?.updatedBy ?? normalizedPlacements.updatedBy ?? null,
        },
        { merge: true },
      );
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('Error getting landing placements:', error);
    return res
      .status(500)
      .json({ message: 'Server error while getting landing placements' });
  }
};

export const getCalendarPagePlacements = async (_req: Request, res: Response) => {
  try {
    const calendarPageDoc = await calendarPagePlacementsRef.get();
    if (!calendarPageDoc.exists) {
      return res.status(200).json(createDefaultCalendarPagePlacements());
    }

    const normalizedPlacements = normalizeCalendarPagePlacements(calendarPageDoc.data());
    return res.status(200).json(normalizedPlacements);
  } catch (error) {
    console.error('Error getting calendar page placements:', error);
    return res
      .status(500)
      .json({ message: 'Server error while getting calendar page placements' });
  }
};

export const updateLandingPlacements = async (req: Request, res: Response) => {
  try {
    const currentDoc = await landingPlacementsRef.get();
    const currentNormalized = normalizeLandingPlacements(currentDoc.data());
    const current = {
      ...currentNormalized,
      netlenkaRail: await sanitizeNetlenkaRailSelection(currentNormalized.netlenkaRail),
      cultureCards: await sanitizeCategoryCardsSelection(currentNormalized.cultureCards),
      parisCards: await sanitizeCategoryCardsSelection(currentNormalized.parisCards),
    };
    const payload = req.body && typeof req.body === 'object' ? req.body : {};

    let mainHero = current.mainHero;
    let newsRail = current.newsRail;
    let netlenkaRail = current.netlenkaRail;
    let cultureHero = current.cultureHero;
    let cultureCards = current.cultureCards;
    let parisHero = current.parisHero;
    let parisCards = current.parisCards;
    let eventCard = current.eventCard;
    let cultureInterviewBlock = current.cultureInterviewBlock;
    let leSaviezVousFeature = current.leSaviezVousFeature;

    if ('mainHero' in payload) {
      if (payload.mainHero === null) {
        mainHero = null;
      } else {
        const normalizedMainHero = normalizeMainHeroSelection(payload.mainHero);
        if (!normalizedMainHero) {
          return res.status(400).json({ message: 'Invalid mainHero payload' });
        }

        const exists = await assertDocumentExists(
          MAIN_HERO_COLLECTIONS[normalizedMainHero.type],
          normalizedMainHero.id,
        );

        if (!exists) {
          return res
            .status(404)
            .json({ message: 'Referenced mainHero document was not found' });
        }

        mainHero = normalizedMainHero;
      }
    }

    if ('newsRail' in payload) {
      if (payload.newsRail === null) {
        newsRail = null;
      } else {
        const normalizedNewsRail = normalizeNewsRailSelection(payload.newsRail);
        if (!normalizedNewsRail) {
          return res.status(400).json({ message: 'Invalid newsRail payload' });
        }

        if (normalizedNewsRail.mode === 'manual') {
          const missingIds = await assertDocumentsExist('news', normalizedNewsRail.ids);
          if (missingIds.length > 0) {
            return res.status(404).json({
              message: 'Referenced news documents were not found',
              missingIds,
            });
          }
        }

        newsRail = normalizedNewsRail;
      }
    }

    if ('netlenkaRail' in payload) {
      if (payload.netlenkaRail === null) {
        netlenkaRail = null;
      } else {
        const normalizedNetlenkaRail = normalizeNetlenkaRailSelection(payload.netlenkaRail);
        if (!normalizedNetlenkaRail) {
          return res.status(400).json({ message: 'Invalid netlenkaRail payload' });
        }

        if (normalizedNetlenkaRail.mode === 'manual') {
          const statuses = await getNetlenkaItemStatuses(normalizedNetlenkaRail.items);
          const missingItems = statuses
            .filter((item) => !item.exists)
            .map(({ type, id }) => ({ type, id }));
          if (missingItems.length > 0) {
            return res.status(404).json({
              message: 'Referenced netlenka rail documents were not found',
              missingItems,
            });
          }

          const nonHotItems = statuses
            .filter((item) => item.exists && !item.isHotContent)
            .map(({ type, id }) => ({ type, id }));
          if (nonHotItems.length > 0) {
            return res.status(400).json({
              message: 'Referenced netlenka rail documents must have isHotContent=true',
              nonHotItems,
            });
          }
        }

        netlenkaRail = normalizedNetlenkaRail;
      }
    }

    if ('cultureHero' in payload) {
      if (payload.cultureHero === null) {
        cultureHero = null;
      } else {
        const normalizedCultureHero = normalizeCategoryHeroSelection(payload.cultureHero);
        if (!normalizedCultureHero) {
          return res.status(400).json({ message: 'Invalid cultureHero payload' });
        }

        const exists = await assertDocumentExists(
          CATEGORY_CARDS_COLLECTIONS[normalizedCultureHero.type],
          normalizedCultureHero.id,
        );

        if (!exists) {
          return res
            .status(404)
            .json({ message: 'Referenced cultureHero document was not found' });
        }

        cultureHero = normalizedCultureHero;
      }
    }

    if ('cultureCards' in payload) {
      if (payload.cultureCards === null) {
        cultureCards = null;
      } else {
        const normalizedCultureCards = normalizeCategoryCardsSelection(payload.cultureCards);
        if (!normalizedCultureCards) {
          return res.status(400).json({ message: 'Invalid cultureCards payload' });
        }

        if (normalizedCultureCards.mode === 'manual') {
          const statuses = await getCategoryCardsItemStatuses(normalizedCultureCards.items);
          const missingItems = statuses
            .filter((item) => !item.exists)
            .map(({ type, id }) => ({ type, id }));
          if (missingItems.length > 0) {
            return res.status(404).json({
              message: 'Referenced cultureCards documents were not found',
              missingItems,
            });
          }
        }

        cultureCards = normalizedCultureCards;
      }
    }

    if ('parisHero' in payload) {
      if (payload.parisHero === null) {
        parisHero = null;
      } else {
        const normalizedParisHero = normalizeCategoryHeroSelection(payload.parisHero);
        if (!normalizedParisHero) {
          return res.status(400).json({ message: 'Invalid parisHero payload' });
        }

        const exists = await assertDocumentExists(
          CATEGORY_CARDS_COLLECTIONS[normalizedParisHero.type],
          normalizedParisHero.id,
        );

        if (!exists) {
          return res
            .status(404)
            .json({ message: 'Referenced parisHero document was not found' });
        }

        parisHero = normalizedParisHero;
      }
    }

    if ('parisCards' in payload) {
      if (payload.parisCards === null) {
        parisCards = null;
      } else {
        const normalizedParisCards = normalizeCategoryCardsSelection(payload.parisCards);
        if (!normalizedParisCards) {
          return res.status(400).json({ message: 'Invalid parisCards payload' });
        }

        if (normalizedParisCards.mode === 'manual') {
          const statuses = await getCategoryCardsItemStatuses(normalizedParisCards.items);
          const missingItems = statuses
            .filter((item) => !item.exists)
            .map(({ type, id }) => ({ type, id }));
          if (missingItems.length > 0) {
            return res.status(404).json({
              message: 'Referenced parisCards documents were not found',
              missingItems,
            });
          }
        }

        parisCards = normalizedParisCards;
      }
    }

    if ('eventCard' in payload) {
      if (payload.eventCard === null) {
        eventCard = null;
      } else {
        const normalizedEventCard = normalizeEventCardSelection(payload.eventCard);
        if (!normalizedEventCard) {
          return res.status(400).json({ message: 'Invalid eventCard payload' });
        }

        if (normalizedEventCard.mode === 'manual') {
          const exists = await assertDocumentExists('events', normalizedEventCard.id);
          if (!exists) {
            return res
              .status(404)
              .json({ message: 'Referenced event card document was not found' });
          }
        }

        eventCard = normalizedEventCard;
      }
    }

    if ('cultureInterviewBlock' in payload) {
      if (payload.cultureInterviewBlock === null) {
        cultureInterviewBlock = null;
      } else {
        const normalizedCultureInterviewBlock = normalizeCultureInterviewBlockSelection(
          payload.cultureInterviewBlock,
        );
        if (!normalizedCultureInterviewBlock) {
          return res
            .status(400)
            .json({ message: 'Invalid cultureInterviewBlock payload' });
        }

        if (normalizedCultureInterviewBlock.mode === 'manual') {
          const exists = await assertDocumentExists(
            'interviews',
            normalizedCultureInterviewBlock.id,
          );
          if (!exists) {
            return res.status(404).json({
              message:
                'Referenced culture interview block document was not found',
            });
          }
        }

        cultureInterviewBlock = normalizedCultureInterviewBlock;
      }
    }

    if ('leSaviezVousFeature' in payload) {
      if (payload.leSaviezVousFeature === null) {
        leSaviezVousFeature = null;
      } else {
        const normalized = normalizeSectionPageLeSaviezVousSelection(payload.leSaviezVousFeature);
        if (!normalized) {
          return res.status(400).json({ message: 'Invalid leSaviezVousFeature payload' });
        }

        if (normalized.mode === 'manual') {
          const exists = await assertDocumentExists('articles', normalized.id);
          if (!exists) {
            return res.status(404).json({ message: 'Referenced le saviez-vous article was not found' });
          }
        }

        leSaviezVousFeature = normalized;
      }
    }

    const nextValue: LandingPlacementsDocument = {
      schemaVersion: 4,
      mainHero,
      newsRail,
      netlenkaRail,
      cultureHero,
      cultureCards,
      parisHero,
      parisCards,
      eventCard,
      cultureInterviewBlock,
      leSaviezVousFeature,
      updatedAt: new Date(),
      updatedBy: null,
    };

    await landingPlacementsRef.set(nextValue, { merge: true });
    return res.status(200).json(nextValue);
  } catch (error) {
    console.error('Error updating landing placements:', error);
    return res
      .status(500)
      .json({ message: 'Server error while updating landing placements' });
  }
};

export const updateCalendarPagePlacements = async (req: Request, res: Response) => {
  try {
    const currentDoc = await calendarPagePlacementsRef.get();
    const current = normalizeCalendarPagePlacements(currentDoc.data());
    const payload = req.body && typeof req.body === 'object' ? req.body : {};

    let mainCards = current.mainCards;
    let secondaryCards = current.secondaryCards;

    if ('mainCards' in payload) {
      if (payload.mainCards === null) {
        mainCards = null;
      } else {
        const normalizedMainCards = normalizeCalendarManualCardsSelection(payload.mainCards);
        if (!normalizedMainCards) {
          return res.status(400).json({ message: 'Invalid mainCards payload' });
        }

        const missingIds = await assertDocumentsExist('events', normalizedMainCards.ids);
        if (missingIds.length > 0) {
          return res.status(404).json({
            message: 'Referenced mainCards event documents were not found',
            missingIds,
          });
        }

        mainCards = normalizedMainCards;
      }
    }

    if ('secondaryCards' in payload) {
      if (payload.secondaryCards === null) {
        secondaryCards = null;
      } else {
        const normalizedSecondaryCards = normalizeCalendarSecondaryCardsSelection(
          payload.secondaryCards,
        );
        if (!normalizedSecondaryCards) {
          return res.status(400).json({ message: 'Invalid secondaryCards payload' });
        }

        if (normalizedSecondaryCards.mode === 'manual') {
          const missingIds = await assertDocumentsExist('events', normalizedSecondaryCards.ids);
          if (missingIds.length > 0) {
            return res.status(404).json({
              message: 'Referenced secondaryCards event documents were not found',
              missingIds,
            });
          }
        }

        secondaryCards = normalizedSecondaryCards;
      }
    }

    const nextValue: CalendarPagePlacementsDocument = {
      schemaVersion: 1,
      mainCards,
      secondaryCards,
      updatedAt: new Date(),
      updatedBy: null,
    };

    await calendarPagePlacementsRef.set(nextValue, { merge: true });
    return res.status(200).json(nextValue);
  } catch (error) {
    console.error('Error updating calendar page placements:', error);
    return res
      .status(500)
      .json({ message: 'Server error while updating calendar page placements' });
  }
};

const createDefaultCulturePagePlacements = (): CulturePagePlacementsDocument => ({
  schemaVersion: 1,
  hero: null,
  secondaryStories: { mode: 'auto-latest', limit: DEFAULT_SECTION_PAGE_SECONDARY_LIMIT },
  featuredInterview: { mode: 'auto-latest' },
  sidebarRail: { mode: 'auto-hot', limit: DEFAULT_SECTION_PAGE_SIDEBAR_LIMIT },
  updatedAt: null,
  updatedBy: null,
});

const createDefaultParisPagePlacements = (): ParisPagePlacementsDocument => ({
  schemaVersion: 1,
  hero: null,
  secondaryStories: { mode: 'auto-latest', limit: DEFAULT_SECTION_PAGE_SECONDARY_LIMIT },
  leSaviezVousFeature: { mode: 'auto-latest' },
  sidebarRail: { mode: 'auto-hot', limit: DEFAULT_SECTION_PAGE_SIDEBAR_LIMIT },
  updatedAt: null,
  updatedBy: null,
});

const normalizeSectionPageLimit = (
  value: unknown,
  max: number,
  defaultValue: number,
): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return defaultValue;
  return Math.min(Math.round(parsed), max);
};

const normalizeSectionPageHeroSelection = (
  value: unknown,
): SectionPageHeroManualSelection | null => {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (v.mode !== 'manual') return null;
  const type = v.type as string;
  const id = v.id as string;
  if (!type || !id || !SECTION_PAGE_HERO_COLLECTIONS[type as SectionPageHeroType]) return null;
  return { mode: 'manual', type: type as SectionPageHeroType, id };
};

const normalizeSectionPageSecondaryStoriesSelection = (
  value: unknown,
): SectionPageSecondaryStoriesSelection | null => {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (v.mode === 'auto-latest') {
    return {
      mode: 'auto-latest',
      limit: normalizeSectionPageLimit(
        v.limit,
        MAX_SECTION_PAGE_SECONDARY_LIMIT,
        DEFAULT_SECTION_PAGE_SECONDARY_LIMIT,
      ),
    };
  }
  if (v.mode === 'manual') {
    const rawItems = Array.isArray(v.items) ? v.items : [];
    const items = rawItems
      .map((item: unknown) => {
        if (!item || typeof item !== 'object') return null;
        const i = item as Record<string, unknown>;
        const type = i.type as string;
        const id = i.id as string;
        if (!type || !id || !SECTION_PAGE_HERO_COLLECTIONS[type as SectionPageHeroType]) return null;
        return { type: type as SectionPageHeroType, id };
      })
      .filter((item): item is SectionPageSecondaryItemTarget => item !== null);
    return { mode: 'manual', items };
  }
  return null;
};

const normalizeSectionPageFeaturedInterviewSelection = (
  value: unknown,
): SectionPageFeaturedInterviewSelection | null => {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (v.mode === 'auto-latest') return { mode: 'auto-latest' };
  if (v.mode === 'manual' && typeof v.id === 'string' && v.id) {
    return { mode: 'manual', id: v.id };
  }
  return null;
};

const normalizeSectionPageSidebarRailSelection = (
  value: unknown,
): SectionPageSidebarRailSelection | null => {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (v.mode === 'auto-hot') {
    return {
      mode: 'auto-hot',
      limit: normalizeSectionPageLimit(
        v.limit,
        MAX_SECTION_PAGE_SIDEBAR_LIMIT,
        DEFAULT_SECTION_PAGE_SIDEBAR_LIMIT,
      ),
    };
  }
  if (v.mode === 'manual') {
    const rawItems = Array.isArray(v.items) ? v.items : [];
    const items = rawItems
      .map((item: unknown) => {
        if (!item || typeof item !== 'object') return null;
        const i = item as Record<string, unknown>;
        const type = i.type as string;
        const id = i.id as string;
        if (!type || !id || !SECTION_PAGE_HERO_COLLECTIONS[type as SectionPageHeroType]) return null;
        return { type: type as SectionPageHeroType, id };
      })
      .filter((item): item is SectionPageSecondaryItemTarget => item !== null);
    return { mode: 'manual', items };
  }
  return null;
};

const normalizeSectionPageLeSaviezVousSelection = (
  value: unknown,
): SectionPageLeSaviezVousSelection | null => {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (v.mode === 'auto-latest') return { mode: 'auto-latest' };
  if (v.mode === 'manual' && typeof v.id === 'string' && v.id) {
    return { mode: 'manual', id: v.id };
  }
  return null;
};

const normalizeCulturePagePlacements = (
  value: FirebaseFirestore.DocumentData | undefined,
): CulturePagePlacementsDocument => {
  const defaults = createDefaultCulturePagePlacements();
  if (!value || typeof value !== 'object') return defaults;

  const heroRaw = 'hero' in value ? value.hero : undefined;
  const hero = heroRaw === null
    ? null
    : (normalizeSectionPageHeroSelection(heroRaw) ?? defaults.hero);

  const secondaryStoriesRaw = 'secondaryStories' in value ? value.secondaryStories : undefined;
  const secondaryStories = secondaryStoriesRaw === null
    ? null
    : (normalizeSectionPageSecondaryStoriesSelection(secondaryStoriesRaw) ?? defaults.secondaryStories);

  const featuredInterviewRaw = 'featuredInterview' in value ? value.featuredInterview : undefined;
  const featuredInterview = featuredInterviewRaw === null
    ? null
    : (normalizeSectionPageFeaturedInterviewSelection(featuredInterviewRaw) ?? defaults.featuredInterview);

  const sidebarRailRaw = 'sidebarRail' in value ? value.sidebarRail : undefined;
  const sidebarRail = sidebarRailRaw === null
    ? null
    : (normalizeSectionPageSidebarRailSelection(sidebarRailRaw) ?? defaults.sidebarRail);

  return {
    schemaVersion: 1,
    hero,
    secondaryStories,
    featuredInterview,
    sidebarRail,
    updatedAt: value.updatedAt instanceof Date ? value.updatedAt : value.updatedAt ?? null,
    updatedBy: normalizeStringId(value.updatedBy),
  };
};

const normalizeParisPagePlacements = (
  value: FirebaseFirestore.DocumentData | undefined,
): ParisPagePlacementsDocument => {
  const defaults = createDefaultParisPagePlacements();
  if (!value || typeof value !== 'object') return defaults;

  const heroRaw = 'hero' in value ? value.hero : undefined;
  const hero = heroRaw === null
    ? null
    : (normalizeSectionPageHeroSelection(heroRaw) ?? defaults.hero);

  const secondaryStoriesRaw = 'secondaryStories' in value ? value.secondaryStories : undefined;
  const secondaryStories = secondaryStoriesRaw === null
    ? null
    : (normalizeSectionPageSecondaryStoriesSelection(secondaryStoriesRaw) ?? defaults.secondaryStories);

  const leSaviezVousRaw = 'leSaviezVousFeature' in value ? value.leSaviezVousFeature : undefined;
  const leSaviezVousFeature = leSaviezVousRaw === null
    ? null
    : (normalizeSectionPageLeSaviezVousSelection(leSaviezVousRaw) ?? defaults.leSaviezVousFeature);

  const sidebarRailRaw = 'sidebarRail' in value ? value.sidebarRail : undefined;
  const sidebarRail = sidebarRailRaw === null
    ? null
    : (normalizeSectionPageSidebarRailSelection(sidebarRailRaw) ?? defaults.sidebarRail);

  return {
    schemaVersion: 1,
    hero,
    secondaryStories,
    leSaviezVousFeature,
    sidebarRail,
    updatedAt: value.updatedAt instanceof Date ? value.updatedAt : value.updatedAt ?? null,
    updatedBy: normalizeStringId(value.updatedBy),
  };
};

export const getCulturePagePlacements = async (_req: Request, res: Response) => {
  try {
    const doc = await culturePagePlacementsRef.get();
    if (!doc.exists) {
      return res.status(200).json(createDefaultCulturePagePlacements());
    }
    return res.status(200).json(normalizeCulturePagePlacements(doc.data()));
  } catch (error) {
    console.error('Error getting culture page placements:', error);
    return res.status(500).json({ message: 'Server error while getting culture page placements' });
  }
};

export const updateCulturePagePlacements = async (req: Request, res: Response) => {
  try {
    const currentDoc = await culturePagePlacementsRef.get();
    const current = normalizeCulturePagePlacements(currentDoc.data());
    const payload = req.body && typeof req.body === 'object' ? req.body : {};

    let { hero, secondaryStories, featuredInterview, sidebarRail } = current;

    if ('hero' in payload) {
      if (payload.hero === null) {
        hero = null;
      } else {
        const normalized = normalizeSectionPageHeroSelection(payload.hero);
        if (!normalized) return res.status(400).json({ message: 'Invalid hero payload' });
        const exists = await assertDocumentExists(
          SECTION_PAGE_HERO_COLLECTIONS[normalized.type],
          normalized.id,
        );
        if (!exists) return res.status(404).json({ message: 'Referenced hero document not found' });
        hero = normalized;
      }
    }

    if ('secondaryStories' in payload) {
      if (payload.secondaryStories === null) {
        secondaryStories = null;
      } else {
        const normalized = normalizeSectionPageSecondaryStoriesSelection(payload.secondaryStories);
        if (!normalized) return res.status(400).json({ message: 'Invalid secondaryStories payload' });
        if (normalized.mode === 'manual') {
          const missingIds = (
            await Promise.all(
              normalized.items.map(async (item) => {
                const exists = await assertDocumentExists(SECTION_PAGE_HERO_COLLECTIONS[item.type], item.id);
                return exists ? null : `${item.type}:${item.id}`;
              }),
            )
          ).filter((id): id is string => id !== null);
          if (missingIds.length > 0) {
            return res.status(404).json({ message: 'Referenced secondaryStories documents not found', missingIds });
          }
        }
        secondaryStories = normalized;
      }
    }

    if ('featuredInterview' in payload) {
      if (payload.featuredInterview === null) {
        featuredInterview = null;
      } else {
        const normalized = normalizeSectionPageFeaturedInterviewSelection(payload.featuredInterview);
        if (!normalized) return res.status(400).json({ message: 'Invalid featuredInterview payload' });
        if (normalized.mode === 'manual') {
          const exists = await assertDocumentExists('interviews', normalized.id);
          if (!exists) return res.status(404).json({ message: 'Referenced interview not found' });
        }
        featuredInterview = normalized;
      }
    }

    if ('sidebarRail' in payload) {
      if (payload.sidebarRail === null) {
        sidebarRail = null;
      } else {
        const normalized = normalizeSectionPageSidebarRailSelection(payload.sidebarRail);
        if (!normalized) return res.status(400).json({ message: 'Invalid sidebarRail payload' });
        sidebarRail = normalized;
      }
    }

    const nextValue: CulturePagePlacementsDocument = {
      schemaVersion: 1,
      hero,
      secondaryStories,
      featuredInterview,
      sidebarRail,
      updatedAt: new Date(),
      updatedBy: null,
    };

    await culturePagePlacementsRef.set(nextValue, { merge: true });
    return res.status(200).json(nextValue);
  } catch (error) {
    console.error('Error updating culture page placements:', error);
    return res.status(500).json({ message: 'Server error while updating culture page placements' });
  }
};

export const getParisPagePlacements = async (_req: Request, res: Response) => {
  try {
    const doc = await parisPagePlacementsRef.get();
    if (!doc.exists) {
      return res.status(200).json(createDefaultParisPagePlacements());
    }
    return res.status(200).json(normalizeParisPagePlacements(doc.data()));
  } catch (error) {
    console.error('Error getting paris page placements:', error);
    return res.status(500).json({ message: 'Server error while getting paris page placements' });
  }
};

export const updateParisPagePlacements = async (req: Request, res: Response) => {
  try {
    const currentDoc = await parisPagePlacementsRef.get();
    const current = normalizeParisPagePlacements(currentDoc.data());
    const payload = req.body && typeof req.body === 'object' ? req.body : {};

    let { hero, secondaryStories, leSaviezVousFeature, sidebarRail } = current;

    if ('hero' in payload) {
      if (payload.hero === null) {
        hero = null;
      } else {
        const normalized = normalizeSectionPageHeroSelection(payload.hero);
        if (!normalized) return res.status(400).json({ message: 'Invalid hero payload' });
        const exists = await assertDocumentExists(
          SECTION_PAGE_HERO_COLLECTIONS[normalized.type],
          normalized.id,
        );
        if (!exists) return res.status(404).json({ message: 'Referenced hero document not found' });
        hero = normalized;
      }
    }

    if ('secondaryStories' in payload) {
      if (payload.secondaryStories === null) {
        secondaryStories = null;
      } else {
        const normalized = normalizeSectionPageSecondaryStoriesSelection(payload.secondaryStories);
        if (!normalized) return res.status(400).json({ message: 'Invalid secondaryStories payload' });
        if (normalized.mode === 'manual') {
          const missingIds = (
            await Promise.all(
              normalized.items.map(async (item) => {
                const exists = await assertDocumentExists(SECTION_PAGE_HERO_COLLECTIONS[item.type], item.id);
                return exists ? null : `${item.type}:${item.id}`;
              }),
            )
          ).filter((id): id is string => id !== null);
          if (missingIds.length > 0) {
            return res.status(404).json({ message: 'Referenced secondaryStories documents not found', missingIds });
          }
        }
        secondaryStories = normalized;
      }
    }

    if ('leSaviezVousFeature' in payload) {
      if (payload.leSaviezVousFeature === null) {
        leSaviezVousFeature = null;
      } else {
        const normalized = normalizeSectionPageLeSaviezVousSelection(payload.leSaviezVousFeature);
        if (!normalized) return res.status(400).json({ message: 'Invalid leSaviezVousFeature payload' });
        if (normalized.mode === 'manual') {
          const exists = await assertDocumentExists('articles', normalized.id);
          if (!exists) return res.status(404).json({ message: 'Referenced article not found' });
        }
        leSaviezVousFeature = normalized;
      }
    }

    if ('sidebarRail' in payload) {
      if (payload.sidebarRail === null) {
        sidebarRail = null;
      } else {
        const normalized = normalizeSectionPageSidebarRailSelection(payload.sidebarRail);
        if (!normalized) return res.status(400).json({ message: 'Invalid sidebarRail payload' });
        sidebarRail = normalized;
      }
    }

    const nextValue: ParisPagePlacementsDocument = {
      schemaVersion: 1,
      hero,
      secondaryStories,
      leSaviezVousFeature,
      sidebarRail,
      updatedAt: new Date(),
      updatedBy: null,
    };

    await parisPagePlacementsRef.set(nextValue, { merge: true });
    return res.status(200).json(nextValue);
  } catch (error) {
    console.error('Error updating paris page placements:', error);
    return res.status(500).json({ message: 'Server error while updating paris page placements' });
  }
};
