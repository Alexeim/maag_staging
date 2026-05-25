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

export type LandingNetlenkaItemType = LandingMainHeroType | 'news';

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

export interface LandingPlacementsDocument {
  schemaVersion: 2;
  mainHero: LandingMainHeroSelection | null;
  newsRail: LandingNewsRailSelection | null;
  netlenkaRail: LandingNetlenkaRailSelection | null;
  eventCard: LandingEventCardSelection | null;
  cultureInterviewBlock: LandingCultureInterviewBlockSelection | null;
  updatedAt: Date | null;
  updatedBy: string | null;
}

const db = getDb();
const placementsCollection = db.collection('editorialPlacements');
const landingPlacementsRef = placementsCollection.doc('landing');

const MAIN_HERO_COLLECTIONS: Record<LandingMainHeroType, string> = {
  article: 'articles',
  guide: 'guides',
  interview: 'interviews',
  flipper: 'flippers',
  'visual-story': 'visual-stories',
};

const NETLENKA_COLLECTIONS: Record<LandingNetlenkaItemType, string> = {
  ...MAIN_HERO_COLLECTIONS,
  news: 'news',
};

const DEFAULT_NEWS_RAIL_LIMIT = 4;
const MAX_NEWS_RAIL_LIMIT = 12;

const createDefaultLandingPlacements = (): LandingPlacementsDocument => ({
  schemaVersion: 2,
  mainHero: null,
  newsRail: {
    mode: 'auto-latest',
    limit: DEFAULT_NEWS_RAIL_LIMIT,
  },
  netlenkaRail: {
    mode: 'auto-latest',
    limit: DEFAULT_NEWS_RAIL_LIMIT,
  },
  eventCard: {
    mode: 'auto-nearest',
  },
  cultureInterviewBlock: {
    mode: 'auto-latest',
  },
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

const isAllowedMainHeroType = (value: unknown): value is LandingMainHeroType =>
  value === 'article' ||
  value === 'guide' ||
  value === 'interview' ||
  value === 'flipper' ||
  value === 'visual-story';

const isAllowedNetlenkaItemType = (
  value: unknown,
): value is LandingNetlenkaItemType => value === 'news' || isAllowedMainHeroType(value);

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

  return {
    schemaVersion: 2,
    mainHero,
    newsRail,
    netlenkaRail,
    eventCard,
    cultureInterviewBlock,
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

export const getLandingPlacements = async (_req: Request, res: Response) => {
  try {
    const landingDoc = await landingPlacementsRef.get();
    if (!landingDoc.exists) {
      return res.status(200).json(createDefaultLandingPlacements());
    }

    return res.status(200).json(normalizeLandingPlacements(landingDoc.data()));
  } catch (error) {
    console.error('Error getting landing placements:', error);
    return res
      .status(500)
      .json({ message: 'Server error while getting landing placements' });
  }
};

export const updateLandingPlacements = async (req: Request, res: Response) => {
  try {
    const currentDoc = await landingPlacementsRef.get();
    const current = normalizeLandingPlacements(currentDoc.data());
    const payload = req.body && typeof req.body === 'object' ? req.body : {};

    let mainHero = current.mainHero;
    let newsRail = current.newsRail;
    let netlenkaRail = current.netlenkaRail;
    let eventCard = current.eventCard;
    let cultureInterviewBlock = current.cultureInterviewBlock;

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
          const idsByType = new Map<LandingNetlenkaItemType, string[]>();

          normalizedNetlenkaRail.items.forEach((item) => {
            const existingIds = idsByType.get(item.type) ?? [];
            idsByType.set(item.type, [...existingIds, item.id]);
          });

          for (const [type, ids] of idsByType.entries()) {
            const missingIds = await assertDocumentsExist(NETLENKA_COLLECTIONS[type], ids);
            if (missingIds.length > 0) {
              return res.status(404).json({
                message: 'Referenced netlenka rail documents were not found',
                missingItems: missingIds.map((id) => ({ type, id })),
              });
            }
          }
        }

        netlenkaRail = normalizedNetlenkaRail;
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

    const nextValue: LandingPlacementsDocument = {
      schemaVersion: 2,
      mainHero,
      newsRail,
      netlenkaRail,
      eventCard,
      cultureInterviewBlock,
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
