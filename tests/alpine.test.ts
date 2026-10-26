import { expect, test } from "vitest";
import { alpineString } from "../src/lib/i18n/alpine";

test("alpineString makes a JS string literal for an Alpine expression", () => {
  expect(alpineString("Событие")).toBe("'Событие'");
  expect(alpineString("jusqu'au ")).toBe("'jusqu\\'au '");
  expect(alpineString("a\\b")).toBe("'a\\\\b'");
  // The literal must evaluate back to the original text.
  expect(new Function(`return ${alpineString("L'événement d'\\ici")}`)()).toBe("L'événement d'\\ici");
});
