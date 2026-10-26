import { afterEach, expect, test, vi } from "vitest";

vi.mock("firebase/auth", () => ({ signOut: vi.fn(async () => {}) }));
vi.mock("@/lib/firebase/client", () => ({ auth: {} }));
vi.mock("@/lib/i18n/document", () => ({ documentLocale: () => "ru" }));

import navbarLogic from "../src/components/common/navbarLogic";

afterEach(() => vi.unstubAllGlobals());

test("sign-out clears the SSR cookie before navigating to the homepage", async () => {
  let resolveDelete!: (response: Response) => void;
  const deletion = new Promise<Response>((resolve) => { resolveDelete = resolve; });
  const fetch = vi.fn(() => deletion);
  const location = { href: "/culture" };
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("location", location);

  const signingOut = navbarLogic().handleSignOut();
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/session", { method: "DELETE" }));
  expect(location.href).toBe("/culture");
  resolveDelete(new Response(null, { status: 200 }));
  await signingOut;
  expect(location.href).toBe("/");
});
