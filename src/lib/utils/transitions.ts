type ContentItem = {
  id?: string | number;
  href?: string;
};

export function getTransitionName(item: ContentItem): string | undefined {
  if (!item?.id) return undefined;

  const href = typeof item?.href === "string" ? item.href : "";

  if (href.startsWith("/events/")) {
    return `event-image-${item.id}`;
  }

  if (
    href.startsWith("/article/") ||
    href.startsWith("/news/") ||
    href.startsWith("/interviews/") ||
    href.startsWith("/guide/") ||
    href.startsWith("/visual-story/") ||
    href.startsWith("/flippers/")
  ) {
    return `main-article-image-${item.id}`;
  }

  return undefined;
}
