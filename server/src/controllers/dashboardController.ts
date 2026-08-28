import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

const db = getDb();

// One dashboard "material" as consumed by the overview page. Deliberately slim:
// no `content`, no rich-text — just what the list/digest UI renders and filters on.
export interface DashboardMaterialRow {
  id: string;
  type: DashboardMaterialType;
  title: string;
  category: 'culture' | 'paris' | null;
  bucket: DashboardBucket;
  published: boolean;
  isHotContent: boolean;
  createdAt: string | null; // ISO 8601
  updatedAt: string | null; // ISO 8601
  startDate: string | null; // events only
  tags: string[];
}

export type DashboardMaterialType =
  | 'article'
  | 'tips'
  | 'le_saviez_vous'
  | 'guide'
  | 'visual-story'
  | 'flipper'
  | 'news'
  | 'interview'
  | 'photo-of-the-day'
  | 'event';

export type DashboardBucket = 'culture' | 'paris' | 'events' | 'none';

export interface DashboardOverviewPayload {
  counts: {
    total: number;
    byBucket: Record<DashboardBucket, number>;
    byStatus: { published: number; draft: number };
  };
  materials: DashboardMaterialRow[];
}

// Firestore fields we pull via `.select()` — keeps the read small even though the
// underlying docs (articles especially) are heavy.
const SELECT_FIELDS = [
  'title',
  'category',
  'published',
  'publishedAt',
  'isHotContent',
  'createdAt',
  'updatedAt',
  'tags',
  'articleType',
  'isNews',
  'startDate',
] as const;

interface SourceConfig {
  collection: string;
  resolveType: (data: FirebaseFirestore.DocumentData) => DashboardMaterialType | null;
  // Category override — interviews are always "culture", events/photos carry none.
  forcedCategory?: 'culture' | 'paris' | null;
  categoryApplies: boolean;
}

const SOURCES: SourceConfig[] = [
  {
    collection: 'articles',
    categoryApplies: true,
    resolveType: (data) => {
      if (data.isNews === true) return null; // lives in the `news` collection view
      if (data.articleType === 'tips') return 'tips';
      if (data.articleType === 'le_saviez_vous') return 'le_saviez_vous';
      return 'article';
    },
  },
  { collection: 'guides', categoryApplies: true, resolveType: () => 'guide' },
  { collection: 'visual-stories', categoryApplies: true, resolveType: () => 'visual-story' },
  { collection: 'flippers', categoryApplies: true, resolveType: () => 'flipper' },
  { collection: 'news', categoryApplies: true, resolveType: () => 'news' },
  {
    collection: 'interviews',
    categoryApplies: true,
    forcedCategory: 'culture',
    resolveType: () => 'interview',
  },
  {
    collection: 'events',
    categoryApplies: false,
    forcedCategory: null,
    resolveType: () => 'event',
  },
  {
    collection: 'photosOfTheDay',
    categoryApplies: false,
    forcedCategory: null,
    resolveType: () => 'photo-of-the-day',
  },
];

const toIso = (value: unknown): string | null => {
  if (!value) return null;
  // Firestore Timestamp
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  // Raw {_seconds,_nanoseconds} shape (Firestore Timestamp serialized)
  if (typeof value === 'object') {
    const seconds =
      (value as { seconds?: number; _seconds?: number }).seconds ??
      (value as { _seconds?: number })._seconds;
    if (typeof seconds === 'number') {
      return new Date(seconds * 1000).toISOString();
    }
  }
  return null;
};

const normalizeCategory = (value: unknown): 'culture' | 'paris' | null => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'culture') return 'culture';
  if (normalized === 'paris') return 'paris';
  return null;
};

const resolveBucket = (
  type: DashboardMaterialType,
  category: 'culture' | 'paris' | null,
): DashboardBucket => {
  if (type === 'event') return 'events';
  if (type === 'interview') return 'culture';
  if (category === 'culture') return 'culture';
  if (category === 'paris') return 'paris';
  return 'none';
};

const buildRows = async (source: SourceConfig): Promise<DashboardMaterialRow[]> => {
  const snapshot = await db
    .collection(source.collection)
    .select(...SELECT_FIELDS)
    .get();

  const rows: DashboardMaterialRow[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    const type = source.resolveType(data);
    if (!type) return;

    const category = source.categoryApplies
      ? source.forcedCategory ?? normalizeCategory(data.category)
      : source.forcedCategory ?? null;

    rows.push({
      id: doc.id,
      type,
      title: typeof data.title === 'string' ? data.title : '',
      category,
      bucket: resolveBucket(type, category),
      published: data.published === true,
      isHotContent: data.isHotContent === true,
      createdAt: toIso(data.createdAt) ?? toIso(data.publishedAt),
      updatedAt: toIso(data.updatedAt),
      startDate: toIso(data.startDate),
      tags: Array.isArray(data.tags)
        ? data.tags.map((tag: unknown) => String(tag)).filter(Boolean)
        : [],
    });
  });

  return rows;
};

const sortKey = (row: DashboardMaterialRow) =>
  Date.parse(row.updatedAt ?? row.createdAt ?? '') || 0;

const buildOverviewPayload = async (): Promise<DashboardOverviewPayload> => {
  const groups = await Promise.all(SOURCES.map(buildRows));
  const materials = groups.flat().sort((left, right) => sortKey(right) - sortKey(left));

  const byBucket: Record<DashboardBucket, number> = {
    culture: 0,
    paris: 0,
    events: 0,
    none: 0,
  };
  let published = 0;
  for (const row of materials) {
    byBucket[row.bucket] += 1;
    if (row.published) published += 1;
  }

  return {
    counts: {
      total: materials.length,
      byBucket,
      byStatus: { published, draft: materials.length - published },
    },
    materials,
  };
};

// Short-lived cache: the overview fans out ~1k Firestore reads, and the dashboard
// tends to be reloaded in bursts. 45s is well within "fresh enough" for an editor.
const CACHE_TTL_MS = 45_000;
let cache: { at: number; payload: DashboardOverviewPayload } | null = null;

/**
 * GET /api/dashboard/overview
 * Aggregated, slimmed-down list of every material for the dashboard home.
 */
export const getDashboardOverview = async (_req: Request, res: Response) => {
  try {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
      return res.status(200).json(cache.payload);
    }

    const payload = await buildOverviewPayload();
    cache = { at: Date.now(), payload };
    res.status(200).json(payload);
  } catch (error) {
    console.error('Error building dashboard overview:', error);
    res.status(500).json({ message: 'Server error while building dashboard overview' });
  }
};
