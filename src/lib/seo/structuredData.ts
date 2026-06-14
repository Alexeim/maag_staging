export type JsonLdObject = Record<string, unknown>;

interface TimestampLike {
  _seconds?: number;
  seconds?: number;
  toDate?: () => Date;
}

interface ArticleStructuredDataInput {
  siteOrigin: string;
  path: string;
  headline: string;
  description?: string;
  image?: string;
  datePublished?: unknown;
  dateModified?: unknown;
  authorName?: string;
  schemaType?: "Article" | "NewsArticle";
}

interface ImageStructuredDataInput {
  siteOrigin: string;
  path: string;
  name: string;
  description?: string;
  image: string;
  datePublished?: unknown;
  dateModified?: unknown;
  authorName?: string;
}

interface EventStructuredDataInput {
  siteOrigin: string;
  path: string;
  name: string;
  description?: string;
  image?: string;
  startDate?: unknown;
  endDate?: unknown;
  locationName?: string;
  address?: string;
  organizerName?: string;
}

export const toStructuredDataArray = (
  value?: JsonLdObject | JsonLdObject[],
) => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

export const toAbsoluteUrl = (siteOrigin: string, value?: string) => {
  if (!value) {
    return undefined;
  }

  return new URL(value, siteOrigin).toString();
};

export const toDate = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "object") {
    const timestamp = value as TimestampLike;
    const seconds = timestamp._seconds ?? timestamp.seconds;

    if (typeof seconds === "number") {
      return new Date(seconds * 1000);
    }

    if (typeof timestamp.toDate === "function") {
      const date = timestamp.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime())
        ? date
        : null;
    }
  }

  return null;
};

export const toIsoDate = (value: unknown) => toDate(value)?.toISOString();

const buildOrganizationReference = (siteOrigin: string) => ({
  "@id": toAbsoluteUrl(siteOrigin, "/#organization"),
});

const buildAuthor = (siteOrigin: string, authorName?: string) =>
  authorName?.trim()
    ? {
        "@type": "Person",
        name: authorName.trim(),
      }
    : buildOrganizationReference(siteOrigin);

const cleanText = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

export const buildArticleStructuredData = ({
  siteOrigin,
  path,
  headline,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  schemaType = "Article",
}: ArticleStructuredDataInput): JsonLdObject => ({
  "@context": "https://schema.org",
  "@type": schemaType,
  headline,
  description: cleanText(description),
  image: image ? [toAbsoluteUrl(siteOrigin, image)] : undefined,
  datePublished: toIsoDate(datePublished),
  dateModified: toIsoDate(dateModified ?? datePublished),
  author: buildAuthor(siteOrigin, authorName),
  publisher: buildOrganizationReference(siteOrigin),
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": toAbsoluteUrl(siteOrigin, path),
  },
  inLanguage: "ru",
});

export const buildImageStructuredData = ({
  siteOrigin,
  path,
  name,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
}: ImageStructuredDataInput): JsonLdObject => ({
  "@context": "https://schema.org",
  "@type": "ImageObject",
  name,
  description: cleanText(description),
  contentUrl: toAbsoluteUrl(siteOrigin, image),
  image: toAbsoluteUrl(siteOrigin, image),
  datePublished: toIsoDate(datePublished),
  dateModified: toIsoDate(dateModified ?? datePublished),
  author: buildAuthor(siteOrigin, authorName),
  publisher: buildOrganizationReference(siteOrigin),
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": toAbsoluteUrl(siteOrigin, path),
  },
  inLanguage: "ru",
});

export const buildEventStructuredData = ({
  siteOrigin,
  path,
  name,
  description,
  image,
  startDate,
  endDate,
  locationName,
  address,
  organizerName,
}: EventStructuredDataInput): JsonLdObject => ({
  "@context": "https://schema.org",
  "@type": "Event",
  name,
  description: cleanText(description),
  image: image ? [toAbsoluteUrl(siteOrigin, image)] : undefined,
  startDate: toIsoDate(startDate),
  endDate: toIsoDate(endDate),
  location: cleanText(address)
    ? {
        "@type": "Place",
        name: cleanText(locationName) ?? cleanText(address),
        address: cleanText(address),
      }
    : undefined,
  organizer: cleanText(organizerName)
    ? {
        "@type": "Organization",
        name: cleanText(organizerName),
      }
    : buildOrganizationReference(siteOrigin),
  publisher: buildOrganizationReference(siteOrigin),
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": toAbsoluteUrl(siteOrigin, path),
  },
  inLanguage: "ru",
});

export const buildGlobalStructuredData = (
  siteOrigin: string,
  toAbsoluteUrl: (value?: string) => string | undefined,
): JsonLdObject[] => {
  const organizationId = toAbsoluteUrl("/#organization");
  const websiteId = toAbsoluteUrl("/#website");

  return [
    {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      "@id": organizationId,
      name: "MAAG France",
      url: siteOrigin,
      logo: toAbsoluteUrl("/favicon.svg"),
      inLanguage: "ru",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": websiteId,
      name: "MAAG France",
      url: siteOrigin,
      inLanguage: "ru",
      publisher: {
        "@id": organizationId,
      },
    },
  ];
};
