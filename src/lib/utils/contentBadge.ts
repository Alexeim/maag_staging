import { getKnownTagLabel } from "@/content/tags/parisTags";
import { normalizeTags } from "@/lib/utils/contentCollectionMarquee";

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
  "visual-story": "Visual Story",
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
  "visual-story": "Visual Story",
  photoOfTheDay: "Фото дня",
};

export const getTagLabel = (value: string): string =>
  TAG_LABEL_ALIASES[value.trim().toLowerCase()] ?? getKnownTagLabel(value);

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
export const getPrimaryBadgeLabel = (item: BadgeSourceItem): string => {
  if (item?.contentType === "news" || item?.isNews) {
    return "Новости";
  }
  if (item?.contentType === "interview") {
    return "Интервью";
  }

  const tags = normalizeTags(item?.tags);
  if (tags.length > 0) {
    return getTagLabel(tags[0]);
  }

  return CONTENT_TYPE_FALLBACK_LABELS[item?.contentType ?? ""] ?? "Материал";
};

// News detail page exception: shows the news item's own tag instead of the
// hardcoded "Новости" used everywhere else.
export const getNewsDetailBadgeLabel = (tags?: unknown): string => {
  const normalized = normalizeTags(tags);
  return normalized.length > 0 ? getTagLabel(normalized[0]) : "Новость";
};
