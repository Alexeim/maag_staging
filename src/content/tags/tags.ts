import cultureTagsData from "./CultureTags.json";
import parisDistrictsData from "./ParisDistricts.json";
import parisSubCategoriesData from "./ParisTags.json";

export interface ParisDocumentTags {
  binaryForGuide: boolean;
  parisSubCategories: string[];
  parisDistrict?: string | null;
}

// Districts aren't a ru/en tag pair: the roman numeral is a display label
// for a stable, language-independent slug, so this shape stays separate
// from the plain-string tag dictionaries below.
export interface DistrictOption {
  title: string;
  value: string;
}

export const cultureCategoryTags = cultureTagsData.cultureTags as string[];
export const parisCategoryTags =
  parisSubCategoriesData.parisSubCategories as string[];
export const parisDistrictTags =
  parisDistrictsData.parisDistricts as DistrictOption[];

export const categoryTags = {
  culture: cultureCategoryTags,
  paris: parisCategoryTags,
} satisfies Record<"culture" | "paris", string[]>;

const tagLabelEntries = [
  ...cultureCategoryTags.map((tag) => [tag.toLowerCase(), tag] as const),
  ...parisCategoryTags.map((tag) => [tag.toLowerCase(), tag] as const),
  ...parisDistrictTags.flatMap((district) => [
    [district.value.toLowerCase(), district.title] as const,
    [district.title.toLowerCase(), district.title] as const,
  ]),
];

const legacyParisTagValues = new Set([
  "did_you_know",
  "le saviez-vous?",
  "le saviez vous?",
]);

export const knownTagLabels = Object.fromEntries(tagLabelEntries) as Record<
  string,
  string
>;

export const getKnownTagLabel = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const normalized = value.trim().toLowerCase();
  return knownTagLabels[normalized] || value.trim();
};

export const isLegacyParisTag = (value?: string | null) => {
  if (!value) {
    return false;
  }
  return legacyParisTagValues.has(value.trim().toLowerCase());
};

// Shared by every *CreatorLogic.ts: trims, dedupes, and drops the legacy
// "le saviez-vous?" junk tag for paris articles. Replaces the old per-file
// buildLegacyTagMap/normalizeTagOptions pipeline now that tag dictionaries
// are plain Russian strings (no separate title/value to reconcile).
export const normalizeTagList = (
  tags?: unknown,
  options?: { excludeLegacyParis?: boolean },
): string[] => {
  if (!Array.isArray(tags)) {
    return [];
  }
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of tags) {
    if (typeof raw !== "string") {
      continue;
    }
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }
    if (options?.excludeLegacyParis && isLegacyParisTag(trimmed)) {
      continue;
    }
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      normalized.push(trimmed);
    }
  }
  return normalized;
};
