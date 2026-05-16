export interface RelatedContent {
  article: string[];
  event: string[];
  interview: string[];
  guide: string[];
  news: string[];
  flipper: string[];
  visualStory: string[];
}

const normalizeIdList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const deduped = new Set<string>();
  const normalized: string[] = [];

  value.forEach((rawId) => {
    if (typeof rawId !== 'string') {
      return;
    }

    const id = rawId.trim();
    if (!id || deduped.has(id)) {
      return;
    }

    deduped.add(id);
    normalized.push(id);
  });

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

export const normalizeRelatedContent = (value: unknown): RelatedContent => {
  const raw =
    value && typeof value === 'object'
      ? (value as Partial<Record<keyof RelatedContent, unknown>>)
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
