import { expect, test } from "vitest";
import { isLocale, localizePath } from "../src/lib/i18n/locales";

test("the default language keeps today's URLs", () => {
  expect(localizePath("/", "ru")).toBe("/");
  expect(localizePath("/culture", "ru")).toBe("/culture");
});

test("other languages live under their own prefix", () => {
  expect(localizePath("/", "fr")).toBe("/fr/");
  expect(localizePath("/culture", "fr")).toBe("/fr/culture");
  expect(localizePath("/article/abc", "fr")).toBe("/fr/article/abc");
});

test("only listed languages are languages", () => {
  expect(isLocale("fr")).toBe(true);
  expect(isLocale("en")).toBe(false);
  expect(isLocale("FR")).toBe(false);
  expect(isLocale(undefined)).toBe(false);
});
