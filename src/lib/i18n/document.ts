import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales";

// The page language for browser-side code (Alpine stores and *Logic.ts),
// where there is no Astro global: <html lang>, which Layout sets from the URL.
// Call it when the text is needed rather than caching it at module load.
export const documentLocale = (): Locale => {
  const lang = typeof document === "undefined" ? "" : document.documentElement.lang;
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
};
