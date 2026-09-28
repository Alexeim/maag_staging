import type { APIContext } from "astro";
import { readFileSync } from "node:fs";
import { beforeEach, expect, test, vi } from "vitest";

type ListApi = { list: () => Promise<unknown[]> };

// vi.mock is hoisted above the imports, so the fake API is built in vi.hoisted.
const api = vi.hoisted(() => {
  const empty = (): ListApi => ({ list: async () => [] });
  return {
    articlesApi: empty(),
    newsApi: empty(),
    guidesApi: empty(),
    eventsApi: empty(),
    interviewsApi: empty(),
    flippersApi: empty(),
    visualStoriesApi: empty(),
    photosOfTheDayApi: empty(),
    authorsApi: empty(),
  };
});

vi.mock("@/lib/api/api", () => api);

import { GET } from "@/pages/sitemap-content.xml";

type ApiName = keyof typeof api;
const API_NAMES = Object.keys(api) as ApiName[];

beforeEach(() => {
  for (const name of API_NAMES) api[name].list = async () => [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const endpoint = async (overrides: Partial<Record<ApiName, ListApi["list"]>> = {}) => {
  for (const [name, list] of Object.entries(overrides)) api[name as ApiName].list = list;
  return GET({ site: new URL("https://maagfrance.fr") } as APIContext);
};

test("published materials, existing authors, encoded tags, deduplication and dates", async () => {
  const item = {
    id: "live",
    published: true,
    authorId: "writer",
    tags: ["art & culture", "art & culture"],
    updatedAt: { seconds: 1700000000 },
  };
  const response = await endpoint({
    articlesApi: async () => [
      item,
      item,
      { ...item, id: "draft", published: false },
      { id: "legacy" },
      { ...item, id: "tip", articleType: "tips", updatedAt: { seconds: Infinity } },
    ],
    authorsApi: async () => [{ id: "writer" }, { id: "unused" }],
    photosOfTheDayApi: async () => [
      { id: "photo", published: true, authorId: "photo-only", tags: ["photo-only"] },
    ],
  });
  const xml = await response.text();
  expect(response.status).toBe(200);
  expect(xml.match(/<loc>https:\/\/maagfrance.fr\/article\/live<\/loc>/g)).toHaveLength(1);
  expect(xml).toMatch(/\/tips\/tip/);
  expect(xml).toMatch(/\/author\/writer/);
  expect(xml).toMatch(/\/tag\/art%20%26%20culture/);
  expect(xml).toMatch(/<lastmod>2023-11-14<\/lastmod>/);
  expect(xml).toMatch(/\/photo-of-the-day\/photo/);
  expect(xml).not.toMatch(/draft|legacy|unused|photo-only/);
});

test.each(API_NAMES)(
  "a failing %s returns an uncached 503 instead of a partial sitemap",
  async (name) => {
    const response = await endpoint({
      [name]: async () => {
        throw new Error("offline");
      },
    });
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("retry-after")).toBe("300");
    expect(await response.text()).not.toMatch(/<urlset/);
  },
);

// Reads the output of `npm run build`: fails until the site has been built.
test("built sitemap index includes both maps and excludes private/deleted pages", () => {
  const index = readFileSync(new URL("../dist/client/sitemap-index.xml", import.meta.url), "utf8");
  const pages = readFileSync(new URL("../dist/client/sitemap-0.xml", import.meta.url), "utf8");
  expect(index).toMatch(/https:\/\/maagfrance.fr\/sitemap-content.xml/);
  expect(index).toMatch(/https:\/\/maagfrance.fr\/sitemap-0.xml/);
  expect(pages).not.toMatch(/\/(building|dashboard|profile|success|cancel|article-variant)(\/|<)/);
});

test("static sitemap cache policy covers compressed variants without changing asset caching", () => {
  const source = readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
  const hook = source.match(/setHeaders\(res, filePath\) \{([\s\S]*?)\n      \},/)?.[1];
  if (!hook) throw new Error("setHeaders hook not found in server.mjs");

  type HeaderSink = { setHeader: (name: string, value: string) => void };
  const setHeaders = new Function("res", "filePath", hook) as (
    res: HeaderSink,
    filePath: string,
  ) => void;

  for (const file of ["sitemap-index.xml", "sitemap-0.xml", "sitemap-0.xml.gz", "sitemap-0.xml.br"]) {
    const headers: Record<string, string> = {};
    setHeaders({ setHeader: (name, value) => (headers[name] = value) }, `/dist/client/${file}`);
    expect(headers["Cache-Control"]).toBe("public, max-age=0, must-revalidate");
  }
  setHeaders(
    {
      setHeader: () => {
        throw new Error("Hashed asset cache must remain unchanged");
      },
    },
    "/dist/client/_astro/app.abc.js",
  );
});
