import { defineMiddleware } from "astro:middleware";
import { authSessionApi } from "@/lib/api/api";

// Must match src/pages/api/session.ts. "__session" is the only cookie name
// Firebase Hosting forwards through its rewrite to Cloud Run.
const SESSION_COOKIE_NAME = "__session";

// Whoever made the request — stored here so any page can read it.
interface SessionUser {
  uid: string;
  email: string | null;
  role: string;
}

// Public content routes whose SSR output is identical for every non-admin
// visitor — the navbar's logged-in/out state is hydrated client-side by
// Alpine, so a shared copy works for anonymous and signed-in readers alike.
// Anything not listed here (/profile, /dashboard, /calendar, /api/*,
// /success, /cancel, ...) keeps rendering per request as before.
const CACHEABLE_PATH_PREFIXES = [
  "/about",
  "/article",
  "/author",
  "/culture",
  "/events",
  "/flippers",
  "/guide",
  "/interviews",
  "/news",
  "/paris",
  "/photo-of-the-day",
  "/tag",
  "/tips",
  "/visual-story",
];

// Match "/paris" and "/paris/..." but not "/paris-foo", so a prefix can't
// bleed into an unrelated route.
const isCacheableContentPath = (pathname: string): boolean =>
  pathname === "/" ||
  CACHEABLE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

// Let the CDN keep one shared copy for 30s and serve it — while revalidating
// in the background — for another 5 min. Content is never more than ~30s
// stale; the reader never waits on the origin once the copy is warm.
const READER_CACHE_CONTROL = "public, s-maxage=30, stale-while-revalidate=300";

export const onRequest = defineMiddleware(async (context, next) => {
  const locals = context.locals as { user: SessionUser | null };
  const sessionCookie = context.cookies.get(SESSION_COOKIE_NAME)?.value;

  locals.user = null;

  // Flipped when we mutate cookies below: that response carries a Set-Cookie
  // ("your session was cleared") and must never land in a shared cache.
  let cookiesTouched = false;

  if (sessionCookie) {
    try {
      locals.user = await authSessionApi.verify(sessionCookie);
    } catch (error) {
      // Cookie is invalid/expired, or the Express call itself failed — clear it either way.
      console.error("[middleware] session verify failed:", error);
      context.cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
      cookiesTouched = true;
    }
  }

  // Dashboard is admin-only. Covers both "not logged in" (user is null) and
  // "logged in but not admin". Redirect target is outside /dashboard, so no loop.
  const isDashboardRoute = context.url.pathname.startsWith("/dashboard");

  if (isDashboardRoute && locals.user?.role !== "admin") {
    return context.redirect("/");
  }

  // /calendar, /paris gating — decide later.

  const response = await next();

  // Opt public content pages into CDN caching. Every guard has to hold, or the
  // response stays uncached exactly as it is today:
  //  - GET + 200        → a plain page view, not a mutation or an error/redirect
  //  - not an admin      → no unpublished-draft divergence (canPreviewUnpublished)
  //  - whitelisted path  → known-public content only
  //  - cookies untouched → nothing per-user is riding on this response
  if (
    context.request.method === "GET" &&
    response.status === 200 &&
    locals.user?.role !== "admin" &&
    isCacheableContentPath(context.url.pathname) &&
    !cookiesTouched &&
    !response.headers.has("set-cookie")
  ) {
    response.headers.set("Cache-Control", READER_CACHE_CONTROL);
  }

  return response;
});
