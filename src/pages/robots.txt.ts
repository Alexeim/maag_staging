import type { APIRoute } from "astro";

const getRobotsTxt = (sitemapURL: URL) => `\
User-agent: *
Allow: /
Disallow: /dashboard/

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error("Missing Astro `site` config required to generate robots.txt");
  }

  const sitemapURL = new URL("sitemap-index.xml", site);
  return new Response(getRobotsTxt(sitemapURL), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
