import type { APIRoute } from "astro";

const getRobotsTxt = (sitemapIndexURL: URL, contentSitemapURL: URL) => `\
User-agent: *
Allow: /
Disallow: /dashboard/

Sitemap: ${sitemapIndexURL.href}
Sitemap: ${contentSitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error("Missing Astro `site` config required to generate robots.txt");
  }

  const sitemapIndexURL = new URL("sitemap-index.xml", site);
  const contentSitemapURL = new URL("sitemap-content.xml", site);

  return new Response(getRobotsTxt(sitemapIndexURL, contentSitemapURL), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
