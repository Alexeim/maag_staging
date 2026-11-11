import { sortAndNormalizeContentBlocks } from "@/lib/utils/contentBlocks";

// Google shows roughly this many characters of a description in results.
const MAX_DESCRIPTION_LENGTH = 160;

const TEXT_BLOCK_TYPES = new Set(["first-paragraph", "paragraph"]);

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  laquo: "«",
  lt: "<",
  mdash: "—",
  nbsp: " ",
  ndash: "–",
  quot: '"',
  raquo: "»",
};

const decodeEntities = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) =>
      NAMED_ENTITIES[name.toLowerCase()] ?? match,
    );

// Rich-text HTML or plain text → one line of plain text.
const toPlainText = (value: unknown): string =>
  typeof value === "string"
    ? decodeEntities(value.replace(/<[^>]+>/g, " "))
        .replace(/\s+/g, " ")
        .trim()
    : "";

/**
 * Text for <meta name="description"> on material pages. Uses the lead; when a
 * material has none (most events and news), the first text paragraph of its
 * body; then any fallback texts (e.g. flipper slide captions). Returns "" when
 * nothing is found, so the layout falls back to the site description.
 */
export const buildMetaDescription = ({
  lead,
  blocks,
  fallbacks = [],
}: {
  lead?: unknown;
  blocks?: unknown;
  fallbacks?: unknown[];
}): string => {
  const fromLead = toPlainText(lead);
  if (fromLead) {
    return fromLead;
  }

  for (const block of sortAndNormalizeContentBlocks(blocks)) {
    if (!TEXT_BLOCK_TYPES.has(block.type)) {
      continue;
    }
    const text = toPlainText(block.html) || toPlainText(block.text);
    if (text) {
      return text;
    }
  }

  for (const fallback of fallbacks) {
    const text = toPlainText(fallback);
    if (text) {
      return text;
    }
  }

  return "";
};

/** Cuts a description to the length Google displays, at a word boundary. */
export const truncateDescription = (
  value: string,
  maxLength = MAX_DESCRIPTION_LENGTH,
): string => {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }

  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const atWord = lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${atWord.replace(/[\s,;:.—–-]+$/, "")}…`;
};
