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

export type LandingNetlenkaItemType = LandingMainHeroType | 'first-person';

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

// The culture section hero also accepts an interview; the Paris hero and both
// card blocks do not, so this is a separate type rather than a wider shared one.
export type LandingCultureHeroType = LandingCategoryCardsItemType | 'interview';

export interface LandingCultureHeroSelection {
  mode: 'manual';
  type: LandingCultureHeroType;
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
  cultureHero: LandingCultureHeroSelection | null;
  cultureCards: LandingCategoryCardsSelection | null;
  parisHero: LandingCategoryHeroSelection | null;
  parisCards: LandingCategoryCardsSelection | null;
  eventCard: LandingEventCardSelection | null;
  cultureInterviewBlock: LandingCultureInterviewBlockSelection | null;
  leSaviezVousFeature: SectionPageLeSaviezVousSelection | null;
  photoOfTheDayFeature: PhotoOfTheDayFeatureSelection | null;
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

// Section pages (culture/paris) also allow picking a news item, unlike the
// landing's own main hero / Netlenka rail — kept as its own union instead of
// widening LandingMainHeroType so those stay unaffected.
export type SectionPageHeroType = LandingMainHeroType | 'news';

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

export interface PhotoOfTheDayFeatureAutoSelection {
  mode: 'auto-latest';
}

export interface PhotoOfTheDayFeatureManualSelection {
  mode: 'manual';
  id: string;
}

export type PhotoOfTheDayFeatureSelection =
  | PhotoOfTheDayFeatureAutoSelection
  | PhotoOfTheDayFeatureManualSelection;

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
  schemaVersion: 2;
  hero: SectionPageHeroManualSelection | null;
  twoImageArticle: SectionPageHeroManualSelection | null;
  interviewFeature: SectionPageFeaturedInterviewSelection | null;
  secondaryStories: SectionPageSecondaryStoriesSelection | null;
  photoOfTheDayFeature: PhotoOfTheDayFeatureSelection | null;
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
  'first-person': 'firstPerson',
};

const CATEGORY_CARDS_COLLECTIONS: Record<LandingCategoryCardsItemType, string> = {
  article: MAIN_HERO_COLLECTIONS.article,
  guide: MAIN_HERO_COLLECTIONS.guide,
  flipper: MAIN_HERO_COLLECTIONS.flipper,
  'visual-story': MAIN_HERO_COLLECTIONS['visual-story'],
};

const CULTURE_HERO_COLLECTIONS: Record<LandingCultureHeroType, string> = {
  ...CATEGORY_CARDS_COLLECTIONS,
  interview: MAIN_HERO_COLLECTIONS.interview,
};

const DEFAULT_NEWS_RAIL_LIMIT = 4;
const MAX_NEWS_RAIL_LIMIT = 12;
const DEFAULT_CATEGORY_CARDS_LIMIT = 3;
const MAX_CATEGORY_CARDS_LIMIT = 3;
const CALENDAR_PAGE_CARD_LIMIT = 4;
const DEFAULT_SECTION_PAGE_SECONDARY_LIMIT = 3;
const MAX_SECTION_PAGE_SECONDARY_LIMIT = 6;
const DEFAULT_PARIS_SECONDARY_LIMIT = 2;
const DEFAULT_SECTION_PAGE_SIDEBAR_LIMIT = 4;
const MAX_SECTION_PAGE_SIDEBAR_LIMIT = 8;

