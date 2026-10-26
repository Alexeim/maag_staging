import { expect, test } from "vitest";
import {
  getNewsDetailBadgeLabel,
  getPrimaryBadgeLabel,
  getTagLabel,
} from "../src/lib/utils/contentBadge";

test("Russian labels are unchanged (the default)", () => {
  expect(getTagLabel("театр")).toBe("театр");
  expect(getTagLabel("exhibition")).toBe("Выставка");
  expect(getTagLabel("district-7")).toBe("7-й округ");
  expect(getPrimaryBadgeLabel({ contentType: "news" })).toBe("Новости");
  expect(getPrimaryBadgeLabel({ contentType: "article" })).toBe("Статья");
  expect(getNewsDetailBadgeLabel([])).toBe("Новость");
});

test("French labels for stored Russian tags, aliases and districts", () => {
  expect(getTagLabel("театр", "fr")).toBe("Théâtre");
  expect(getTagLabel(" Выставки ", "fr")).toBe("Expositions");
  expect(getTagLabel("exhibition", "fr")).toBe("Exposition");
  expect(getTagLabel("district-1", "fr")).toBe("1er arrondissement");
  expect(getTagLabel("district-7", "fr")).toBe("7e arrondissement");
});

test("French fixed badges and fallbacks", () => {
  expect(getPrimaryBadgeLabel({ contentType: "news" }, "fr")).toBe("Actualités");
  expect(getPrimaryBadgeLabel({ contentType: "interview" }, "fr")).toBe("Interview");
  expect(getPrimaryBadgeLabel({ contentType: "article", tags: ["балет"] }, "fr")).toBe("Ballet");
  expect(getPrimaryBadgeLabel({ contentType: "article" }, "fr")).toBe("Article");
  expect(getPrimaryBadgeLabel({ contentType: "unknown" }, "fr")).toBe("Contenu");
  expect(getNewsDetailBadgeLabel([], "fr")).toBe("Actualité");
});

test("an untranslated tag keeps its stored label instead of disappearing", () => {
  expect(getTagLabel("Art Basel 2026", "fr")).toBe("Art Basel 2026");
  expect(getTagLabel("новый тег", "fr")).toBe("новый тег");
});
