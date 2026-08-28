export interface TweetBlockData {
  type?: string;
  url?: string;
}

const safeParseUrl = (value?: string) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
};

const TWEET_HOSTS = new Set([
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
  "x.com",
  "www.x.com",
]);

// Extracts the numeric tweet ID from a tweet URL, or null if the URL doesn't
// point at a single tweet. Handles "/user/status/123", the old
// "/user/statuses/123", and "/i/web/status/123" (no username) shapes.
// Query params (?s=20) are already stripped out by URL.pathname.
export const getTweetId = (value?: string): string | null => {
  const parsed = safeParseUrl(value);
  if (!parsed || !TWEET_HOSTS.has(parsed.hostname.toLowerCase())) {
    return null;
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  const statusIndex = segments.findIndex(
    (segment) => segment === "status" || segment === "statuses",
  );
  if (statusIndex === -1) {
    return null;
  }

  const id = segments[statusIndex + 1];
  return id && /^\d+$/.test(id) ? id : null;
};

export const isValidTweetUrl = (value?: string): boolean =>
  Boolean(getTweetId(value));

export const normalizeTweetBlock = <T extends TweetBlockData>(block: T): T => {
  const url = typeof block?.url === "string" ? block.url.trim() : "";

  return {
    ...block,
    url,
  };
};
