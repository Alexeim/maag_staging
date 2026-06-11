// @ts-check
import { defineConfig } from "astro/config";
import alpinejs from "@astrojs/alpinejs";
import tailwindcss from "@tailwindcss/vite";
import compressor from "astro-compressor";

import node from "@astrojs/node";

import partytown from "@astrojs/partytown";

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
  integrations: [
    alpinejs({ entrypoint: "/src/alpine-entrypoint.ts" }),
    compressor({ gzip: true, brotli: true }),
    partytown(),
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
