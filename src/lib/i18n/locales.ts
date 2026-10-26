// The languages the site is published in. An explicit list on purpose: a URL
// prefix or a stored value that is not in it is not a language.
export const LOCALES = ["ru", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

// The default language keeps today's URLs; every other one lives under its
// own prefix: ("/culture", "fr") → "/fr/culture", ("/", "fr") → "/fr/".
export const localizePath = (path: string, locale: Locale): string => {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}/` : `/${locale}${path}`;
};

// For Intl / toLocaleDateString: dates must follow the page's language.
export const INTL_LOCALE: Record<Locale, string> = {
  ru: "ru-RU",
  fr: "fr-FR",
};

// Open Graph wants language_TERRITORY.
export const OG_LOCALE: Record<Locale, string> = {
  ru: "ru_RU",
  fr: "fr_FR",
};

// Used when a page passes no description of its own.
export const SITE_FALLBACK_DESCRIPTION: Record<Locale, string> = {
  ru: "MAAG France — медиа о культуре, Париже и жизни во Франции.",
  fr: "MAAG France — un média sur la culture, Paris et la vie en France.",
};
