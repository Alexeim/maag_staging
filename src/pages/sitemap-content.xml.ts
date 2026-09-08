import type { APIRoute } from "astro";
import {
  articlesApi,
  authorsApi,
  eventsApi,
  flippersApi,
  guidesApi,
  interviewsApi,
  newsApi,
  photosOfTheDayApi,
  visualStoriesApi,
  type ArticleResponse,
} from "@/lib/api/api";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

interface TimestampLike {
  _seconds?: number;
  seconds?: number;
}

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const URLSET_OPEN =
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
const URLSET_CLOSE = "</urlset>";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toDate = (value: unknown): Date | null => {
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
      const date = new Date(seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  return null;
};

const toLastmod = (item: { updatedAt?: unknown; createdAt?: unknown }) => {
  const date = toDate(item.updatedAt) ?? toDate(item.createdAt);
  return date?.toISOString().slice(0, 10);
};

const absoluteUrl = (site: URL, path: string) =>
  new URL(path, site).toString();

const renderUrl = ({ loc, lastmod }: SitemapEntry) => {
  const lastmodTag = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : "";
  return `<url><loc>${escapeXml(loc)}</loc>${lastmodTag}</url>`;
};

const renderXml = (entries: SitemapEntry[]) =>
  `${XML_DECLARATION}${URLSET_OPEN}${entries.map(renderUrl).join("")}${URLSET_CLOSE}`;

interface SitemapMaterial {
  id: string;
  published?: boolean;
  updatedAt?: unknown;
  createdAt?: unknown;
  authorId?: string;
  tags?: unknown;
}

const fetchEntries = async <T extends SitemapMaterial>(
  list: () => Promise<T[]>,
  toPath: (item: T) => string,
  site: URL,
  authorIds: Set<string>,
  tags: Set<string>,
  includeCollections = true,
) => {
  const items = await list();
  return items.filter((item) => item.published === true).map((item) => {
    if (includeCollections) {
      if (item.authorId) authorIds.add(item.authorId);
      if (Array.isArray(item.tags)) {
        item.tags.forEach((tag) => {
          if (typeof tag === "string" && tag.trim()) tags.add(tag.trim());
        });
      }
    }
    return { loc: absoluteUrl(site, toPath(item)), lastmod: toLastmod(item) };
  });
};

const getArticlePath = (article: ArticleResponse) => {
  if (article.articleType === "tips") {
    return `/tips/${article.id}`;
  }

  return `/article/${article.id}`;
};

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    throw new Error("Missing Astro `site` config required to generate sitemap-content.xml");
  }

  try {
    const authorIds = new Set<string>();
    const tags = new Set<string>();
    const entriesFor = <T extends SitemapMaterial>(
      list: () => Promise<T[]>,
      toPath: (item: T) => string,
      includeCollections = true,
    ) => fetchEntries(list, toPath, site, authorIds, tags, includeCollections);

    // Fail the entire request if any source is unavailable; never cache a partial map.
    const [authors, ...entryGroups] = await Promise.all([
      authorsApi.list(),
      entriesFor(() => articlesApi.list(), getArticlePath),
      entriesFor(() => newsApi.list(), (item) => `/news/${item.id}`),
      entriesFor(() => interviewsApi.list(), (item) => `/interviews/${item.id}`),
      entriesFor(() => guidesApi.list(), (item) => `/guide/${item.id}`),
      entriesFor(() => eventsApi.list(), (item) => `/events/${item.id}`),
      entriesFor(() => visualStoriesApi.list(), (item) => `/visual-story/${item.id}`),
      entriesFor(() => flippersApi.list(), (item) => `/flippers/${item.id}`),
      entriesFor(() => photosOfTheDayApi.list(), (item) => `/photo-of-the-day/${item.id}`, false),
    ]);

    const entries: SitemapEntry[] = entryGroups.flat();
    // Only list existing authors with published materials supported by their page.
    authors.filter((author) => authorIds.has(author.id)).forEach((author) => {
      entries.push({ loc: absoluteUrl(site, `/author/${encodeURIComponent(author.id)}`) });
    });
    tags.forEach((tag) => {
      entries.push({ loc: absoluteUrl(site, `/tag/${encodeURIComponent(tag)}`) });
    });
    const uniqueEntries = [...new Map(entries.map((entry) => [entry.loc, entry])).values()]
      .sort((left, right) => left.loc.localeCompare(right.loc));

    return new Response(renderXml(uniqueEntries), {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Failed to build complete content sitemap:", error);
    return new Response("Sitemap temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "300" },
    });
  }
};
