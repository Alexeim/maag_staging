export const SITE_BRAND = "MAAG France";

const BRAND_PATTERN = /maag france/i;

/**
 * Builds the document title shared by every layout (<title>, og:title,
 * twitter:title): collapses stray whitespace from stored titles ("Охладись! "
 * → "Охладись!") and appends the brand once. Titles that already name the
 * brand — the hand-written section titles in src/lib/i18n/pageMeta.ts — are
 * kept as they are. Pages pass the bare title; never append the brand there.
 */
export const buildDocumentTitle = (title?: string): string => {
  const clean = (title ?? "").replace(/\s+/g, " ").trim();
  if (!clean) {
    return SITE_BRAND;
  }
  return BRAND_PATTERN.test(clean) ? clean : `${clean} — ${SITE_BRAND}`;
};
