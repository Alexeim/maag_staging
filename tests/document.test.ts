import { afterEach, expect, test } from "vitest";
import { documentLocale } from "../src/lib/i18n/document";

const setLang = (lang: string) => {
  (globalThis as { document?: unknown }).document = { documentElement: { lang } };
};

afterEach(() => {
  delete (globalThis as { document?: unknown }).document;
});

test("documentLocale reads <html lang>", () => {
  setLang("fr");
  expect(documentLocale()).toBe("fr");
  setLang("ru");
  expect(documentLocale()).toBe("ru");
});

test("an unknown language or no document falls back to Russian", () => {
  setLang("en");
  expect(documentLocale()).toBe("ru");
  delete (globalThis as { document?: unknown }).document;
  expect(documentLocale()).toBe("ru");
});
