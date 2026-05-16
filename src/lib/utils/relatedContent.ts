import {
  articlesApi,
  eventsApi,
  flippersApi,
  guidesApi,
  interviewsApi,
  newsApi,
  visualStoriesApi,
  type ArticleResponse,
  type EventResponse,
  type FlipperResponse,
  type GuideResponse,
  type InterviewResponse,
  type NewsResponse,
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
  const [
    articles,
    events,
    interviews,
    guides,
    news,
    flippers,
    visualStories,
  ] = await Promise.all([
    articlesApi.list(),
    eventsApi.list(),
    interviewsApi.list(),
    guidesApi.list(),
    newsApi.list(),
    flippersApi.list(),
    visualStoriesApi.list(),
  ]);

  return {
    article: Array.isArray(articles) ? articles : [],
    event: Array.isArray(events) ? events : [],
    interview: Array.isArray(interviews) ? interviews : [],
    guide: Array.isArray(guides) ? guides : [],
    news: Array.isArray(news) ? news : [],
    flipper: Array.isArray(flippers) ? flippers : [],
    visualStory: Array.isArray(visualStories) ? visualStories : [],
  };
};
