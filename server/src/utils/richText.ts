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

// The tags stored articles actually contain (checked against the database on
// 2026-10-26), which is also what the Quill toolbar can produce. <span> is
// left out on purpose: in the data it is only Quill's saved cursor
// (`ql-cursor`) or colour pasted in from elsewhere — dropping it keeps the text.
const ALLOWED_RICH_TEXT_TAGS = new Set(['p', 'br', 'strong', 'em', 'u', 'a']);
const TAG_TOKEN_RE = /<[^<>]*>/g;
// No whitespace allowed after "<": browsers don't read "< p>" as a tag either.
// The attribute part must start with a non-alphanumeric character, so the tag
// name and the attributes can't trade letters (no backtracking).
const TAG_PARTS_RE = /^<(\/?)([a-zA-Z0-9]+)((?:[^a-zA-Z0-9>][^>]*)?)>$/;
const HREF_ATTR_RE = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;

const escapeText = (value: string) => value.replace(/</g, '&lt;').replace(/>/g, '&gt;');

const rebuildAllowedTag = (token: string): string => {
  const parts = TAG_PARTS_RE.exec(token);
  if (!parts) return '';
  const [, closing, rawName, attrs] = parts;
  const name = rawName.toLowerCase();
  if (!ALLOWED_RICH_TEXT_TAGS.has(name)) return '';
  if (closing) return name === 'br' ? '' : `</${name}>`;
  if (name !== 'a') return `<${name}>`;

  const hrefMatch = HREF_ATTR_RE.exec(attrs);
  const href = normalizeRichTextHref(hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3]);
  if (!href) return '';
  const externalAttrs =
    /^(https?:\/\/|\/\/)/i.test(href) ? ' target="_blank" rel="noreferrer"' : '';
  return `<a href="${escapeHtml(href)}"${externalAttrs}>`;
};

// Allowlist sanitizer for rich text that did NOT come from our editor (machine
// translation). Every allowed tag is rebuilt from scratch with no original
// attributes (only a vetted href on <a>); every other tag is dropped, and any
// stray "<" / ">" in the text is escaped — so the output can contain no markup
// we did not emit ourselves. normalizeStoredRichTextHtml trusts its input and
// is not enough here.
export const sanitizeUntrustedRichTextHtml = (value: unknown): string => {
  const html = typeof value === 'string' ? value.trim() : '';
  if (!html) return '';

  let result = '';
  let lastIndex = 0;
  // Links we kept and haven't closed yet: the </a> of a rejected link is
  // dropped along with its opening tag.
  let openLinks = 0;
  for (const match of html.matchAll(TAG_TOKEN_RE)) {
    const index = match.index ?? 0;
    result += escapeText(html.slice(lastIndex, index));
    let tag = rebuildAllowedTag(match[0]);
    if (tag.startsWith('<a ')) {
      openLinks += 1;
    } else if (tag === '</a>') {
      if (openLinks > 0) openLinks -= 1;
      else tag = '';
    }
    result += tag;
    lastIndex = index + match[0].length;
  }
  result += escapeText(html.slice(lastIndex));

  return normalizeStoredRichTextHtml(result);
};

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

// Plain-text twin of a rich-text field: paragraphs and <br> become newlines,
// tags are dropped, entities decoded. Keeps the stored `text` in sync with
// `html` when only the html was translated.
export const richTextHtmlToPlainText = (value: unknown): string => {
  const html = typeof value === 'string' ? value : '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(TAG_TOKEN_RE, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => HTML_ENTITIES[entity] ?? entity)
    .trim();
};
