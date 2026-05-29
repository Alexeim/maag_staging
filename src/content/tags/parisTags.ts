import cultureTagsData from "./CultureTags.json";
import parisDistrictsData from "./ParisDistricts.json";
import parisSubCategoriesData from "./ParisTagsNew.json";

export interface TagOption {
  title: string;
  value: string;
}

export interface ParisDocumentTags {
  binaryForGuide: boolean;
  parisSubCategories: string[];
  parisDistrict?: string | null;
}

export const cultureCategoryTags = cultureTagsData.cultureTags as TagOption[];
export const parisCategoryTags =
  parisSubCategoriesData.parisSubCategories as TagOption[];
export const parisDistrictTags =
  parisDistrictsData.parisDistricts as TagOption[];

export const categoryTags = {
  culture: cultureCategoryTags,
  paris: parisCategoryTags,
} satisfies Record<"culture" | "paris", TagOption[]>;

const allKnownTagOptions = [
  ...cultureCategoryTags,
  ...parisCategoryTags,
  ...parisDistrictTags,
];

const tagLabelEntries = allKnownTagOptions.flatMap((tag) => [
  [tag.value.toLowerCase(), tag.title],
  [tag.title.toLowerCase(), tag.title],
]);

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
