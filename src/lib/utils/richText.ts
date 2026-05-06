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

export const normalizeStoredRichTextHtml = (value?: unknown) => {
  const html = typeof value === "string" ? value.trim() : "";
  if (!html || html === "<p><br></p>") {
    return "";
  }
  return html;
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