const SECTION_PAGE_HERO_COLLECTIONS: Record<SectionPageHeroType, string> = {
  ...MAIN_HERO_COLLECTIONS,
  news: 'news',
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
  photoOfTheDayFeature: {
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
): value is LandingNetlenkaItemType =>
  isAllowedMainHeroType(value) || value === 'first-person';

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

const isAllowedCultureHeroType = (value: unknown): value is LandingCultureHeroType =>
  isAllowedCategoryCardsItemType(value) || value === 'interview';

// Used on both read and write: if the read path kept the category-only check,
// a saved interview would be dropped to the default on every load, silently.
const normalizeCultureHeroSelection = (
  value: unknown,
): LandingCultureHeroSelection | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const mode = (value as { mode?: unknown }).mode;
  const type = (value as { type?: unknown }).type;
  const id = normalizeStringId((value as { id?: unknown }).id);

  if (!isAllowedCultureHeroType(type) || !id || (mode !== undefined && mode !== 'manual')) {
    return null;
  }

  return {
    mode: 'manual',
    type,
    id,
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

// One stored placement field. A stored `null` means the block was turned off
// and stays off; a missing or unreadable value falls back to `fallback`.
const readPlacementField = <T>(
  value: FirebaseFirestore.DocumentData,
  key: string,
  normalize: (raw: unknown) => T | null,
  fallback: T | null,
): T | null => {
  const raw = key in value ? value[key] : undefined;
  return raw === null ? null : (normalize(raw) ?? fallback);
};

const normalizeLandingPlacements = (
  value: FirebaseFirestore.DocumentData | undefined,
): LandingPlacementsDocument => {
  const defaults = createDefaultLandingPlacements();
  if (!value || typeof value !== 'object') {
    return defaults;
  }

  return {
    schemaVersion: 4,
    mainHero: normalizeMainHeroSelection(value.mainHero),
    newsRail: readPlacementField(value, 'newsRail', normalizeNewsRailSelection, defaults.newsRail),
    netlenkaRail: readPlacementField(
      value, 'netlenkaRail', normalizeNetlenkaRailSelection, defaults.netlenkaRail,
    ),
    cultureHero: readPlacementField(
      value, 'cultureHero', normalizeCultureHeroSelection, defaults.cultureHero,
    ),
    cultureCards: readPlacementField(
      value, 'cultureCards', normalizeCategoryCardsSelection, defaults.cultureCards,
    ),
    parisHero: readPlacementField(
      value, 'parisHero', normalizeCategoryHeroSelection, defaults.parisHero,
    ),
    parisCards: readPlacementField(
      value, 'parisCards', normalizeCategoryCardsSelection, defaults.parisCards,
    ),
    // Legacy documents stored the event and the interview as bare ids.
    eventCard: readPlacementField(
      value,
      'eventCard',
      normalizeEventCardSelection,
      normalizeEventCardSelection(value.featuredEventId) ?? defaults.eventCard,
    ),
    cultureInterviewBlock: readPlacementField(
      value,
      'cultureInterviewBlock',
      normalizeCultureInterviewBlockSelection,
      normalizeCultureInterviewBlockSelection(value.featuredInterviewInCultureId)
        ?? defaults.cultureInterviewBlock,
    ),
    leSaviezVousFeature: readPlacementField(
      value,
      'leSaviezVousFeature',
      normalizeSectionPageLeSaviezVousSelection,
      defaults.leSaviezVousFeature,
    ),
    photoOfTheDayFeature: readPlacementField(
      value,
      'photoOfTheDayFeature',
      normalizePhotoOfTheDayFeatureSelection,
      defaults.photoOfTheDayFeature,
    ),
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

  return {
    schemaVersion: 1,
    mainCards: readPlacementField(
      value, 'mainCards', normalizeCalendarManualCardsSelection, defaults.mainCards,
    ),
    secondaryCards: readPlacementField(
      value, 'secondaryCards', normalizeCalendarSecondaryCardsSelection, defaults.secondaryCards,
    ),
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
  isMaagChoice: boolean;
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
        isMaagChoice: doc.exists && data?.isMaagChoice === true,
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
  if (netlenkaRail?.mode !== 'manual') {
    return netlenkaRail;
  }

  const statuses = await getNetlenkaItemStatuses(netlenkaRail.items);
  const allowedKeys = new Set(
    statuses
      .filter((item) => item.exists && item.isMaagChoice)
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
  if (selection?.mode !== 'manual') {
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

// --- Placement updates -------------------------------------------------------
// Every update handler follows one rule per field: a key missing from the
// payload keeps the current value, `null` turns the block off, anything else
// must normalize (400 otherwise) and pass its reference check (usually 404).
// The per-field part is a rule; the loop is applyPlacementPayload.

// An error response for a placement update: HTTP status plus JSON body.
interface PlacementError {
  status: number;
  body: Record<string, unknown>;
}

interface PlacementFieldRule<T> {
  normalize: (raw: unknown) => T | null;
  // Resolves to an error when the value points at documents that do not exist.
  checkReferences?: (value: T) => Promise<PlacementError | null>;
}

type PlacementFieldRules<F> = { [K in keyof F]-?: PlacementFieldRule<NonNullable<F[K]>> };

type PlacementFields<D> = Omit<D, 'schemaVersion' | 'updatedAt' | 'updatedBy'>;

// Applies the payload field by field, in the order of `rules`, and stops at the
// first failure so nothing is saved.
const applyPlacementPayload = async <F extends object>(
  payload: Record<string, unknown>,
  current: F,
  rules: PlacementFieldRules<F>,
): Promise<{ fields: F } | { error: PlacementError }> => {
  const fields = { ...current };
  for (const key of Object.keys(rules) as Array<keyof F & string>) {
    if (!(key in payload)) continue;
    const raw = payload[key];
    if (raw === null) {
      fields[key] = null as F[typeof key];
      continue;
    }

    const rule = rules[key];
    const normalized = rule.normalize(raw);
    if (!normalized) {
      return { error: { status: 400, body: { message: `Invalid ${key} payload` } } };
    }

    const referenceError = rule.checkReferences ? await rule.checkReferences(normalized) : null;
    if (referenceError) return { error: referenceError };
    fields[key] = normalized;
  }
  return { fields };
};

const notFound = (message: string, details: Record<string, unknown> = {}): PlacementError => ({
  status: 404,
  body: { message, ...details },
});

const requireDocument = async (
  collection: string,
  id: string,
  message: string,
): Promise<PlacementError | null> =>
  (await assertDocumentExists(collection, id)) ? null : notFound(message);

// A selection whose `type` names the collection (the heroes).
const requireTypedDocument =
  <K extends string>(collections: Record<K, string>, message: string) =>
  (value: { type: K; id: string }) =>
    requireDocument(collections[value.type], value.id, message);

// An `auto-*` | `manual` selection: only a manual pick references a document.
const requireManualDocument =
  (collection: string, message: string) =>
  async (value: { mode: string; id?: string }) =>
    value.mode === 'manual' && value.id ? requireDocument(collection, value.id, message) : null;

// Same for a manual list of ids in one collection; answers with `missingIds`.
const requireManualDocumentIds =
  (collection: string, message: string) =>
  async (value: { mode: string; ids?: string[] }) => {
    if (value.mode !== 'manual' || !value.ids) return null;
    const missingIds = await assertDocumentsExist(collection, value.ids);
    return missingIds.length > 0 ? notFound(message, { missingIds }) : null;
  };

const checkNetlenkaRailReferences = async (
  value: LandingNetlenkaRailSelection,
): Promise<PlacementError | null> => {
  if (value.mode !== 'manual') return null;
  const statuses = await getNetlenkaItemStatuses(value.items);

  const missingItems = statuses
    .filter((item) => !item.exists)
    .map(({ type, id }) => ({ type, id }));
  if (missingItems.length > 0) {
    return notFound('Referenced netlenka rail documents were not found', { missingItems });
  }

  const nonMaagChoiceItems = statuses
    .filter((item) => item.exists && !item.isMaagChoice)
    .map(({ type, id }) => ({ type, id }));
  if (nonMaagChoiceItems.length > 0) {
    return {
      status: 400,
      body: {
        message: 'Referenced netlenka rail documents must have isMaagChoice=true',
        nonMaagChoiceItems,
      },
    };
  }
  return null;
};

const requireCategoryCards =
  (key: string) =>
  async (value: LandingCategoryCardsSelection): Promise<PlacementError | null> => {
    if (value.mode !== 'manual') return null;
    const statuses = await getCategoryCardsItemStatuses(value.items);
    const missingItems = statuses
      .filter((item) => !item.exists)
      .map(({ type, id }) => ({ type, id }));
    return missingItems.length > 0
      ? notFound(`Referenced ${key} documents were not found`, { missingItems })
      : null;
  };

// Built per call, not at module load: several normalizers are `const`s declared
// further down this file and would not be initialized yet.
const landingPlacementRules = (): PlacementFieldRules<PlacementFields<LandingPlacementsDocument>> => ({
  mainHero: {
    normalize: normalizeMainHeroSelection,
    checkReferences: requireTypedDocument(
      MAIN_HERO_COLLECTIONS,
      'Referenced mainHero document was not found',
    ),
  },
  newsRail: {
    normalize: normalizeNewsRailSelection,
    checkReferences: requireManualDocumentIds('news', 'Referenced news documents were not found'),
  },
  netlenkaRail: {
    normalize: normalizeNetlenkaRailSelection,
    checkReferences: checkNetlenkaRailReferences,
  },
  cultureHero: {
    normalize: normalizeCultureHeroSelection,
    checkReferences: requireTypedDocument(
      CULTURE_HERO_COLLECTIONS,
      'Referenced cultureHero document was not found',
    ),
  },
  cultureCards: {
    normalize: normalizeCategoryCardsSelection,
    checkReferences: requireCategoryCards('cultureCards'),
  },
  parisHero: {
    normalize: normalizeCategoryHeroSelection,
    checkReferences: requireTypedDocument(
      CATEGORY_CARDS_COLLECTIONS,
      'Referenced parisHero document was not found',
    ),
  },
  parisCards: {
    normalize: normalizeCategoryCardsSelection,
    checkReferences: requireCategoryCards('parisCards'),
  },
  eventCard: {
    normalize: normalizeEventCardSelection,
    checkReferences: requireManualDocument(
      'events',
      'Referenced event card document was not found',
    ),
  },
  cultureInterviewBlock: {
    normalize: normalizeCultureInterviewBlockSelection,
    checkReferences: requireManualDocument(
      'interviews',
      'Referenced culture interview block document was not found',
    ),
  },
  leSaviezVousFeature: {
    normalize: normalizeSectionPageLeSaviezVousSelection,
    checkReferences: requireManualDocument(
      'articles',
      'Referenced le saviez-vous article was not found',
    ),
  },
  photoOfTheDayFeature: {
    normalize: normalizePhotoOfTheDayFeatureSelection,
    checkReferences: requireManualDocument(
      'photosOfTheDay',
      'Referenced photo of the day was not found',
    ),
  },
});

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

    const result = await applyPlacementPayload<PlacementFields<LandingPlacementsDocument>>(
      payload,
      current,
      landingPlacementRules(),
    );
    if ('error' in result) {
      return res.status(result.error.status).json(result.error.body);
    }

    // `current` starts with schemaVersion and ends with updatedAt/updatedBy, so
    // overriding them here keeps the key order of the stored document.
    const nextValue: LandingPlacementsDocument = {
      ...result.fields,
      schemaVersion: 4,
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

const calendarPagePlacementRules = (): PlacementFieldRules<
  PlacementFields<CalendarPagePlacementsDocument>
> => ({
  // Main cards are always a manual list, so the check always runs.
  mainCards: {
    normalize: normalizeCalendarManualCardsSelection,
    checkReferences: requireManualDocumentIds(
      'events',
      'Referenced mainCards event documents were not found',
    ),
  },
  secondaryCards: {
    normalize: normalizeCalendarSecondaryCardsSelection,
    checkReferences: requireManualDocumentIds(
      'events',
      'Referenced secondaryCards event documents were not found',
    ),
  },
});

export const updateCalendarPagePlacements = async (req: Request, res: Response) => {
  try {
    const currentDoc = await calendarPagePlacementsRef.get();
    const current = normalizeCalendarPagePlacements(currentDoc.data());
    const payload = req.body && typeof req.body === 'object' ? req.body : {};

    const result = await applyPlacementPayload<PlacementFields<CalendarPagePlacementsDocument>>(
      payload,
      current,
      calendarPagePlacementRules(),
    );
    if ('error' in result) {
      return res.status(result.error.status).json(result.error.body);
    }

    const nextValue: CalendarPagePlacementsDocument = {
      ...result.fields,
      schemaVersion: 1,
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
  schemaVersion: 2,
  hero: null,
  twoImageArticle: null,
  interviewFeature: { mode: 'auto-latest' },
  secondaryStories: { mode: 'auto-latest', limit: DEFAULT_PARIS_SECONDARY_LIMIT },
  photoOfTheDayFeature: { mode: 'auto-latest' },
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

// Own keys only: a plain `COLLECTIONS[type]` lookup is also truthy for
// prototype names such as "constructor" or "toString".
const isSectionPageHeroType = (value: unknown): value is SectionPageHeroType =>
  typeof value === 'string' && Object.hasOwn(SECTION_PAGE_HERO_COLLECTIONS, value);

const normalizeSectionPageHeroSelection = (
  value: unknown,
): SectionPageHeroManualSelection | null => {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (v.mode !== 'manual') return null;
  const type = v.type;
  const id = normalizeStringId(v.id);
  if (!isSectionPageHeroType(type) || !id) return null;
  return { mode: 'manual', type, id };
};

// Manual item lists of the secondary stories and the sidebar rail: drops
// entries without a type/id or with a type that has no collection.
const normalizeSectionPageItemTargets = (
  rawItems: unknown,
): SectionPageSecondaryItemTarget[] =>
  (Array.isArray(rawItems) ? rawItems : [])
    .map((item: unknown) => {
      if (!item || typeof item !== 'object') return null;
      const i = item as Record<string, unknown>;
      const type = i.type;
      const id = normalizeStringId(i.id);
      if (!isSectionPageHeroType(type) || !id) return null;
      return { type, id };
    })
    .filter((item): item is SectionPageSecondaryItemTarget => item !== null);

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
    return { mode: 'manual', items: normalizeSectionPageItemTargets(v.items) };
  }
  return null;
};

// Featured interview, "le saviez-vous" and photo of the day share one shape:
// `{ mode: 'auto-latest' } | { mode: 'manual'; id }`. The named normalizers
// below delegate here; the result is structurally assignable to each type.
const normalizeAutoLatestOrManualIdSelection = (
  value: unknown,
): { mode: 'auto-latest' } | { mode: 'manual'; id: string } | null => {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (v.mode === 'auto-latest') return { mode: 'auto-latest' };
  if (v.mode === 'manual' && typeof v.id === 'string' && v.id) {
    return { mode: 'manual', id: v.id };
  }
  return null;
};

const normalizeSectionPageFeaturedInterviewSelection = (
  value: unknown,
): SectionPageFeaturedInterviewSelection | null =>
  normalizeAutoLatestOrManualIdSelection(value);

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
    return { mode: 'manual', items: normalizeSectionPageItemTargets(v.items) };
  }
  return null;
};

const normalizeSectionPageLeSaviezVousSelection = (
  value: unknown,
): SectionPageLeSaviezVousSelection | null =>
  normalizeAutoLatestOrManualIdSelection(value);

const normalizePhotoOfTheDayFeatureSelection = (
  value: unknown,
): PhotoOfTheDayFeatureSelection | null =>
  normalizeAutoLatestOrManualIdSelection(value);

const normalizeCulturePagePlacements = (
  value: FirebaseFirestore.DocumentData | undefined,
): CulturePagePlacementsDocument => {
  const defaults = createDefaultCulturePagePlacements();
  if (!value || typeof value !== 'object') return defaults;

  return {
    schemaVersion: 1,
    hero: readPlacementField(value, 'hero', normalizeSectionPageHeroSelection, defaults.hero),
    secondaryStories: readPlacementField(
      value,
      'secondaryStories',
      normalizeSectionPageSecondaryStoriesSelection,
      defaults.secondaryStories,
    ),
    featuredInterview: readPlacementField(
      value,
      'featuredInterview',
      normalizeSectionPageFeaturedInterviewSelection,
      defaults.featuredInterview,
    ),
    sidebarRail: readPlacementField(
      value, 'sidebarRail', normalizeSectionPageSidebarRailSelection, defaults.sidebarRail,
    ),
    updatedAt: value.updatedAt instanceof Date ? value.updatedAt : value.updatedAt ?? null,
    updatedBy: normalizeStringId(value.updatedBy),
  };
};

const normalizeParisPagePlacements = (
  value: FirebaseFirestore.DocumentData | undefined,
): ParisPagePlacementsDocument => {
  const defaults = createDefaultParisPagePlacements();
  if (!value || typeof value !== 'object') return defaults;

  return {
    schemaVersion: 2,
    hero: readPlacementField(value, 'hero', normalizeSectionPageHeroSelection, defaults.hero),
    twoImageArticle: readPlacementField(
      value, 'twoImageArticle', normalizeSectionPageHeroSelection, defaults.twoImageArticle,
    ),
    interviewFeature: readPlacementField(
      value,
      'interviewFeature',
      normalizeSectionPageFeaturedInterviewSelection,
      defaults.interviewFeature,
    ),
    secondaryStories: readPlacementField(
      value,
      'secondaryStories',
      normalizeSectionPageSecondaryStoriesSelection,
      defaults.secondaryStories,
    ),
    photoOfTheDayFeature: readPlacementField(
      value,
      'photoOfTheDayFeature',
      normalizePhotoOfTheDayFeatureSelection,
      defaults.photoOfTheDayFeature,
    ),
    sidebarRail: readPlacementField(
      value, 'sidebarRail', normalizeSectionPageSidebarRailSelection, defaults.sidebarRail,
    ),
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

// Secondary stories answer with `missingIds` as "type:id" strings.
const checkSectionStoriesReferences = async (
  value: SectionPageSecondaryStoriesSelection,
): Promise<PlacementError | null> => {
  if (value.mode !== 'manual') return null;
  const missingIds = (
    await Promise.all(
      value.items.map(async (item) => {
        const exists = await assertDocumentExists(SECTION_PAGE_HERO_COLLECTIONS[item.type], item.id);
        return exists ? null : `${item.type}:${item.id}`;
      }),
    )
  ).filter((id): id is string => id !== null);
  return missingIds.length > 0
    ? notFound('Referenced secondaryStories documents not found', { missingIds })
    : null;
};

const sectionPageHeroRule = (key: string): PlacementFieldRule<SectionPageHeroManualSelection> => ({
  normalize: normalizeSectionPageHeroSelection,
  checkReferences: requireTypedDocument(
    SECTION_PAGE_HERO_COLLECTIONS,
    `Referenced ${key} document not found`,
  ),
});

const sectionPageInterviewRule = (): PlacementFieldRule<SectionPageFeaturedInterviewSelection> => ({
  normalize: normalizeSectionPageFeaturedInterviewSelection,
  checkReferences: requireManualDocument('interviews', 'Referenced interview not found'),
});

const culturePagePlacementRules = (): PlacementFieldRules<
  PlacementFields<CulturePagePlacementsDocument>
> => ({
  hero: sectionPageHeroRule('hero'),
  secondaryStories: {
    normalize: normalizeSectionPageSecondaryStoriesSelection,
    checkReferences: checkSectionStoriesReferences,
  },
  featuredInterview: sectionPageInterviewRule(),
  // The sidebar rail is not checked against the database.
  sidebarRail: { normalize: normalizeSectionPageSidebarRailSelection },
});

export const updateCulturePagePlacements = async (req: Request, res: Response) => {
  try {
    const currentDoc = await culturePagePlacementsRef.get();
    const current = normalizeCulturePagePlacements(currentDoc.data());
    const payload = req.body && typeof req.body === 'object' ? req.body : {};

    const result = await applyPlacementPayload<PlacementFields<CulturePagePlacementsDocument>>(
      payload,
      current,
      culturePagePlacementRules(),
    );
    if ('error' in result) {
      return res.status(result.error.status).json(result.error.body);
    }

    const nextValue: CulturePagePlacementsDocument = {
      ...result.fields,
      schemaVersion: 1,
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

const parisPagePlacementRules = (): PlacementFieldRules<
  PlacementFields<ParisPagePlacementsDocument>
> => ({
  hero: sectionPageHeroRule('hero'),
  twoImageArticle: sectionPageHeroRule('twoImageArticle'),
  interviewFeature: sectionPageInterviewRule(),
  secondaryStories: {
    normalize: normalizeSectionPageSecondaryStoriesSelection,
    checkReferences: checkSectionStoriesReferences,
  },
  photoOfTheDayFeature: {
    normalize: normalizePhotoOfTheDayFeatureSelection,
    checkReferences: requireManualDocument(
      'photosOfTheDay',
      'Referenced photo of the day was not found',
    ),
  },
  // The sidebar rail is not checked against the database.
  sidebarRail: { normalize: normalizeSectionPageSidebarRailSelection },
});

export const updateParisPagePlacements = async (req: Request, res: Response) => {
  try {
    const currentDoc = await parisPagePlacementsRef.get();
    const current = normalizeParisPagePlacements(currentDoc.data());
    const payload = req.body && typeof req.body === 'object' ? req.body : {};

    const result = await applyPlacementPayload<PlacementFields<ParisPagePlacementsDocument>>(
      payload,
      current,
      parisPagePlacementRules(),
    );
    if ('error' in result) {
      return res.status(result.error.status).json(result.error.body);
    }

    const nextValue: ParisPagePlacementsDocument = {
      ...result.fields,
      schemaVersion: 2,
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
