// @ts-check
import { defineConfig } from "astro/config";
import alpinejs from "@astrojs/alpinejs";
import tailwindcss from "@tailwindcss/vite";
import compressor from "astro-compressor";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: 'server',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [alpinejs({ entrypoint: '/src/alpine-entrypoint.ts' }), compressor()],
  base: process.env.ASTRO_BASE_PATH || "/",

  vite: {
    plugins: [tailwindcss()],
  },

  server: {
    host: "0.0.0.0",
    port: 8080
  },

  adapter: node({
    mode: "standalone",
  }),
});