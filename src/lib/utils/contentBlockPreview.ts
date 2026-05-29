type GenericRecord = Record<string, any>;

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  paragraph: "Обычный абзац",
  "first-paragraph": "Абзац с буквицей",
  h1: "Заголовок H1",
  h2: "Подзаголовок H2",
  h3: "Подзаголовок H3",
  quote: "Цитата",
  image: "Изображение",
  video: "Видео",
  "two-columns": "Две колонки",
  "three-columns": "Три колонки",
  link: "Блок-ссылка",
  "url-link": "Ссылка на URL",
  flipper: "Листалка",
  qa: "Вопрос / Ответ",
};

export const LINKED_CONTENT_TYPE_LABELS: Record<string, string> = {
  article: "Статья",
  event: "Событие",
  interview: "Интервью",
  flipper: "Флиппер",
};

export const COLUMN_CONTENT_TYPE_LABELS: Record<string, string> = {
  text: "Текст",
  image: "Изображение",
  quote: "Цитата",
};

export const normalizePreviewText = (value?: string) =>
  (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

export const truncatePreviewText = (value?: string, maxLength = 120) => {
  const normalized = normalizePreviewText(value);
  if (!normalized) {
    return "";
  }
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(maxLength - 1, 1)).trimEnd()}…`;
};

export const getBlockTypeLabel = (type?: string) => {
  if (!type) {
    return "Блок";
  }
  return BLOCK_TYPE_LABELS[type] || type;
};

export const getLinkedContentTypeLabel = (type?: string) => {
  if (!type) {
    return "Контент";
  }
  return LINKED_CONTENT_TYPE_LABELS[type] || type;
};

export const getColumnTypeLabel = (type?: string) => {
  if (!type) {
    return "Не выбрано";
  }
  return COLUMN_CONTENT_TYPE_LABELS[type] || type;
};

export const getLinkedBlockTitle = (
  block: GenericRecord | null | undefined,
  resolveLinkedTitle?: (block: GenericRecord) => string,
) => {
  if (!block || typeof block !== "object") {
    return "";
  }
  const explicitTitle =
    typeof block.linkedContentTitle === "string"
      ? block.linkedContentTitle.trim()
      : "";
  if (explicitTitle) {
    return explicitTitle;
  }
  return resolveLinkedTitle ? resolveLinkedTitle(block) : "";
};

export const getColumnPreview = (
  column: GenericRecord | null | undefined,
  maxLength = 72,
) => {
  if (!column || typeof column !== "object") {
    return "Контент не добавлен";
  }
  switch (column.type) {
    case "text":
    case "quote":
      return truncatePreviewText(column.content, maxLength) || "Текст не заполнен";
    case "image":
      return (
        column.caption?.trim() ||
        (column.content ? "Изображение загружено" : "Изображение не добавлено")
      );
    default:
      return "Контент не добавлен";
  }
};

export const getBlockSummary = (
  block: GenericRecord | null | undefined,
  options: { resolveLinkedTitle?: (block: GenericRecord) => string } = {},
) => {
  if (!block || typeof block !== "object") {
    return "";
  }
  switch (block.type) {
    case "paragraph":
    case "first-paragraph":
    case "h1":
    case "h2":
    case "h3":
    case "quote":
      return (
        truncatePreviewText(block.html || block.text, 140) || "Текст не заполнен"
      );
    case "image":
      return (
        block.caption?.trim() ||
        (block.url ? "Изображение загружено" : "Изображение не загружено")
      );
    case "video": {
      const sourceLabel =
        block.sourceType === "upload" ? "Загруженное видео" : "Ссылка / embed";
      const details =
        truncatePreviewText(block.caption, 80) ||
        truncatePreviewText(block.url, 80) ||
        "Видео не добавлено";
      return `${sourceLabel} · ${details}`;
    }
    case "two-columns":
      return `Левая колонка: ${getColumnTypeLabel(block.left?.type)} · Правая колонка: ${getColumnTypeLabel(block.right?.type)}`;
    case "three-columns":
      return `Левая: ${getColumnTypeLabel(block.left?.type)} · Центральная: ${getColumnTypeLabel(block.center?.type)} · Правая: ${getColumnTypeLabel(block.right?.type)}`;
    case "link": {
      const contentTypeLabel = getLinkedContentTypeLabel(block.linkedContentType);
      const title = getLinkedBlockTitle(block, options.resolveLinkedTitle);
      return title
        ? `${contentTypeLabel} · ${truncatePreviewText(title, 90)}`
        : `${contentTypeLabel} не выбран`;
    }
    case "url-link": {
      const linkText = truncatePreviewText(block.text, 60) || "Без текста";
      const urlText = truncatePreviewText(block.url, 70) || "URL не указан";
      return `${linkText} · ${urlText}`;
    }
    case "flipper": {
      const slidesCount = Array.isArray(block.slides) ? block.slides.length : 0;
      const firstCaption = Array.isArray(block.slides)
        ? truncatePreviewText(
            block.slides.find((slide: GenericRecord) => slide?.caption)?.caption,
            72,
          )
        : "";
      return firstCaption
        ? `${slidesCount} слайд(ов) · ${firstCaption}`
        : `${slidesCount} слайд(ов)`;
    }
    case "qa": {
      const question = truncatePreviewText(block.question, 70) || "Вопрос не заполнен";
      const answer = truncatePreviewText(block.answer, 70) || "Ответ не заполнен";
      return `В: ${question} · О: ${answer}`;
    }
    default:
      return "";
  }
};
