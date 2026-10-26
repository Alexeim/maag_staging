import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  localizePath,
  type Locale,
} from "./locales";

export const LOCALE_LABELS: Record<Locale, { short: string; name: string }> = {
  ru: { short: "RU", name: "Русский" },
  fr: { short: "FR", name: "Français" },
};

// Section pages the French site serves with the Russian page's code.
const SHARED_SECTION_PATHS = new Set(["/", "/culture", "/paris", "/calendar", "/about"]);

const withoutTrailingSlash = (path: string) =>
  path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

// "/fr/culture" → { locale: "fr", path: "/culture" }; "/culture" → ru.
// The path comes back without a trailing slash (except "/").
export const splitLocalePath = (pathname: string): { locale: Locale; path: string } => {
  const [, firstSegment = "", ...rest] = pathname.split("/");
  if (isLocale(firstSegment) && firstSegment !== DEFAULT_LOCALE) {
    return { locale: firstSegment, path: withoutTrailingSlash(`/${rest.join("/")}`) };
  }
  return { locale: DEFAULT_LOCALE, path: withoutTrailingSlash(pathname) };
};

export const isSharedSectionPath = (path: string): boolean =>
  SHARED_SECTION_PATHS.has(withoutTrailingSlash(path));

// The current address in every language: just the prefix swapped.
export const buildLanguageLinks = (pathname: string): Record<Locale, string> => {
  const { path } = splitLocalePath(pathname);
  return Object.fromEntries(
    LOCALES.map((locale) => [locale, localizePath(path, locale)]),
  ) as Record<Locale, string>;
};
