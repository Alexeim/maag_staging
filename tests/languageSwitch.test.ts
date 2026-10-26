import { expect, test } from "vitest";
import { buildLanguageLinks, splitLocalePath } from "../src/lib/i18n/languageSwitch";

test("splitLocalePath reads the language prefix", () => {
  expect(splitLocalePath("/fr/culture")).toEqual({ locale: "fr", path: "/culture" });
  expect(splitLocalePath("/fr/")).toEqual({ locale: "fr", path: "/" });
  expect(splitLocalePath("/fr")).toEqual({ locale: "fr", path: "/" });
  // Astro may hand the origin path back with a trailing slash.
  expect(splitLocalePath("/fr/culture/")).toEqual({ locale: "fr", path: "/culture" });
  expect(splitLocalePath("/culture")).toEqual({ locale: "ru", path: "/culture" });
  // A prefix that is not a published language is just a path.
  expect(splitLocalePath("/en/culture")).toEqual({ locale: "ru", path: "/en/culture" });
  // "ru" is the default and has no prefix of its own.
  expect(splitLocalePath("/ru/culture")).toEqual({ locale: "ru", path: "/ru/culture" });
});

test("the switcher swaps the prefix of the current address", () => {
  expect(buildLanguageLinks("/culture")).toEqual({ ru: "/culture", fr: "/fr/culture" });
  expect(buildLanguageLinks("/fr/paris/")).toEqual({ ru: "/paris", fr: "/fr/paris" });
  expect(buildLanguageLinks("/")).toEqual({ ru: "/", fr: "/fr/" });
  expect(buildLanguageLinks("/fr/")).toEqual({ ru: "/", fr: "/fr/" });
  expect(buildLanguageLinks("/article/abc")).toEqual({ ru: "/article/abc", fr: "/fr/article/abc" });
});
