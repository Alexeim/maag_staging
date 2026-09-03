// Minimal shape of the session user that middleware puts on Astro.locals.
// Kept local so this util doesn't depend on the api module's types.
interface SessionUserLike {
  role?: string | null;
}

// Admins are allowed to open the public URL of an unpublished material and
// see it rendered (with a draft banner) instead of the usual "not found".
// Mirrors the dashboard gate in src/middleware.ts (role === "admin"), so the
// same people who can edit a draft can also preview it on its real page.
export const canPreviewUnpublished = (
  locals: { user?: SessionUserLike | null } | null | undefined,
): boolean => locals?.user?.role === "admin";
