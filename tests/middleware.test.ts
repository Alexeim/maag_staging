import { beforeEach, expect, test, vi } from "vitest";

// vi.mock is hoisted above the imports, so the fake session check is built in
// vi.hoisted.
const session = vi.hoisted(() => ({ role: null as string | null }));

vi.mock("astro:middleware", () => ({
  defineMiddleware: <T>(handler: T) => handler,
}));
vi.mock("@/lib/api/api", () => ({
  authSessionApi: {
    verify: async () => ({ uid: "u", email: null, role: session.role }),
  },
}));

const { onRequest } = await import("../src/middleware");

const run = async (pathname: string) => {
  const rewrite = vi.fn(async () => new Response("rewritten"));
  const next = vi.fn(async () => new Response("page"));
  const context = {
    url: new URL(`http://x${pathname}`),
    request: new Request(`http://x${pathname}`),
    locals: {},
    cookies: {
      get: () => (session.role ? { value: "cookie" } : undefined),
      delete: () => {},
    },
    redirect: (to: string) => new Response(null, { status: 302, headers: { location: to } }),
    rewrite,
  };
  await (onRequest as unknown as (c: unknown, n: unknown) => Promise<Response>)(context, next);
  return { rewrite, next };
};

beforeEach(() => {
  session.role = null;
});

test("an admin gets the Russian section page under the French address", async () => {
  session.role = "admin";
  expect((await run("/fr/culture")).rewrite).toHaveBeenCalledWith("/culture");
  expect((await run("/fr/")).rewrite).toHaveBeenCalledWith("/");
  expect((await run("/fr")).rewrite).toHaveBeenCalledWith("/");
});

test("a reader is not rewritten and falls through to the 404", async () => {
  const { rewrite, next } = await run("/fr/culture");
  expect(rewrite).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalled();
});

test("only section pages are rewritten, not materials", async () => {
  session.role = "admin";
  expect((await run("/fr/article/abc")).rewrite).not.toHaveBeenCalled();
});

test("Russian addresses are never rewritten", async () => {
  session.role = "admin";
  expect((await run("/culture")).rewrite).not.toHaveBeenCalled();
});
