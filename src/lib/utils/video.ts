export type VideoSourceType = "upload" | "embed";
export type VideoProvider =
  | "upload"
  | "youtube"
  | "vimeo"
  | "file"
  | "embed"
  | "unknown";
export type VideoRenderMode = "upload" | "file" | "embed" | "unknown";

export interface VideoBlockData {
  type?: string;
  sourceType?: string;
  url?: string;
  caption?: string;
  provider?: string;
}

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

const VIMEO_HOSTS = new Set([
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
]);

const DIRECT_VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".ogg",
  ".ogv",
  ".m4v",
  ".mov",
];

const GENERIC_EMBED_HOST_PREFIXES = ["player.", "embed."];
const GENERIC_EMBED_PATH_PATTERNS = [
  /\/embed(?:\/|$)/i,
  /\/player(?:\/|$)/i,
  /\/video\/embed(?:\/|$)/i,
];

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

const isHttpUrl = (parsed: URL | null) =>
  Boolean(parsed && (parsed.protocol === "https:" || parsed.protocol === "http:"));

const getYouTubeVideoId = (value?: string) => {
  const parsed = safeParseUrl(value);
  if (!parsed || !YOUTUBE_HOSTS.has(parsed.hostname)) {
    return null;
  }

  if (parsed.hostname.includes("youtu.be")) {
    const shortId = parsed.pathname.split("/").filter(Boolean)[0];
    return shortId || null;
  }

  if (parsed.pathname === "/watch") {
    return parsed.searchParams.get("v");
  }

  if (parsed.pathname.startsWith("/embed/")) {
    return parsed.pathname.split("/embed/")[1]?.split("/")[0] || null;
  }

  if (parsed.pathname.startsWith("/shorts/")) {
    return parsed.pathname.split("/shorts/")[1]?.split("/")[0] || null;
  }

  return null;
};

const getVimeoVideoId = (value?: string) => {
  const parsed = safeParseUrl(value);
  if (!parsed || !VIMEO_HOSTS.has(parsed.hostname)) {
    return null;
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const lastSegment = segments[segments.length - 1];
  return /^\d+$/.test(lastSegment) ? lastSegment : null;
};

export const detectVideoProvider = (
  value?: string,
  sourceType?: string,
): VideoProvider => {
  if (sourceType === "upload") {
    return "upload";
  }
  if (getDirectVideoUrl(value)) {
    return "file";
  }
  if (getYouTubeVideoId(value)) {
    return "youtube";
  }
  if (getVimeoVideoId(value)) {
    return "vimeo";
  }
  if (getVideoEmbedUrl(value)) {
    return "embed";
  }
  return "unknown";
};

export const getDirectVideoUrl = (value?: string) => {
  const parsed = safeParseUrl(value);
  if (!isHttpUrl(parsed)) {
    return null;
  }

  const pathname = parsed.pathname.toLowerCase();
  const isDirectVideoFile = DIRECT_VIDEO_EXTENSIONS.some((extension) =>
    pathname.endsWith(extension),
  );

  return isDirectVideoFile ? parsed.toString() : null;
};

const getGenericEmbedUrl = (value?: string) => {
  const parsed = safeParseUrl(value);
  if (!isHttpUrl(parsed) || getDirectVideoUrl(value)) {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const hasEmbedHost = GENERIC_EMBED_HOST_PREFIXES.some((prefix) =>
    hostname.startsWith(prefix),
  );
  const hasEmbedPath = GENERIC_EMBED_PATH_PATTERNS.some((pattern) =>
    pattern.test(pathname),
  );

  return hasEmbedHost || hasEmbedPath ? parsed.toString() : null;
};

export const getVideoEmbedUrl = (value?: string) => {
  const youtubeId = getYouTubeVideoId(value);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  const vimeoId = getVimeoVideoId(value);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  return getGenericEmbedUrl(value);
};

export const isSupportedVideoEmbedUrl = (value?: string) =>
  Boolean(getVideoEmbedUrl(value));

export const getVideoRenderMode = (
  value?: string,
  sourceType?: string,
): VideoRenderMode => {
  if (sourceType === "upload") {
    return "upload";
  }
  if (getDirectVideoUrl(value)) {
    return "file";
  }
  if (getVideoEmbedUrl(value)) {
    return "embed";
  }
  return "unknown";
};

export const normalizeVideoBlock = <T extends VideoBlockData>(block: T): T => {
  const sourceType: VideoSourceType =
    block?.sourceType === "upload" ? "upload" : "embed";
  const url = typeof block?.url === "string" ? block.url.trim() : "";
  const caption = typeof block?.caption === "string" ? block.caption : "";
  const provider = detectVideoProvider(url, sourceType);

  return {
    ...block,
    sourceType,
    url,
    caption,
    provider,
  };
};
