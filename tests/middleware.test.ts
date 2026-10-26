import { beforeEach, expect, test, vi } from "vitest";

// vi.mock is hoisted above the imports, so the fake session check is built in
// vi.hoisted.
const session = vi.hoisted(() => ({ role: null as string | null, failure: 0 }));

vi.mock("astro:middleware", () => ({
  defineMiddleware: <T>(handler: T) => handler,
}));
vi.mock("@/lib/api/api", () => {
  class ApiError extends Error {
    constructor(public status: number) { super("API failure"); }
  }
  return {
    ApiError,
    authSessionApi: {
      verify: async () => {
        if (session.failure === 401) throw new ApiError(401);
        if (session.failure) throw new Error("Backend unavailable");
        return { uid: "u", email: null, role: session.role };
      },
    },
  };
});

const { onRequest } = await import("../src/middleware");

const run = async (pathname: string) => {
  const rewrite = vi.fn(async () => new Response("rewritten"));
  const next = vi.fn(async () => new Response("page"));
  const deleteCookie = vi.fn();
  const context = {
    url: new URL(`http://x${pathname}`),
    request: new Request(`http://x${pathname}`),
    locals: {},
    cookies: {
      get: () => (session.role ? { value: "cookie" } : undefined),
      delete: deleteCookie,
    },
    redirect: (to: string) => new Response(null, { status: 302, headers: { location: to } }),
    rewrite,
  };
  const response = await (onRequest as unknown as (c: unknown, n: unknown) => Promise<Response>)(context, next);
  return { rewrite, next, response, deleteCookie };
};

beforeEach(() => {
  session.role = null;
  session.failure = 0;
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

test("an article is rewritten (it loads its own French version)", async () => {
  session.role = "admin";
  expect((await run("/fr/article/abc")).rewrite).toHaveBeenCalledWith("/article/abc");
  expect((await run("/fr/tips/abc")).rewrite).toHaveBeenCalledWith("/tips/abc");
});

test("materials without French support are not rewritten", async () => {
  session.role = "admin";
  expect((await run("/fr/news/abc")).rewrite).not.toHaveBeenCalled();
  expect((await run("/fr/article/abc/extra")).rewrite).not.toHaveBeenCalled();
});

test("a reader never gets a French article", async () => {
  expect((await run("/fr/article/abc")).rewrite).not.toHaveBeenCalled();
});

test("Russian addresses are never rewritten", async () => {
  session.role = "admin";
  expect((await run("/culture")).rewrite).not.toHaveBeenCalled();
});

for (const role of [null, "admin"]) {
  test(`French responses are never cached (role: ${role})`, async () => {
    session.role = role;
    const { response } = await run("/fr/");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
}

test("a backend outage preserves the session and returns an uncached 503", async () => {
  session.role = "admin";
  session.failure = 1;
  const { response, deleteCookie, rewrite, next } = await run("/fr/");
  expect(response.status).toBe(503);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(deleteCookie).not.toHaveBeenCalled();
  expect(rewrite).not.toHaveBeenCalled();
  expect(next).not.toHaveBeenCalled();
});

test("an invalid session is still cleared and cannot access French pages", async () => {
  session.role = "admin";
  session.failure = 401;
  const { deleteCookie, rewrite } = await run("/fr/");
  expect(deleteCookie).toHaveBeenCalledWith("__session", { path: "/" });
  expect(rewrite).not.toHaveBeenCalled();
});

for (const path of ['/', '/culture', '/article/abc']) {
  test(`admin HTML is private and never cached: ${path}`, async () => {
    session.role = 'admin';
    const { response } = await run(path);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
}

test('anonymous Russian pages retain public caching', async () => {
  const { response } = await run('/culture');
  expect(response.headers.get('Cache-Control')).toContain('public, s-maxage=30');
});
