// Safe rendering of Algolia highlights and snippets.
//
// Algolia wraps matched words in highlightPreTag/highlightPostTag but does
// not escape the rest of the text. Rendering its default <em> with x-html
// would therefore run any markup that ever lands in an indexed text. We ask
// for plain-text markers instead, split on them, and render every part with
// x-text, so nothing from the index is ever parsed as HTML.

export const HIGHLIGHT_PRE_TAG = "__maag_hl_start__";
export const HIGHLIGHT_POST_TAG = "__maag_hl_end__";

export interface HighlightPart {
  text: string;
  highlighted: boolean;
}

export const splitHighlight = (value: string): HighlightPart[] => {
  const parts: HighlightPart[] = [];
  let rest = value;

  while (rest.length > 0) {
    const start = rest.indexOf(HIGHLIGHT_PRE_TAG);
    if (start === -1) {
      parts.push({ text: rest, highlighted: false });
      break;
    }
    if (start > 0) parts.push({ text: rest.slice(0, start), highlighted: false });

    const afterPre = rest.slice(start + HIGHLIGHT_PRE_TAG.length);
    const end = afterPre.indexOf(HIGHLIGHT_POST_TAG);
    // An unclosed marker (should not happen): show the rest highlighted.
    if (end === -1) {
      if (afterPre) parts.push({ text: afterPre, highlighted: true });
      break;
    }
    if (end > 0) parts.push({ text: afterPre.slice(0, end), highlighted: true });
    rest = afterPre.slice(end + HIGHLIGHT_POST_TAG.length);
  }

  return parts;
};
