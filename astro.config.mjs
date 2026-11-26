// @ts-check
import { defineConfig } from "astro/config";
import alpinejs from "@astrojs/alpinejs";
import tailwindcss from "@tailwindcss/vite";
import compressor from "astro-compressor";

import node from "@astrojs/node";

import sitemap from "@astrojs/sitemap";

const sitemapExcludedPaths = new Set([
  "/cancel/",
  "/dashboard/",
  "/profile/",
  "/search/",
  "/sitemap-content.xml",
  "/success/",
  "/testpage/",
]);

const sitemapExcludedPathPrefixes = ["/dashboard/"];

/** @param {string} page */
const shouldIncludeInSitemap = (page) => {
  const { pathname } = new URL(page);

  return (
    !sitemapExcludedPaths.has(pathname) &&
    !sitemapExcludedPathPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
};

// @astrojs/sitemap writes static pages as "/news/" (directory style), while
// every link on the site and sitemap-content.xml use "/news". Google saw both
// and reported the slash versions as duplicates. Emit the slash-less form,
// the one Google already picked. The root "/" is left as is.
/** @param {import("@astrojs/sitemap").SitemapItem} item */
const withoutTrailingSlash = (item) => {
  const url = new URL(item.url);
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return { ...item, url: url.toString() };
};

// https://astro.build/config
export default defineConfig({
  output: "server",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  site: "https://maagfrance.fr",
  integrations: [
    alpinejs({ entrypoint: "/src/alpine-entrypoint.ts" }),
    compressor({ gzip: true, brotli: true }),
    sitemap({
      filter: shouldIncludeInSitemap,
      serialize: withoutTrailingSlash,
      customSitemaps: ["https://maagfrance.fr/sitemap-content.xml"],
    }),
  ],
  // Behind Firebase Hosting → Cloud Run, Astro trusts X-Forwarded-Host/Proto
  // only for these hosts. Without the list it sees itself as http://localhost,
  // so its origin check (checkOrigin) rejects same-site requests that carry
  // no Content-Type. All four hosts currently serve the site.
  security: {
    allowedDomains: [
      { protocol: "https", hostname: "maagfrance.fr" },
      { protocol: "https", hostname: "www.maagfrance.fr" },
      { protocol: "https", hostname: "maag-60419.web.app" },
      { protocol: "https", hostname: "maag-60419.firebaseapp.com" },
    ],
  },
  compressHTML: true,
  base: process.env.ASTRO_BASE_PATH || "/",

  vite: {
    plugins: [tailwindcss()],
  },

  server: {
    host: "0.0.0.0",
    port: 8080,
  },

  adapter: node({
    mode: "middleware",
  }),
});
