import {
  articlesApi,
  contentCollectionsApi,
  eventsApi,
  flippersApi,
  guidesApi,
  interviewsApi,
  newsApi,
  photosOfTheDayApi,
  visualStoriesApi,
} from "@/lib/api/api";

export interface PublicContentCardItem {
  id: string;
  title: string;
  href: string;
  imageUrl?: string | null;
  createdAt?: unknown;
  tags?: string[];
  category?: string;
  contentType: string;
  isNews?: boolean;
  articleType?: string;
  lead?: string;
  cardLead?: string;
  interviewee?: string;
  mainQuote?: string;
}

export type LinkedContentLookup = Record<string, PublicContentCardItem>;

export const getLinkedContentKey = (contentType?: string, id?: string) => {
  if (!contentType || !id) {
    return "";
  }

  return `${contentType}:${id}`;
};

export const hasLinkedContentBlocks = (blocks: unknown): boolean => {
  if (!Array.isArray(blocks)) {
    return false;
  }

  return blocks.some(
    (block) =>
      block &&
      typeof block === "object" &&
      (block as { type?: string }).type === "link" &&
      typeof (block as { linkedContentType?: unknown }).linkedContentType ===
        "string" &&
      typeof (block as { linkedContentId?: unknown }).linkedContentId ===
        "string" &&
      Boolean((block as { linkedContentId?: string }).linkedContentId?.trim()),
  );
};

export interface PublicContentPools {
  allArticles: PublicContentCardItem[];
  allNews: PublicContentCardItem[];
  allInterviews: PublicContentCardItem[];
  allEvents: PublicContentCardItem[];
  allFlippers: PublicContentCardItem[];
  allGuides: PublicContentCardItem[];
  allVisualStories: PublicContentCardItem[];
  allPhotosOfTheDay: PublicContentCardItem[];
}

export const normalizeTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);
};

export const toDate = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object") {
    const maybeSeconds =
      (value as { seconds?: number; _seconds?: number }).seconds ??
      (value as { seconds?: number; _seconds?: number })._seconds;
    if (typeof maybeSeconds === "number") {
      const parsed = new Date(maybeSeconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof (value as { toDate?: () => Date }).toDate === "function") {
      const parsed = (value as { toDate: () => Date }).toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime())
        ? parsed
        : null;
    }
  }
  return null;
};

export const toContentHref = (item: any) => {
  if (item?.contentType === "event") {
    return `/events/${item.id}`;
  }
  if (item?.contentType === "interview") {
    return `/interviews/${item.id}`;
  }
  if (item?.contentType === "flipper") {
    return `/flippers/${item.id}`;
  }
  if (item?.contentType === "guide") {
    return `/guide/${item.id}`;
  }
  if (item?.contentType === "visual-story") {
    return `/visual-story/${item.id}`;
  }
  if (item?.contentType === "photoOfTheDay") {
    return `/photo-of-the-day/${item.id}`;
  }
  if (item?.contentType === "article" && item?.articleType === "tips") {
    return `/tips/${item.id}`;
  }
  return `/${item?.isNews ? "news" : "article"}/${item.id}`;
};

export const fetchPublicContentPools = async (): Promise<PublicContentPools> => {
  const [
    allArticlesRaw,
    allNewsRaw,
    allInterviewsRaw,
    allEventsRaw,
    allFlippersRaw,
    allGuidesRaw,
    allVisualStoriesRaw,
    allPhotosOfTheDayRaw,
  ] = await Promise.all([
    articlesApi.list(),
    newsApi.list(),
    interviewsApi.list(),
    eventsApi.list(),
    flippersApi.list(),
    guidesApi.list(),
    visualStoriesApi.list(),
    photosOfTheDayApi.list(),
  ]);

  const allArticles = allArticlesRaw.map((article) => ({
    ...article,
    contentType: "article",
    tags: normalizeTags(article?.tags),
    href: toContentHref({ ...article, contentType: "article" }),
  }));

  const allNews = allNewsRaw.map((item) => ({
    ...item,
    isNews: true,
    contentType: "news",
    tags: normalizeTags(item?.tags),
    href: toContentHref({ ...item, isNews: true, contentType: "news" }),
  }));

  const allInterviews = allInterviewsRaw.map((item) => ({
    ...item,
    contentType: "interview",
    tags: normalizeTags(item?.tags),
    href: toContentHref({ ...item, contentType: "interview" }),
  }));

  const allEvents = allEventsRaw.map((item) => ({
    ...item,
    contentType: "event",
    tags: normalizeTags(item?.tags),
    href: toContentHref({ ...item, contentType: "event" }),
  }));

  const allFlippers = allFlippersRaw.map((item) => ({
    ...item,
    contentType: "flipper",
    imageUrl: item?.carouselContent?.[0]?.imageUrl || null,
    tags: normalizeTags(item?.tags),
    href: toContentHref({ ...item, contentType: "flipper" }),
  }));

  const allGuides = allGuidesRaw.map((item) => ({
    ...item,
    contentType: "guide",
    tags: normalizeTags(item?.tags),
    href: toContentHref({ ...item, contentType: "guide" }),
  }));

  const allVisualStories = allVisualStoriesRaw.map((item) => ({
    ...item,
    contentType: "visual-story",
    imageUrl: item?.imageUrl || item?.slides?.[0]?.imageUrl || null,
    tags: normalizeTags(item?.tags),
    href: toContentHref({ ...item, contentType: "visual-story" }),
  }));

  const allPhotosOfTheDay = allPhotosOfTheDayRaw.map((item) => ({
    ...item,
    contentType: "photoOfTheDay",
    imageUrl: item?.imageUrl || null,
    cardLead: item?.caption || "",
    tags: [],
    href: toContentHref({ ...item, contentType: "photoOfTheDay" }),
  }));

  return {
    allArticles,
    allNews,
    allInterviews,
    allEvents,
    allFlippers,
    allGuides,
    allVisualStories,
    allPhotosOfTheDay,
  };
};

