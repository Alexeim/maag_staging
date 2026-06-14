// @ts-check
import { defineConfig } from "astro/config";
import alpinejs from "@astrojs/alpinejs";
import tailwindcss from "@tailwindcss/vite";
import compressor from "astro-compressor";

import node from "@astrojs/node";

import partytown from "@astrojs/partytown";

import sitemap from "@astrojs/sitemap";

const sitemapExcludedPaths = new Set([
  "/article-variant/",
  "/cancel/",
  "/dashboard/",
  "/profile/",
  "/sitemap-content.xml",
  "/success/",
]);

const sitemapExcludedPathPrefixes = ["/dashboard/"];

const shouldIncludeInSitemap = (page) => {
  const { pathname } = new URL(page);

  return (
    !sitemapExcludedPaths.has(pathname) &&
    !sitemapExcludedPathPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
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
    partytown(),
    sitemap({
      filter: shouldIncludeInSitemap,
    }),
  ],
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
