export interface PublicContentCardItem {
  id: string;
  title: string;
  href: string;
  imageUrl?: string | null;
  createdAt?: unknown;
  tags?: string[];
  category?: string;
  contentType: string;
  isNews?: boolean;
  articleType?: string;
  lead?: string;
  cardLead?: string;
  cardTitle?: string;
  interviewee?: string;
  mainQuote?: string;
}

export type LinkedContentLookup = Record<string, PublicContentCardItem>;

export const getLinkedContentKey = (contentType?: string, id?: string) => {
  if (!contentType || !id) {
    return "";
  }

  return `${contentType}:${id}`;
};

export const hasLinkedContentBlocks = (blocks: unknown): boolean => {
  if (!Array.isArray(blocks)) {
    return false;
  }

  return blocks.some(
    (block) =>
      block &&
      typeof block === "object" &&
      (block as { type?: string }).type === "link" &&
      typeof (block as { linkedContentType?: unknown }).linkedContentType ===
        "string" &&
      typeof (block as { linkedContentId?: unknown }).linkedContentId ===
        "string" &&
      Boolean((block as { linkedContentId?: string }).linkedContentId?.trim()),
  );
};

// Paris district codes (e.g. "district-16") live in a separate parisDistrict
// field for dashboard-created content and should never appear as a tag — but
// records written outside this app's creator forms have been seen with a
// district code as their only "tag", which then got shown as a badge.
const isDistrictTag = (value: string): boolean => /^district-\d+$/i.test(value);

export const normalizeTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter((tag) => Boolean(tag) && !isDistrictTag(tag));
};

export const toDate = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object") {
    const maybeSeconds =
      (value as { seconds?: number; _seconds?: number }).seconds ??
      (value as { seconds?: number; _seconds?: number })._seconds;
    if (typeof maybeSeconds === "number") {
      const parsed = new Date(maybeSeconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof (value as { toDate?: () => Date }).toDate === "function") {
      const parsed = (value as { toDate: () => Date }).toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime())
        ? parsed
        : null;
    }
  }
  return null;
};
