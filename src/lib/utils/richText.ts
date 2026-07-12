import { SITE_HOST } from "@/lib/utils/constants";

type RichTextBlock = {
  html?: unknown;
  text?: unknown;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Matches any style="..." attribute — used to strip cosmetic inline styles
// that email clients embed in pasted content.
const STYLE_ATTR_RE = /\s+style="[^"]*"/g;
const ANCHOR_TAG_RE = /<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
const SAFE_LINK_RE =
  /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#|\/\/)/i;
const BARE_DOMAIN_RE =
  /^(?:www\.)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?::\d+)?(?:[/?#][^\s]*)?$/i;

const stripInlineStyles = (html: string) => html.replace(STYLE_ATTR_RE, "");

const normalizeRichTextHref = (value?: unknown) => {
  const href = typeof value === "string" ? value.trim() : "";
  if (!href || /\s/.test(href)) {
    return "";
  }

  if (SAFE_LINK_RE.test(href)) {
    return href;
  }

  if (BARE_DOMAIN_RE.test(href)) {
    return `https://${href}`;
  }

  return "";
};

// Internal links (same site, incl. relative paths/anchors/mailto/tel) stay in
// the current tab; only genuinely external domains get target="_blank".
const isInternalLink = (href: string) => {
  if (/^(mailto:|tel:)/i.test(href) || href.startsWith("#")) {
    return true;
  }
  if (href.startsWith("/") && !href.startsWith("//")) {
    return true;
  }

  try {
    const { hostname } = new URL(href, `https://${SITE_HOST}`);
    return hostname.replace(/^www\./i, "").toLowerCase() === SITE_HOST;
  } catch {
    return false;
  }
};

const sanitizeAnchorTags = (html: string) =>
  html.replace(ANCHOR_TAG_RE, (_match, _quote, rawHref, innerHtml) => {
    const href = normalizeRichTextHref(rawHref);

    if (!href) {
      return innerHtml;
    }

    const externalAttrs = isInternalLink(href)
      ? ""
      : ' target="_blank" rel="noopener noreferrer"';

    return `<a href="${escapeHtml(href)}"${externalAttrs}>${innerHtml}</a>`;
  });

const sanitizeRichTextHtml = (html: string) =>
  sanitizeAnchorTags(stripInlineStyles(html));

export const normalizeStoredRichTextHtml = (value?: unknown) => {
  const html = typeof value === "string" ? value.trim() : "";
  if (!html || html === "<p><br></p>") {
    return "";
  }
  return sanitizeRichTextHtml(html);
};

export const plainTextToRichTextHtml = (value?: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return "";
  }

  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
};

export const getInitialRichTextHtml = (block?: RichTextBlock | null) => {
  const html = normalizeStoredRichTextHtml(block?.html);
  if (html) {
    return html;
  }
  return plainTextToRichTextHtml(block?.text);
};

export const sanitizeNestedRichTextFields = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeNestedRichTextFields(item)) as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const result = Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, currentValue]) => {
      if (key === "html") {
        return [key, normalizeStoredRichTextHtml(currentValue)];
      }
      return [key, sanitizeNestedRichTextFields(currentValue)];
    }),
  );

  return result as T;
};

export const richTextHtmlToText = (value?: unknown) => {
  const html = normalizeStoredRichTextHtml(value);
  if (!html) {
    return "";
  }

  if (typeof DOMParser === "function") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  }

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
