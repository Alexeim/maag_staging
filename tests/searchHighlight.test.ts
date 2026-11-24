import { describe, expect, it } from "vitest";
import {
  HIGHLIGHT_POST_TAG as POST,
  HIGHLIGHT_PRE_TAG as PRE,
  splitHighlight,
} from "@/lib/search/highlight";

describe("splitHighlight", () => {
  it("splits marked words into highlighted parts", () => {
    expect(splitHighlight(`фильмов ${PRE}Антонин${POST}а Бодри`)).toEqual([
      { text: "фильмов ", highlighted: false },
      { text: "Антонин", highlighted: true },
      { text: "а Бодри", highlighted: false },
    ]);
  });

  it("returns one plain part when nothing matched", () => {
    expect(splitHighlight("просто текст")).toEqual([{ text: "просто текст", highlighted: false }]);
  });

  it("keeps markup in the text as plain text, never as tags", () => {
    const parts = splitHighlight(`<img src=x onerror=alert(1)> ${PRE}балет${POST}`);
    expect(parts).toEqual([
      { text: "<img src=x onerror=alert(1)> ", highlighted: false },
      { text: "балет", highlighted: true },
    ]);
  });

  it("handles several matches and adjacent markers", () => {
    expect(splitHighlight(`${PRE}a${POST}${PRE}b${POST} c`)).toEqual([
      { text: "a", highlighted: true },
      { text: "b", highlighted: true },
      { text: " c", highlighted: false },
    ]);
  });

  it("is empty for an empty string", () => {
    expect(splitHighlight("")).toEqual([]);
  });
});
