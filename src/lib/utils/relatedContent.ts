import {
  articlesApi,
  eventsApi,
  flippersApi,
  guidesApi,
  interviewsApi,
  newsApi,
  photosOfTheDayApi,
  visualStoriesApi,
  type ArticleResponse,
  type EventResponse,
  type FlipperResponse,
  type GuideResponse,
  type InterviewResponse,
  type NewsResponse,
  type PhotoOfTheDayResponse,
  type VisualStoryResponse,
} from "@/lib/api/api";

export const RELATED_CONTENT_TYPES = [
  "article",
  "event",
  "interview",
  "guide",
  "news",
  "flipper",
  "visualStory",
] as const;

export type RelatedContentType = (typeof RELATED_CONTENT_TYPES)[number];
export type MaterialLinkContentType = RelatedContentType | "photoOfTheDay";

export interface RelatedContent {
  article: string[];
  event: string[];
  interview: string[];
  guide: string[];
  news: string[];
  flipper: string[];
  visualStory: string[];
}

export interface RelatedContentLists {
  article: ArticleResponse[];
  event: EventResponse[];
  interview: InterviewResponse[];
  guide: GuideResponse[];
  news: NewsResponse[];
  flipper: FlipperResponse[];
  visualStory: VisualStoryResponse[];
  photoOfTheDay: PhotoOfTheDayResponse[];
}

export const RELATED_CONTENT_TYPE_OPTIONS: Array<{
  value: RelatedContentType;
  label: string;
}> = [
  { value: "article", label: "Статья" },
  { value: "event", label: "Событие" },
  { value: "interview", label: "Интервью" },
  { value: "guide", label: "Гид" },
  { value: "news", label: "Новость" },
  { value: "flipper", label: "Флиппер" },
  { value: "visualStory", label: "Visual Story" },
];

export const MATERIAL_LINK_TYPE_OPTIONS: Array<{
  value: MaterialLinkContentType;
  label: string;
}> = [
  { value: "article", label: "Статья" },
  { value: "event", label: "Событие" },
  { value: "interview", label: "Интервью" },
  { value: "guide", label: "Гид" },
  { value: "news", label: "Новость" },
  { value: "flipper", label: "Флиппер" },
  { value: "visualStory", label: "Visual Story" },
  { value: "photoOfTheDay", label: "Фото дня" },
];

const normalizeIdList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const deduped = new Set<string>();
  const normalized: string[] = [];

  for (const rawId of value) {
    if (typeof rawId !== "string") {
      continue;
    }

    const id = rawId.trim();
    if (!id || deduped.has(id)) {
      continue;
    }

    deduped.add(id);
    normalized.push(id);
  }

  return normalized;
};

export const createEmptyRelatedContent = (): RelatedContent => ({
  article: [],
  event: [],
  interview: [],
  guide: [],
  news: [],
  flipper: [],
  visualStory: [],
});

export const createEmptyRelatedContentLists = (): RelatedContentLists => ({
  article: [],
  event: [],
  interview: [],
  guide: [],
  news: [],
  flipper: [],
  visualStory: [],
  photoOfTheDay: [],
});

export const normalizeRelatedContent = (value: unknown): RelatedContent => {
  const raw =
    value && typeof value === "object"
      ? (value as Partial<Record<RelatedContentType, unknown>>)
      : {};

  return {
    article: normalizeIdList(raw.article),
    event: normalizeIdList(raw.event),
    interview: normalizeIdList(raw.interview),
    guide: normalizeIdList(raw.guide),
    news: normalizeIdList(raw.news),
    flipper: normalizeIdList(raw.flipper),
    visualStory: normalizeIdList(raw.visualStory),
  };
};

export const sanitizeRelatedContent = (
  value: unknown,
  currentType?: RelatedContentType,
  currentId?: string | null,
): RelatedContent => {
  const normalized = normalizeRelatedContent(value);

  if (currentType && currentId) {
    normalized[currentType] = normalized[currentType].filter((id) => id !== currentId);
  }

  return normalized;
};

export const fetchRelatedContentLists = async (): Promise<RelatedContentLists> => {
  const emptyLists = createEmptyRelatedContentLists();
  const results = await Promise.allSettled([
    articlesApi.list(),
    eventsApi.list(),
    interviewsApi.list(),
    guidesApi.list(),
    newsApi.list(),
    flippersApi.list(),
    visualStoriesApi.list(),
    photosOfTheDayApi.list(),
  ]);

  const readList = <T>(index: number, fallback: T[]): T[] => {
    const result = results[index];
    if (result?.status === "fulfilled" && Array.isArray(result.value)) {
      return result.value as T[];
    }

    if (result?.status === "rejected") {
      console.warn("Failed to fetch related content list:", result.reason);
    }

    return fallback;
  };

  return {
    article: readList(0, emptyLists.article),
    event: readList(1, emptyLists.event),
    interview: readList(2, emptyLists.interview),
    guide: readList(3, emptyLists.guide),
    news: readList(4, emptyLists.news),
    flipper: readList(5, emptyLists.flipper),
    visualStory: readList(6, emptyLists.visualStory),
    photoOfTheDay: readList(7, emptyLists.photoOfTheDay),
  };
};
