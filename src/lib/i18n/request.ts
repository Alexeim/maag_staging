import { splitLocalePath } from "./languageSwitch";
import type { Locale } from "./locales";

// The language of the page being rendered, for any server component: pass
// `Astro`. French section pages are Russian pages reached through a rewrite
// (src/middleware.ts), so the language is read from the original address,
// never from Astro.url.
export const getRequestLocale = (astro: { originPathname: string }): Locale =>
  splitLocalePath(astro.originPathname).locale;
