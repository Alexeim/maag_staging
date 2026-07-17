const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const STYLE_ATTR_RE = /\s+style="[^"]*"/g;
const ANCHOR_TAG_RE = /<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
const SAFE_LINK_RE = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#|\/\/)/i;
const BARE_DOMAIN_RE =
  /^(?:www\.)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?::\d+)?(?:[/?#][^\s]*)?$/i;

const normalizeRichTextHref = (value: unknown): string => {
  const href = typeof value === 'string' ? value.trim() : '';
  if (!href || /\s/.test(href)) return '';
  if (SAFE_LINK_RE.test(href)) return href;
  if (BARE_DOMAIN_RE.test(href)) return `https://${href}`;
  return '';
};

// Mirrors src/lib/utils/richText.ts on the frontend — kept as a separate copy
// because the server is a standalone package and can't import the `@/` alias.
export const normalizeStoredRichTextHtml = (value: unknown): string => {
  const html = typeof value === 'string' ? value.trim() : '';
  if (!html || html === '<p><br></p>') return '';

  return html
    .replace(STYLE_ATTR_RE, '')
    .replace(ANCHOR_TAG_RE, (_match, _quote, rawHref, innerHtml) => {
      const href = normalizeRichTextHref(rawHref);
      if (!href) return innerHtml;
      const externalAttrs =
        /^(https?:\/\/|\/\/)/i.test(href) ? ' target="_blank" rel="noreferrer"' : '';
      return `<a href="${escapeHtml(href)}"${externalAttrs}>${innerHtml}</a>`;
    });
};
