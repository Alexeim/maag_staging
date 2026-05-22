export const CONTENT_COLLECTION_TYPES = [
  'article',
  'event',
  'flipper',
  'guide',
  'interview',
  'news',
  'visualStory',
] as const;

export type ContentCollectionType = (typeof CONTENT_COLLECTION_TYPES)[number];

export interface ContentCollectionContent {
  article: string[];
  event: string[];
  flipper: string[];
  guide: string[];
  interview: string[];
  news: string[];
  visualStory: string[];
}

export interface ContentCollectionRecord {
  id?: string;
  title: string;
  content: ContentCollectionContent;
  createdAt?: Date;
  updatedAt?: Date;
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
  if (typeof value !== 'string') {
    return null;
  }

  const id = value.trim();
  return id || null;
};

export const normalizeContentCollectionTitle = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const normalizeContentCollectionContent = (
  value: unknown,
): ContentCollectionContent => {
  const raw =
    value && typeof value === 'object'
      ? (value as Partial<Record<ContentCollectionType, unknown>>)
      : {};

  return {
    article: normalizeIdList(raw.article),
    event: normalizeIdList(raw.event),
    flipper: normalizeIdList(raw.flipper),
    guide: normalizeIdList(raw.guide),
    interview: normalizeIdList(raw.interview),
    news: normalizeIdList(raw.news),
    visualStory: normalizeIdList(raw.visualStory),
  };
};

export const normalizeContentCollectionRecord = (
  id: string,
  value: unknown,
): ContentCollectionRecord => {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    id,
    title: normalizeContentCollectionTitle(raw.title),
    content: normalizeContentCollectionContent(raw.content),
    createdAt: raw.createdAt instanceof Date ? raw.createdAt : undefined,
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt : undefined,
  };
};

const removeMaterialId = (ids: string[], materialId: string): string[] =>
  ids.filter((id) => id !== materialId);

const addMaterialId = (ids: string[], materialId: string): string[] => {
  if (ids.includes(materialId)) {
    return ids;
  }

  return [...ids, materialId];
};

export const syncSingleContentCollectionMembershipInTransaction = async ({
  transaction,
  collectionsCollection,
  previousCollectionId,
  nextCollectionId,
  contentType,
  materialId,
  now,
}: {
  transaction: FirebaseFirestore.Transaction;
  collectionsCollection: FirebaseFirestore.CollectionReference;
  previousCollectionId: string | null;
  nextCollectionId: string | null;
  contentType: ContentCollectionType;
  materialId: string;
  now: Date;
}) => {
  if (previousCollectionId === nextCollectionId) {
    return;
  }

  if (previousCollectionId) {
    const previousRef = collectionsCollection.doc(previousCollectionId);
    const previousSnap = await transaction.get(previousRef);

    if (previousSnap.exists) {
      const previousCollection = normalizeContentCollectionRecord(
        previousSnap.id,
        previousSnap.data(),
      );
      const nextContent = {
        ...previousCollection.content,
        [contentType]: removeMaterialId(
          previousCollection.content[contentType],
          materialId,
        ),
      };

      transaction.update(previousRef, {
        content: nextContent,
        updatedAt: now,
      });
    }
  }

  if (nextCollectionId) {
    const nextRef = collectionsCollection.doc(nextCollectionId);
    const nextSnap = await transaction.get(nextRef);

    if (!nextSnap.exists) {
      throw new Error(`Content collection ${nextCollectionId} not found`);
    }

    const nextCollection = normalizeContentCollectionRecord(
      nextSnap.id,
      nextSnap.data(),
    );
    const nextContent = {
      ...nextCollection.content,
      [contentType]: addMaterialId(nextCollection.content[contentType], materialId),
    };

    transaction.update(nextRef, {
      content: nextContent,
      updatedAt: now,
    });
  }
};
