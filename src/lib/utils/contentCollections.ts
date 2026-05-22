import {
  contentCollectionsApi,
  type ContentCollectionContent,
  type ContentCollectionResponse,
} from "@/lib/api/api";

export const CONTENT_COLLECTION_TYPES = [
  "article",
  "event",
  "flipper",
  "guide",
  "interview",
  "news",
  "visualStory",
] as const;

export type ContentCollectionType = (typeof CONTENT_COLLECTION_TYPES)[number];

export interface ContentCollectionOption {
  id: string;
  title: string;
}

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

export const createEmptyContentCollectionContent = (): ContentCollectionContent => ({
  article: [],
  event: [],
  flipper: [],
  guide: [],
  interview: [],
  news: [],
  visualStory: [],
});

export const normalizeContentCollectionId = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const id = value.trim();
  return id || null;
};

export const normalizeContentCollection = (
  value: unknown,
): ContentCollectionResponse | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Partial<ContentCollectionResponse> & {
    content?: Partial<Record<ContentCollectionType, unknown>>;
  };
  const id = normalizeContentCollectionId(raw.id);
  const title = typeof raw.title === "string" ? raw.title.trim() : "";

  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    content: {
      article: normalizeIdList(raw.content?.article),
      event: normalizeIdList(raw.content?.event),
      flipper: normalizeIdList(raw.content?.flipper),
      guide: normalizeIdList(raw.content?.guide),
      interview: normalizeIdList(raw.content?.interview),
      news: normalizeIdList(raw.content?.news),
      visualStory: normalizeIdList(raw.content?.visualStory),
    },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

export const toContentCollectionOption = (
  collection: ContentCollectionResponse,
): ContentCollectionOption => ({
  id: collection.id,
  title: collection.title,
});

export const fetchContentCollections = async (): Promise<
  ContentCollectionResponse[]
> => {
  const collections = await contentCollectionsApi.list();

  if (!Array.isArray(collections)) {
    return [];
  }

  return collections
    .map((collection) => normalizeContentCollection(collection))
    .filter((collection): collection is ContentCollectionResponse => Boolean(collection));
};