export const buildContentCollectionItems = async ({
  contentCollectionId,
  currentContentType,
  currentId,
  pools,
}: {
  contentCollectionId?: string | null;
  currentContentType: string;
  currentId: string;
  pools: PublicContentPools;
}): Promise<PublicContentCardItem[]> => {
  const normalizedCollectionId =
    typeof contentCollectionId === "string" ? contentCollectionId.trim() : "";

  if (!normalizedCollectionId) {
    return [];
  }

  const collection = await contentCollectionsApi.getById(normalizedCollectionId);
  const content = collection?.content ?? {};

  const articleMap = new Map(pools.allArticles.map((item) => [item.id, item]));
  const newsMap = new Map(pools.allNews.map((item) => [item.id, item]));
  const interviewMap = new Map(pools.allInterviews.map((item) => [item.id, item]));
  const eventMap = new Map(pools.allEvents.map((item) => [item.id, item]));
  const flipperMap = new Map(pools.allFlippers.map((item) => [item.id, item]));
  const guideMap = new Map(pools.allGuides.map((item) => [item.id, item]));
  const visualStoryMap = new Map(
    pools.allVisualStories.map((item) => [item.id, item]),
  );

  const sequence = [
    ...((Array.isArray(content.article) ? content.article : []).map((entryId: string) =>
      articleMap.get(entryId),
    )),
    ...((Array.isArray(content.event) ? content.event : []).map((entryId: string) =>
      eventMap.get(entryId),
    )),
    ...((Array.isArray(content.interview) ? content.interview : []).map((entryId: string) =>
      interviewMap.get(entryId),
    )),
    ...((Array.isArray(content.guide) ? content.guide : []).map((entryId: string) =>
      guideMap.get(entryId),
    )),
    ...((Array.isArray(content.news) ? content.news : []).map((entryId: string) =>
      newsMap.get(entryId),
    )),
    ...((Array.isArray(content.flipper) ? content.flipper : []).map((entryId: string) =>
      flipperMap.get(entryId),
    )),
    ...((Array.isArray(content.visualStory) ? content.visualStory : []).map((entryId: string) =>
      visualStoryMap.get(entryId),
    )),
  ].filter((item): item is PublicContentCardItem => Boolean(item));

  const dedupedKeys = new Set<string>();

  return sequence.filter((item) => {
    const key = `${item.contentType}:${item.id}`;
    if (item.id === currentId && item.contentType === currentContentType) {
      return false;
    }
    if (dedupedKeys.has(key)) {
      return false;
    }
    dedupedKeys.add(key);
    return true;
  });
};

export const buildLinkedContentLookup = (
  pools: PublicContentPools,
): LinkedContentLookup => {
  const items = [
    ...pools.allArticles,
    ...pools.allNews,
    ...pools.allInterviews,
    ...pools.allEvents,
    ...pools.allFlippers,
    ...pools.allGuides,
    ...pools.allVisualStories,
    ...pools.allPhotosOfTheDay,
  ];

  return items.reduce<LinkedContentLookup>((lookup, item) => {
    const key = getLinkedContentKey(item.contentType, item.id);

    if (key) {
      lookup[key] = item;
    }

    if (item.contentType === "visual-story") {
      lookup[getLinkedContentKey("visualStory", item.id)] = item;
    }

    return lookup;
  }, {});
};
