export interface PublicationFields {
  published: boolean;
  publishedAt: Date | null;
}

const normalizePublishedAt = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  return null;
};

export const buildPublicationFieldsForCreate = (
  body: Record<string, unknown>,
  now: Date,
): PublicationFields => {
  const published = Boolean(body.published);

  return {
    published,
    publishedAt: published ? now : null,
  };
};

export const buildPublicationFieldsForUpdate = (
  body: Record<string, unknown>,
  existingData: Record<string, unknown> | undefined,
  now: Date,
): PublicationFields => {
  const published = Boolean(body.published);

  if (!published) {
    return {
      published: false,
      publishedAt: null,
    };
  }

  const existingPublishedAt = normalizePublishedAt(existingData?.publishedAt);

  return {
    published: true,
    publishedAt: existingPublishedAt ?? now,
  };
};
