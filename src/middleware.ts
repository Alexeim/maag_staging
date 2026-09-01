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

export const onRequest = defineMiddleware(async (context, next) => {
  const locals = context.locals as { user: SessionUser | null };
  const sessionCookie = context.cookies.get(SESSION_COOKIE_NAME)?.value;

  locals.user = null;

  if (sessionCookie) {
    try {
      locals.user = await authSessionApi.verify(sessionCookie);
    } catch (error) {
      // Cookie is invalid/expired, or the Express call itself failed — clear it either way.
      console.error("[middleware] session verify failed:", error);
      context.cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
    }
  }

  // Dashboard is admin-only. Covers both "not logged in" (user is null) and
  // "logged in but not admin". Redirect target is outside /dashboard, so no loop.
  const isDashboardRoute = context.url.pathname.startsWith("/dashboard");

  if (isDashboardRoute && locals.user?.role !== "admin") {
    return context.redirect("/");
  }

  // /calendar, /paris gating — decide later.

  return next();
});
