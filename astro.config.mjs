// @ts-check
import { defineConfig } from "astro/config";

import alpinejs from "@astrojs/alpinejs";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [alpinejs()],
  base: process.env.ASTRO_BASE_PATH || "/",
  vite: {
    plugins: [tailwindcss()],
  },
});
