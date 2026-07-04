import type { PublicContentCardItem, PublicContentPools } from "@/lib/utils/contentCollectionMarquee";

export const hasRelatedContentEntries = (relatedContent: unknown): boolean => {
  if (!relatedContent || typeof relatedContent !== "object") {
    return false;
  }
  return Object.values(relatedContent).some(
    (value) => Array.isArray(value) && value.length > 0,
  );
};

export const buildRelatedContentItems = ({
  relatedContent,
  currentContentType,
  currentId,
  pools,
  excludeKeys = new Set(),
}: {
  relatedContent: unknown;
  currentContentType: string;
  currentId: string;
  pools: PublicContentPools;
  excludeKeys?: Set<string>;
}): PublicContentCardItem[] => {
  if (!relatedContent || typeof relatedContent !== "object") {
    return [];
  }

  const poolMaps: Record<string, Map<string, PublicContentCardItem>> = {
    article: new Map(pools.allArticles.map((item) => [item.id, item])),
    event: new Map(pools.allEvents.map((item) => [item.id, item])),
    news: new Map(pools.allNews.map((item) => [item.id, item])),
    interview: new Map(pools.allInterviews.map((item) => [item.id, item])),
    guide: new Map(pools.allGuides.map((item) => [item.id, item])),
    flipper: new Map(pools.allFlippers.map((item) => [item.id, item])),
    visualStory: new Map(pools.allVisualStories.map((item) => [item.id, item])),
  };

  const seenKeys = new Set(excludeKeys);
  const items: PublicContentCardItem[] = [];

  for (const [type, ids] of Object.entries(relatedContent)) {
    if (!Array.isArray(ids)) continue;
    const map = poolMaps[type];
    if (!map) continue;

    for (const entryId of ids as string[]) {
      if (type === currentContentType && entryId === currentId) continue;
      const key = `${type}:${entryId}`;
      if (seenKeys.has(key)) continue;
      const item = map.get(entryId);
      if (item) {
        seenKeys.add(key);
        items.push(item);
      }
    }
  }

  return items;
};
