export const PUBLIC_API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ?? "http://localhost:3000";
export const PUBLIC_FRONTEND_BASE_URL =
  import.meta.env.PUBLIC_FRONTEND_BASE_URL ?? "";

// Must match the `site` value in astro.config.mjs — used to tell internal
// links (open in the same tab) apart from external ones (open in a new tab).
export const SITE_HOST = "maagfrance.fr";
