import { defineMiddleware } from "astro:middleware";
import { ApiError, authSessionApi } from "@/lib/api/api";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import {
  isSharedSectionPath,
  isTranslatedMaterialPath,
  splitLocalePath,
} from "@/lib/i18n/languageSwitch";

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
      console.error("[middleware] session verify failed:", error);
      // A backend restart or transport failure does not invalidate the cookie.
      // Keep it for the next request and fail closed without a misleading 404.
      if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 400)) {
        const message = splitLocalePath(context.url.pathname).locale === "fr"
          ? "Service temporairement indisponible. Veuillez actualiser la page."
          : "Сервис временно недоступен. Обновите страницу.";
        return new Response(message, {
          status: 503,
          headers: { "Cache-Control": "private, no-store", "Retry-After": "2" },
        });
      }
      context.cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
      cookiesTouched = true;
    }
  }

  // French pages are the Russian pages with a French shell: render the
  // Russian route while the address stays /fr/…; Layout reads the language
  // from Astro.originPathname. Sections (/fr/, /fr/culture, …) reuse the
  // mixed trial content; articles and tips load their French text themselves.
  // Admins only until the French site goes public — anyone
  // else falls through to the 404 (no such file under src/pages/fr). A
  // rewrite re-runs this middleware on the Russian path, which has no
  // prefix, so it cannot loop.
  const { locale: pathLocale, path: unprefixedPath } = splitLocalePath(
    context.url.pathname,
  );
  if (
    pathLocale !== DEFAULT_LOCALE &&
    locals.user?.role === "admin" &&
    (isSharedSectionPath(unprefixedPath) || isTranslatedMaterialPath(unprefixedPath))
  ) {
    const response = await context.rewrite(unprefixedPath);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  // Dashboard is admin-only. Covers both "not logged in" (user is null) and
  // "logged in but not admin". Redirect target is outside /dashboard, so no loop.
  const isDashboardRoute = context.url.pathname.startsWith("/dashboard");
  const isTestPage = context.url.pathname.includes("testpage");

  if ((isDashboardRoute || isTestPage) && locals.user?.role !== "admin") {
    return context.redirect("/");
  }

  // /calendar, /paris gating — decide later.

  const response = await next();

  // A French 404 before sign-in must not be reused after the admin signs in.
  if (pathLocale !== DEFAULT_LOCALE) {
    response.headers.set("Cache-Control", "private, no-store");
  }

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
