import { defineMiddleware } from "astro:middleware";
import { authSessionApi } from "@/lib/api/api";

const SESSION_COOKIE_NAME = "session";

// Кто пришёл с запросом — кладём сюда, чтобы любая страница могла посмотреть.
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
    } catch {
      // Записка недействительна/просрочена — просто чистим её, юзер остаётся гостем.
      context.cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
    }
  }

  const isDashboardRoute = context.url.pathname.startsWith("/dashboard");

  if (isDashboardRoute && locals.user?.role !== "admin") {
    return context.redirect("/");
  }

  const isParisRoute = context.url.pathname.startsWith("/paris");

  if (isParisRoute && locals.user?.role !== "admin") {
    return context.redirect("/");
  }

  return next();
});
