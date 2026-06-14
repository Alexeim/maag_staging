import type { APIRoute } from "astro";
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
      return new Date(seconds * 1000);
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

const fetchEntries = async <T extends { id: string; updatedAt?: unknown; createdAt?: unknown }>(
  label: string,
  list: () => Promise<T[]>,
  toPath: (item: T) => string | null,
  site: URL,
) => {
  try {
    const items = await list();

    return items
      .map((item) => {
        const path = toPath(item);

        if (!path) {
          return null;
        }

        return {
          loc: absoluteUrl(site, path),
          lastmod: toLastmod(item),
        };
      })
      .filter((entry): entry is SitemapEntry => Boolean(entry));
  } catch (error) {
    console.error(`Failed to build sitemap entries for ${label}:`, error);
    return [];
  }
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

  const entryGroups = await Promise.all([
    fetchEntries("articles", () => articlesApi.list(), getArticlePath, site),
    fetchEntries("news", () => newsApi.list(), (item) => `/news/${item.id}`, site),
    fetchEntries("interviews", () => interviewsApi.list(), (item) => `/interviews/${item.id}`, site),
    fetchEntries("guides", () => guidesApi.list(), (item) => `/guide/${item.id}`, site),
    fetchEntries("events", () => eventsApi.list(), (item) => `/events/${item.id}`, site),
    fetchEntries("visual stories", () => visualStoriesApi.list(), (item) => `/visual-story/${item.id}`, site),
    fetchEntries("flippers", () => flippersApi.list(), (item) => `/flippers/${item.id}`, site),
    fetchEntries(
      "photos of the day",
      () => photosOfTheDayApi.list(),
      (item) => `/photo-of-the-day/${item.id}`,
      site,
    ),
  ]);

  const entries = entryGroups.flat();

  return new Response(renderXml(entries), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
