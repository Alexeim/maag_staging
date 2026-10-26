import { getKnownTagLabel } from "@/content/tags/tags";
import { normalizeTags } from "@/lib/utils/contentCollectionMarquee";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import {
  FR_CONTENT_TYPE_LABELS,
  FR_FIXED_BADGES,
  FR_TAG_LABELS,
  frenchDistrictLabel,
} from "@/lib/i18n/tagLabels";

// Aliases for tag values not covered by the Paris/Culture tag dictionaries
// (legacy content-type-style tag values, English synonyms, district codes).
export const TAG_LABEL_ALIASES: Record<string, string> = {
  exhibition: "Выставка",
  exhibitions: "Выставка",
  concert: "Концерт",
  concerts: "Концерт",
  performance: "Спектакль",
  performances: "Спектакль",
  theatre: "Театр",
  theater: "Театр",
  theatres: "Театры",
  theaters: "Театры",
  culture: "Культура",
  paris: "Париж",
  books: "Книги",
  artmarket: "Арт-рынок",
  architecture: "Архитектура",
  museums: "Музеи",
  tourism: "Туризм",
  strike: "Забастовка",
  kids: "Дети",
  opera: "Опера",
  ballet: "Балет",
  dance: "Танец",
  music: "Музыка",
  route: "Маршрут",
  address: "Адрес",
  notebook: "Записная книжка",
  place: "Место",
  interview: "Интервью",
  news: "Новости",
  guide: "Гид",
  flipper: "Листалка",
  "visual-story": "Крупным планом",
  event: "Событие",
  ...Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [
      `district-${i + 1}`,
      `${i + 1}-й округ`,
    ]),
  ),
};

// Shown only for legacy items saved before the "at least one tag" guard
// existed in their creator (should not occur for newly created content).
const CONTENT_TYPE_FALLBACK_LABELS: Record<string, string> = {
  article: "Статья",
  guide: "Путеводитель",
  flipper: "Листалка",
  event: "Событие",
  "visual-story": "Крупным планом",
  photoOfTheDay: "Фото дня",
};

// Every function below defaults to Russian, so existing callers are
// unchanged; French pages pass their locale. A French label falls back to the
// Russian one when the tag has no translation yet.
export const getTagLabel = (value: string, locale: Locale = DEFAULT_LOCALE): string => {
  const key = value.trim().toLowerCase();
  const russianLabel = TAG_LABEL_ALIASES[key] ?? getKnownTagLabel(value);
  if (locale === DEFAULT_LOCALE) return russianLabel;
  return (
    frenchDistrictLabel(key) ??
    FR_TAG_LABELS[russianLabel.toLowerCase()] ??
    russianLabel
  );
};

const fixedBadge = (
  locale: Locale,
  russian: string,
  french: keyof typeof FR_FIXED_BADGES,
): string => (locale === DEFAULT_LOCALE ? russian : FR_FIXED_BADGES[french]);

interface BadgeSourceItem {
  contentType?: string;
  isNews?: boolean;
  tags?: unknown;
}

// Single source of truth for "what badge text do we show for this piece of
// content". News and interviews are exceptions to the tag-first rule:
// - news always shows "Новости" here; its own detail page shows the real
//   tag instead, via getNewsDetailBadgeLabel below.
// - interviews never had a real category, so they always show "Интервью",
//   including on their own detail page.
// Everything else (article, guide, tips, flipper, event, ...) shows its
// first tag, on every page including its own.
export const getPrimaryBadgeLabel = (
  item: BadgeSourceItem,
  locale: Locale = DEFAULT_LOCALE,
): string => {
  if (item?.contentType === "news" || item?.isNews) {
    return fixedBadge(locale, "Новости", "news");
  }
  if (item?.contentType === "interview") {
    return fixedBadge(locale, "Интервью", "interview");
  }

  const tags = normalizeTags(item?.tags);
  if (tags.length > 0) {
    return getTagLabel(tags[0], locale);
  }

  const contentType = item?.contentType ?? "";
  const typeLabels =
    locale === DEFAULT_LOCALE ? CONTENT_TYPE_FALLBACK_LABELS : FR_CONTENT_TYPE_LABELS;
  return typeLabels[contentType] ?? fixedBadge(locale, "Материал", "material");
};

// News detail page exception: shows the news item's own tag instead of the
// hardcoded "Новости" used everywhere else.
export const getNewsDetailBadgeLabel = (
  tags?: unknown,
  locale: Locale = DEFAULT_LOCALE,
): string => {
  const normalized = normalizeTags(tags);
  return normalized.length > 0
    ? getTagLabel(normalized[0], locale)
    : fixedBadge(locale, "Новость", "newsItem");
};

// Href counterpart to getNewsDetailBadgeLabel above.
export const getNewsDetailBadgeHref = (tags?: unknown): string | null => {
  const normalized = normalizeTags(tags);
  return normalized.length > 0 ? `/tag/${encodeURIComponent(normalized[0])}` : null;
};

// Where clicking the primary badge (see getPrimaryBadgeLabel above) should
// lead. News/interview badges show a content-type label rather than a real
// tag, so they point at that type's listing page instead of a tag page.
export const getPrimaryBadgeHref = (item: BadgeSourceItem): string | null => {
  if (item?.contentType === "news" || item?.isNews) {
    return "/news";
  }
  if (item?.contentType === "interview") {
    return "/interviews";
  }

  const tags = normalizeTags(item?.tags);
  return tags.length > 0 ? `/tag/${encodeURIComponent(tags[0])}` : null;
};
