import type {
  DashboardBucket,
  DashboardMaterialRow,
  DashboardMaterialType,
} from "@/lib/api/api";

export type { DashboardBucket, DashboardMaterialRow, DashboardMaterialType };

export interface MaterialTypeMeta {
  /** Full human label, e.g. for the type filter. */
  label: string;
  /** Short label for the inline row badge. */
  badge: string;
  /** Lucide icon component name (resolved in MaterialRow.astro). */
  icon: string;
  /** Tailwind classes for the row badge. */
  badgeClass: string;
  editHref: (id: string) => string;
  viewHref: (id: string) => string;
  /** API path (relative) for DELETE. */
  deletePath: (id: string) => string;
}

// Single source of truth for every material type the dashboard knows about.
// Drives: the type filter options, row rendering, and delete routing.
export const MATERIAL_TYPES: Record<DashboardMaterialType, MaterialTypeMeta> = {
  article: {
    label: "Статья",
    badge: "Статья",
    icon: "FileText",
    badgeClass: "bg-sky-100 text-sky-700",
    editHref: (id) => `/dashboard/article/${id}/edit`,
    viewHref: (id) => `/article/${id}`,
    deletePath: (id) => `/api/articles/${id}`,
  },
  tips: {
    label: "Tips-статья",
    badge: "Tips",
    icon: "Lightbulb",
    badgeClass: "bg-amber-100 text-amber-700",
    editHref: (id) => `/dashboard/tips/${id}/edit`,
    viewHref: (id) => `/tips/${id}`,
    deletePath: (id) => `/api/articles/${id}`,
  },
  le_saviez_vous: {
    label: "Le saviez-vous",
    badge: "Le saviez-vous",
    icon: "Info",
    badgeClass: "bg-violet-100 text-violet-700",
    editHref: (id) => `/dashboard/le-saviez-vous/${id}/edit`,
    viewHref: (id) => `/article/${id}`,
    deletePath: (id) => `/api/articles/${id}`,
  },
  guide: {
    label: "Путеводитель",
    badge: "Гайд",
    icon: "Map",
    badgeClass: "bg-emerald-100 text-emerald-700",
    editHref: (id) => `/dashboard/guide/${id}/edit`,
    viewHref: (id) => `/guide/${id}`,
    deletePath: (id) => `/api/guides/${id}`,
  },
  "visual-story": {
    label: "Крупным планом",
    badge: "Крупным планом",
    icon: "GalleryVerticalEnd",
    badgeClass: "bg-fuchsia-100 text-fuchsia-700",
    editHref: (id) => `/dashboard/visual-story/${id}/edit`,
    viewHref: (id) => `/visual-story/${id}`,
    deletePath: (id) => `/api/visual-stories/${id}`,
  },
  flipper: {
    label: "Листалка",
    badge: "Листалка",
    icon: "GalleryHorizontalEnd",
    badgeClass: "bg-rose-100 text-rose-700",
    editHref: (id) => `/dashboard/flippers/edit/${id}`,
    viewHref: (id) => `/flippers/${id}`,
    deletePath: (id) => `/api/flippers/${id}`,
  },
  news: {
    label: "Новость",
    badge: "Новость",
    icon: "Newspaper",
    badgeClass: "bg-slate-200 text-slate-700",
    editHref: (id) => `/dashboard/news/${id}/edit`,
    viewHref: (id) => `/news/${id}`,
    deletePath: (id) => `/api/news/${id}`,
  },
  interview: {
    label: "Интервью",
    badge: "Интервью",
    icon: "Mic",
    badgeClass: "bg-indigo-100 text-indigo-700",
    editHref: (id) => `/dashboard/interview/${id}/edit`,
    viewHref: (id) => `/interviews/${id}`,
    deletePath: (id) => `/api/interviews/${id}`,
  },
  "photo-of-the-day": {
    label: "Фото дня",
    badge: "Фото дня",
    icon: "Camera",
    badgeClass: "bg-teal-100 text-teal-700",
    editHref: (id) => `/dashboard/photo-of-the-day/${id}/edit`,
    viewHref: (id) => `/photo-of-the-day/${id}`,
    deletePath: (id) => `/api/photos-of-the-day/${id}`,
  },
  event: {
    label: "Событие",
    badge: "Событие",
    icon: "CalendarDays",
    badgeClass: "bg-orange-100 text-orange-700",
    editHref: (id) => `/dashboard/event/${id}/edit`,
    viewHref: (id) => `/events/${id}`,
    deletePath: (id) => `/api/events/${id}`,
  },
};

// Order for the type filter dropdown.
export const MATERIAL_TYPE_ORDER: DashboardMaterialType[] = [
  "article",
  "tips",
  "le_saviez_vous",
  "guide",
  "visual-story",
  "flipper",
  "news",
  "interview",
  "photo-of-the-day",
  "event",
];

export interface BucketMeta {
  label: string;
  /** "Показать всё" target — the dedicated list page, or a filtered overview. */
  href: string;
}

export const BUCKETS: Record<DashboardBucket, BucketMeta> = {
  culture: { label: "Культура", href: "/dashboard/articles/culture" },
  paris: { label: "Париж", href: "/dashboard/articles/paris" },
  events: { label: "Календарь / события", href: "/dashboard/events" },
  none: { label: "Без категории", href: "/dashboard?cat=none" },
};

export const BUCKET_ORDER: DashboardBucket[] = [
  "culture",
  "paris",
  "events",
  "none",
];

/**
 * Robust date parser for the mix of shapes the API returns (ISO string,
 * Firestore Timestamp, {_seconds}, epoch ms). Single copy — the per-type
 * list pages each carry their own; migrate them onto this later.
 */
export const normalizeDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string") {
    const cleaned = value
      .replace(/ /g, " ")
      .replace(/\s+at\s+/i, " ")
      .replace(/UTC([+-]\d{1,2})/, "GMT$1");
    const parsed = new Date(cleaned);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object") {
    const maybe = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
      nanoseconds?: number;
      _nanoseconds?: number;
    };
    if (typeof maybe.toDate === "function") {
      const parsed = maybe.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const seconds = maybe.seconds ?? maybe._seconds ?? null;
    if (seconds !== null) {
      const nanos = maybe.nanoseconds ?? maybe._nanoseconds ?? 0;
      return new Date(seconds * 1000 + nanos / 1_000_000);
    }
  }
  return null;
};

export const formatDashboardDate = (value: unknown): string => {
  const date = normalizeDate(value);
  return date
    ? date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";
};

export const materialTypeLabel = (type: DashboardMaterialType): string =>
  MATERIAL_TYPES[type]?.label ?? type;
