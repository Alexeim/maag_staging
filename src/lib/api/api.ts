import { PUBLIC_API_BASE_URL } from "@/lib/utils/constants";
import type { RelatedContent } from "@/lib/utils/relatedContent";

export type ApiQueryValue = string | number | boolean | undefined | null;

export interface ApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  token?: string;
  // Firebase session-cookie value, forwarded as X-Session-Cookie. For SSR calls
  // where there is no Bearer ID token but there is a __session cookie.
  sessionCookie?: string;
  baseUrl?: string;
  query?: Record<string, ApiQueryValue>;
  signal?: AbortSignal;
  public?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public body: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiTimestamp = string | Date | { _seconds: number } | null;

const isJsonLike = (value: unknown): boolean =>
  typeof value === "object" && value !== null && !(value instanceof FormData);

// Client-only auth hook. The browser entrypoint registers a provider that
// returns the current Firebase ID token; SSR leaves it as the no-op default.
// Write requests without an explicit token fall back to this.
type AuthTokenProvider = () => Promise<string | undefined> | string | undefined;
let authTokenProvider: AuthTokenProvider = () => undefined;

export const setAuthTokenProvider = (provider: AuthTokenProvider): void => {
  authTokenProvider = provider;
};

export async function request<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    headers = {},
    body,
    token,
    sessionCookie,
    baseUrl,
    query,
    signal,
    public: isPublic = false,
  } = options;

  const base = baseUrl ?? PUBLIC_API_BASE_URL;
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const url = new URL(normalizedEndpoint, base);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  const finalHeaders: Record<string, string> = { ...headers };

  if (isJsonLike(body) && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  // Explicit token wins; otherwise, for writes, fall back to the registered
  // provider so dashboard mutations carry the caller's identity automatically.
  let authToken = token;
  if (!isPublic && !authToken && method !== "GET") {
    authToken = (await authTokenProvider()) ?? undefined;
  }

  if (!isPublic && authToken) {
    finalHeaders["Authorization"] = `Bearer ${authToken}`;
  }

  if (!isPublic && sessionCookie) {
    finalHeaders["X-Session-Cookie"] = sessionCookie;
  }

  const payload =
    isJsonLike(body) && finalHeaders["Content-Type"] === "application/json"
      ? JSON.stringify(body)
      : (body as BodyInit | undefined);

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method,
      headers: finalHeaders,
      body: payload,
      signal,
    });
  } catch (error) {
    throw new ApiError(
      `Network error: ${(error as Error).message}`,
      0,
      "FETCH_ERROR",
      null
    );
  }

  const contentType = response.headers.get("content-type");
  const isJsonResponse = contentType?.includes("application/json");
  const responseBody = isJsonResponse
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      (typeof responseBody === "object" && responseBody?.message) ||
      (typeof responseBody === "string" && responseBody) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(
      errorMessage,
      response.status,
      response.statusText,
      responseBody
    );
  }

  return responseBody as T;
}

export interface TipsMetaItem {
  icon: string;
  text: string;
  isLink?: boolean;
  url?: string;
}

export interface TipsItemBlock {
  type: 'tips-item';
  heading: string;
  imageUrl?: string;
  imageCaption?: string;
  metaItems?: TipsMetaItem[];
  html?: string;        // Rich text HTML from Quill editor
  text?: string;        // Plain text fallback
}

export interface ArticlePayload {
  title: string;
  authorId: string;
  articleType?: 'standard' | 'tips' | 'le_saviez_vous';
  content: unknown[];
  tips?: Array<{ type: string; text: string; url?: string }>;
  imageUrl?: string;
  imageCaption?: string;
  secondImageUrl?: string;
  secondImageCaption?: string;
  lead?: string;
  leadHtml?: string;
  subtitle?: string;
  subtitleHtml?: string;
  intro?: string;
  introHtml?: string;
  cardLead?: string;
  cardTitle?: string;
  category?: string;
  tags?: string[];
  parisSubCategories?: string[];
  parisDistrict?: string | null;
  binaryForGuide?: boolean;
  isHotContent?: boolean;
  isNotebookContent?: boolean;
  isMaagChoice?: boolean;
  isMainInCategory?: boolean;
  isNews?: boolean;
  published?: boolean;
  publishedAt?: ApiTimestamp;
  relatedContent?: RelatedContent;
  contentCollectionId?: string | null;
}

export interface ArticleResponse extends ArticlePayload {
  id: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  author?: unknown;
}

export interface ContentCollectionContent {
  article: string[];
  event: string[];
  flipper: string[];
  guide: string[];
  interview: string[];
  news: string[];
  visualStory: string[];
}

export interface ContentCollectionPayload {
  title: string;
}

export interface ContentCollectionResponse extends ContentCollectionPayload {
  id: string;
  content: ContentCollectionContent;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface NewsPayload {
  title: string;
  authorId: string;
  content: unknown[];
  imageUrl?: string;
  imageCaption?: string;
  lead?: string;
  leadHtml?: string;
  cardLead?: string;
  cardTitle?: string;
  category?: string;
  tags?: string[];
  isMainInCategory?: boolean;
  published?: boolean;
  publishedAt?: ApiTimestamp;
  relatedContent?: RelatedContent;
  contentCollectionId?: string | null;
}

export interface NewsResponse extends NewsPayload {
  id: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  author?: unknown;
}

export interface EventPayload {
  title: string;
  authorId: string;
  content: unknown[];
  imageUrl?: string;
  imageCaption?: string;
  lead?: string;
  leadHtml?: string;
  cardLead?: string;
  cardTitle?: string;
  tags: string[];
  startDate: string | Date;
  endDate?: string | Date | null;
  dateType?: "single" | "duration";
  address?: string;
  timeMode?: "none" | "start" | "range";
  startTime?: string | null;
  endTime?: string | null;
  isMainEvent?: boolean;
  published?: boolean;
  publishedAt?: ApiTimestamp;
  additionalInfo?: Array<{
    id?: string;
    icon: "calendar" | "clock" | "location" | "bulb";
    text: string;
  }>;
  relatedContent?: RelatedContent;
  contentCollectionId?: string | null;
}

export interface EventResponse extends EventPayload {
  id: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  author?: unknown;
}

export type LandingMainHeroType =
  | "article"
  | "guide"
  | "interview"
  | "flipper"
  | "visual-story";

export interface LandingMainHeroTarget {
  type: LandingMainHeroType;
  id: string;
}

export interface LandingMainHeroSelection extends LandingMainHeroTarget {
  mode: "manual";
}

export interface LandingNewsRailAutoSelection {
  mode: "auto-latest";
  limit: number;
}

export interface LandingNewsRailManualSelection {
  mode: "manual";
  ids: string[];
}

export type LandingNewsRailSelection =
  | LandingNewsRailAutoSelection
  | LandingNewsRailManualSelection;

export type LandingNetlenkaItemType = LandingMainHeroType;

export interface LandingNetlenkaItemTarget {
  type: LandingNetlenkaItemType;
  id: string;
}

export interface LandingNetlenkaRailAutoSelection {
  mode: "auto-latest";
  limit: number;
}

export interface LandingNetlenkaRailManualSelection {
  mode: "manual";
  items: LandingNetlenkaItemTarget[];
}

export type LandingNetlenkaRailSelection =
  | LandingNetlenkaRailAutoSelection
  | LandingNetlenkaRailManualSelection;

export type LandingCategoryCardsItemType = Exclude<
  LandingMainHeroType,
  "interview"
>;

export interface LandingCategoryCardsItemTarget {
  type: LandingCategoryCardsItemType;
  id: string;
}

export interface LandingCategoryHeroSelection {
  mode: "manual";
  type: LandingCategoryCardsItemType;
  id: string;
}

export interface LandingCategoryCardsAutoSelection {
  mode: "auto-latest";
  limit: number;
}

export interface LandingCategoryCardsManualSelection {
  mode: "manual";
  items: LandingCategoryCardsItemTarget[];
}

export type LandingCategoryCardsSelection =
  | LandingCategoryCardsAutoSelection
  | LandingCategoryCardsManualSelection;

export interface LandingEventCardAutoSelection {
  mode: "auto-nearest";
}

export interface LandingEventCardManualSelection {
  mode: "manual";
  id: string;
}

export type LandingEventCardSelection =
  | LandingEventCardAutoSelection
  | LandingEventCardManualSelection;

export interface LandingCultureInterviewAutoSelection {
  mode: "auto-latest";
}

export interface LandingCultureInterviewManualSelection {
  mode: "manual";
  id: string;
}

export type LandingCultureInterviewBlockSelection =
  | LandingCultureInterviewAutoSelection
  | LandingCultureInterviewManualSelection;

export interface PhotoOfTheDayFeatureEmptySelection {
  mode: "empty";
}

export interface PhotoOfTheDayFeatureAutoSelection {
  mode: "auto-latest";
}

export interface PhotoOfTheDayFeatureManualSelection {
  mode: "manual";
  id: string;
}

export type PhotoOfTheDayFeatureSelection =
  | PhotoOfTheDayFeatureEmptySelection
  | PhotoOfTheDayFeatureAutoSelection
  | PhotoOfTheDayFeatureManualSelection;

export interface LandingPlacementsResponse {
  schemaVersion: 4;
  mainHero: LandingMainHeroSelection | null;
  newsRail: LandingNewsRailSelection | null;
  netlenkaRail: LandingNetlenkaRailSelection | null;
  cultureHero: LandingCategoryHeroSelection | null;
  cultureCards: LandingCategoryCardsSelection | null;
  parisHero: LandingCategoryHeroSelection | null;
  parisCards: LandingCategoryCardsSelection | null;
  eventCard: LandingEventCardSelection | null;
  cultureInterviewBlock: LandingCultureInterviewBlockSelection | null;
  leSaviezVousFeature: SectionPageLeSaviezVousSelection | null;
  photoOfTheDayFeature: PhotoOfTheDayFeatureSelection | null;
  updatedAt?: string | Date | null;
  updatedBy?: string | null;
}

export interface UpdateLandingPlacementsPayload {
  mainHero?: LandingMainHeroSelection | null;
  newsRail?: LandingNewsRailSelection | null;
  netlenkaRail?: LandingNetlenkaRailSelection | null;
  cultureHero?: LandingCategoryHeroSelection | null;
  cultureCards?: LandingCategoryCardsSelection | null;
  parisHero?: LandingCategoryHeroSelection | null;
  parisCards?: LandingCategoryCardsSelection | null;
  eventCard?: LandingEventCardSelection | null;
  cultureInterviewBlock?: LandingCultureInterviewBlockSelection | null;
  leSaviezVousFeature?: SectionPageLeSaviezVousSelection | null;
  photoOfTheDayFeature?: PhotoOfTheDayFeatureSelection | null;
}

export interface CalendarPageManualCardsSelection {
  mode: "manual";
  ids: string[];
}

export interface CalendarPageSecondaryCardsAutoSelection {
  mode: "auto-current-week-single-day-priority";
  limit: number;
}

export type CalendarPageMainCardsSelection =
  | CalendarPageManualCardsSelection;

export type CalendarPageSecondaryCardsSelection =
  | CalendarPageManualCardsSelection
  | CalendarPageSecondaryCardsAutoSelection;

export interface CalendarPagePlacementsResponse {
  schemaVersion: 1;
  mainCards: CalendarPageMainCardsSelection | null;
  secondaryCards: CalendarPageSecondaryCardsSelection | null;
  updatedAt?: string | Date | null;
  updatedBy?: string | null;
}

export interface UpdateCalendarPagePlacementsPayload {
  mainCards?: CalendarPageMainCardsSelection | null;
  secondaryCards?: CalendarPageSecondaryCardsSelection | null;
}

export type SectionPageHeroType = LandingMainHeroType;

export interface SectionPageHeroManualSelection {
  mode: "manual";
  type: SectionPageHeroType;
  id: string;
}

export interface SectionPageSecondaryStoriesAutoSelection {
  mode: "auto-latest";
  limit: number;
}

export interface SectionPageSecondaryItemTarget {
  type: SectionPageHeroType;
  id: string;
}

export interface SectionPageSecondaryStoriesManualSelection {
  mode: "manual";
  items: SectionPageSecondaryItemTarget[];
}

export type SectionPageSecondaryStoriesSelection =
  | SectionPageSecondaryStoriesAutoSelection
  | SectionPageSecondaryStoriesManualSelection;

export interface SectionPageFeaturedInterviewAutoSelection {
  mode: "auto-latest";
}

export interface SectionPageFeaturedInterviewManualSelection {
  mode: "manual";
  id: string;
}

export type SectionPageFeaturedInterviewSelection =
  | SectionPageFeaturedInterviewAutoSelection
  | SectionPageFeaturedInterviewManualSelection;

export interface SectionPageSidebarRailAutoSelection {
  mode: "auto-hot";
  limit: number;
}

export interface SectionPageSidebarRailManualSelection {
  mode: "manual";
  items: SectionPageSecondaryItemTarget[];
}

export type SectionPageSidebarRailSelection =
  | SectionPageSidebarRailAutoSelection
  | SectionPageSidebarRailManualSelection;

export interface SectionPageLeSaviezVousAutoSelection {
  mode: "auto-latest";
}

export interface SectionPageLeSaviezVousManualSelection {
  mode: "manual";
  id: string;
}

export type SectionPageLeSaviezVousSelection =
  | SectionPageLeSaviezVousAutoSelection
  | SectionPageLeSaviezVousManualSelection;

export interface CulturePagePlacementsResponse {
  schemaVersion: 1;
  hero: SectionPageHeroManualSelection | null;
  secondaryStories: SectionPageSecondaryStoriesSelection | null;
  featuredInterview: SectionPageFeaturedInterviewSelection | null;
  sidebarRail: SectionPageSidebarRailSelection | null;
  updatedAt?: string | Date | null;
  updatedBy?: string | null;
}

export interface UpdateCulturePagePlacementsPayload {
  hero?: SectionPageHeroManualSelection | null;
  secondaryStories?: SectionPageSecondaryStoriesSelection | null;
  featuredInterview?: SectionPageFeaturedInterviewSelection | null;
  sidebarRail?: SectionPageSidebarRailSelection | null;
}

export interface ParisPagePlacementsResponse {
  schemaVersion: 2;
  hero: SectionPageHeroManualSelection | null;
  twoImageArticle: SectionPageHeroManualSelection | null;
  interviewFeature: SectionPageFeaturedInterviewSelection | null;
  secondaryStories: SectionPageSecondaryStoriesSelection | null;
  photoOfTheDayFeature: PhotoOfTheDayFeatureSelection | null;
  sidebarRail: SectionPageSidebarRailSelection | null;
  updatedAt?: string | Date | null;
  updatedBy?: string | null;
}

export interface UpdateParisPagePlacementsPayload {
  hero?: SectionPageHeroManualSelection | null;
  twoImageArticle?: SectionPageHeroManualSelection | null;
  interviewFeature?: SectionPageFeaturedInterviewSelection | null;
  secondaryStories?: SectionPageSecondaryStoriesSelection | null;
  photoOfTheDayFeature?: PhotoOfTheDayFeatureSelection | null;
  sidebarRail?: SectionPageSidebarRailSelection | null;
}

export interface UserProfilePayload {
  uid: string;
  firstName: string;
  lastName: string;
}

export interface UserProfileResponse {
  uid: string;
  firstName: string;
  lastName: string;
  role: "reader" | "author" | "admin";
  bookmarks?: UserBookmark[];
  createdAt: string | Date;
}

export type BookmarkContentType =
  | "article"
  | "event"
  | "flipper"
  | "guide"
  | "interview"
  | "news"
  | "photoOfTheDay"
  | "tips"
  | "visualStory";

export interface UserBookmark {
  contentType: BookmarkContentType;
  id: string;
  title: string;
  href: string;
  category?: string;
  tag?: string;
  imageUrl?: string;
  savedAt?: string | Date | { _seconds: number };
}

export interface AuthorSocialLinks {
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  telegram?: string;
  site?: string;
}

export interface AuthorPayload {
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  socialLinks?: AuthorSocialLinks;
}

export interface AuthorResponse extends AuthorPayload {
  id: string;
  role: "author" | "reader" | "admin" | string;
  avatar: string;
  createdAt: string | Date;
}

export interface AddressPayload {
  title: string;
  address: string;
}

export interface AddressResponse extends AddressPayload {
  id: string;
  createdAt: string | Date;
}

export interface FlipperPayload {
  title: string;
  authorId: string;
  lead?: string;
  leadHtml?: string;
  cardLead?: string;
  cardTitle?: string;
  category?: string;
  tags?: string[];
  parisSubCategories?: string[];
  parisDistrict?: string | null;
  binaryForGuide?: boolean;
  isHotContent?: boolean;
  isNotebookContent?: boolean;
  isMaagChoice?: boolean;
  published?: boolean;
  publishedAt?: ApiTimestamp;
  carouselContent: { imageUrl: string; caption: string }[];
  secondImageUrl?: string;
  secondImageCaption?: string;
  relatedContent?: RelatedContent;
  contentCollectionId?: string | null;
}

export interface FlipperResponse extends FlipperPayload {
  id: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  author?: unknown;
}

export interface InterviewPayload {
  title: string;
  authorId: string;
  interviewee: string;
  content: unknown[];
  imageUrl?: string;
  imageCaption?: string;
  lead?: string;
  leadHtml?: string;
  cardLead?: string;
  cardTitle?: string;
  mainQuote?: string;
  tags?: string[];
  isHotContent?: boolean;
  isNotebookContent?: boolean;
  isMaagChoice?: boolean;
  published?: boolean;
  publishedAt?: ApiTimestamp;
  relatedContent?: RelatedContent;
  contentCollectionId?: string | null;
}

export interface InterviewResponse extends InterviewPayload {
  id: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  author?: unknown;
}

export interface GuidePayload {
  title: string;
  authorId: string;
  content: unknown[];
  tips?: Array<{ type: string; text: string; url?: string }>;
  imageUrl?: string;
  imageCaption?: string;
  secondImageUrl?: string;
  secondImageCaption?: string;
  lead?: string;
  leadHtml?: string;
  subtitle?: string;
  subtitleHtml?: string;
  cardLead?: string;
  cardTitle?: string;
  category?: string;
  tags?: string[];
  parisSubCategories?: string[];
  parisDistrict?: string | null;
  binaryForGuide?: boolean;
  isHotContent?: boolean;
  isNotebookContent?: boolean;
  isMaagChoice?: boolean;
  isMainInCategory?: boolean;
  published?: boolean;
  publishedAt?: ApiTimestamp;
  relatedContent?: RelatedContent;
  contentCollectionId?: string | null;
}

export interface GuideResponse extends GuidePayload {
  id: string;
  createdAt: string | Date;
  author?: unknown;
}

export const guidesApi = {
  list(token?: string) {
    return request<GuideResponse[]>("/api/guides", { token });
  },
  create(payload: GuidePayload, token?: string) {
    return request<GuideResponse>("/api/guides", {
      method: "POST",
      body: payload,
      token,
    });
  },
  getById(id: string, token?: string) {
    return request<GuideResponse>(`/api/guides/${id}`, { token });
  },
  update(id: string, payload: GuidePayload, token?: string) {
    return request<GuideResponse>(`/api/guides/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },
  delete(id: string, token?: string) {
    return request<void>(`/api/guides/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export const articlesApi = {
  list(token?: string) {
    return request<ArticleResponse[]>("/api/articles", { token });
  },
  create(payload: ArticlePayload, token?: string) {
    return request<ArticleResponse>("/api/articles", {
      method: "POST",
      body: payload,
      token,
    });
  },
  getById(id: string, token?: string) {
    return request<ArticleResponse>(`/api/articles/${id}`, { token });
  },
  update(id: string, payload: ArticlePayload, token?: string) {
    return request<ArticleResponse>(`/api/articles/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },
  delete(id: string, token?: string) {
    return request<void>(`/api/articles/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export const newsApi = {
  list(token?: string) {
    return request<NewsResponse[]>("/api/news", { token });
  },
  create(payload: NewsPayload, token?: string) {
    return request<NewsResponse>("/api/news", {
      method: "POST",
      body: payload,
      token,
    });
  },
  getById(id: string, token?: string) {
    return request<NewsResponse>(`/api/news/${id}`, { token });
  },
  update(id: string, payload: NewsPayload, token?: string) {
    return request<NewsResponse>(`/api/news/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },
  delete(id: string, token?: string) {
    return request<void>(`/api/news/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export const flippersApi = {
  list(token?: string) {
    return request<FlipperResponse[]>("/api/flippers", { token });
  },
  create(payload: FlipperPayload, token?: string) {
    return request<FlipperResponse>("/api/flippers", {
      method: "POST",
      body: payload,
      token,
    });
  },
  getById(id: string, token?: string) {
    return request<FlipperResponse>(`/api/flippers/${id}`, { token });
  },
  update(id: string, payload: FlipperPayload, token?: string) {
    return request<FlipperResponse>(`/api/flippers/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },
  delete(id: string, token?: string) {
    return request<void>(`/api/flippers/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export const interviewsApi = {
  list(token?: string) {
    return request<InterviewResponse[]>("/api/interviews", { token });
  },
  create(payload: InterviewPayload, token?: string) {
    return request<InterviewResponse>("/api/interviews", {
      method: "POST",
      body: payload,
      token,
    });
  },
  getById(id: string, token?: string) {
    return request<InterviewResponse>(`/api/interviews/${id}`, { token });
  },
  update(id: string, payload: InterviewPayload, token?: string) {
    return request<InterviewResponse>(`/api/interviews/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },
  delete(id: string, token?: string) {
    return request<void>(`/api/interviews/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export const eventsApi = {
  list(token?: string) {
    return request<EventResponse[]>("/api/events", { token });
  },
  create(payload: EventPayload, token?: string) {
    return request<EventResponse>("/api/events", {
      method: "POST",
      body: payload,
      token,
    });
  },
  getById(id: string, token?: string) {
    return request<EventResponse>(`/api/events/${id}`, { token });
  },
  update(id: string, payload: EventPayload, token?: string) {
    return request<EventResponse>(`/api/events/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },
  delete(id: string, token?: string) {
    return request<void>(`/api/events/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export interface PhotoOfTheDayResponse {
  id: string;
  title: string;
  imageUrl: string;
  caption: string;
  authorId: string;
  published?: boolean;
  publishedAt?: ApiTimestamp;
  author?: { firstName: string; lastName: string; avatar?: string } | null;
  createdAt: string | { _seconds: number } | Date;
  updatedAt?: string | { _seconds: number } | Date;
}

export interface PhotoOfTheDayPayload {
  title: string;
  imageUrl: string;
  caption: string;
  authorId: string;
  published?: boolean;
  publishedAt?: ApiTimestamp;
}

export const photosOfTheDayApi = {
  list(token?: string) {
    return request<PhotoOfTheDayResponse[]>("/api/photos-of-the-day", { token });
  },
  create(payload: PhotoOfTheDayPayload, token?: string) {
    return request<PhotoOfTheDayResponse>("/api/photos-of-the-day", {
      method: "POST",
      body: payload,
      token,
    });
  },
  getById(id: string, token?: string) {
    return request<PhotoOfTheDayResponse>(`/api/photos-of-the-day/${id}`, { token });
  },
  update(id: string, payload: PhotoOfTheDayPayload, token?: string) {
    return request<PhotoOfTheDayResponse>(`/api/photos-of-the-day/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },
  delete(id: string, token?: string) {
    return request<void>(`/api/photos-of-the-day/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export interface UpdateUserProfilePayload {
  firstName: string;
  lastName: string;
}

export const usersApi = {
  create(payload: UserProfilePayload, token?: string) {
    return request<UserProfileResponse>("/api/users", {
      method: "POST",
      body: payload,
      token,
    });
  },
  get(uid: string, token?: string) {
    return request<UserProfileResponse>(`/api/users/${uid}`, { token });
  },
  update(uid: string, payload: UpdateUserProfilePayload, token?: string) {
    return request<UserProfileResponse>(`/api/users/${uid}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },
  getBookmarks(uid: string, token?: string) {
    return request<UserBookmark[]>(`/api/users/${uid}/bookmarks`, { token });
  },
  addBookmark(uid: string, payload: UserBookmark, token?: string) {
    return request<UserBookmark[]>(`/api/users/${uid}/bookmarks`, {
      method: "POST",
      body: payload,
      token,
    });
  },
  removeBookmark(
    uid: string,
    contentType: BookmarkContentType,
    contentId: string,
    token?: string,
  ) {
    return request<UserBookmark[]>(
      `/api/users/${uid}/bookmarks/${contentType}/${contentId}`,
      {
        method: "DELETE",
        token,
      },
    );
  },
};

export const authorsApi = {
  list(token?: string) {
    return request<AuthorResponse[]>("/api/authors", { token });
  },
  create(payload: AuthorPayload, token?: string) {
    return request<AuthorResponse>("/api/authors", {
      method: "POST",
      body: payload,
      token,
    });
  },
  getById(id: string, token?: string) {
    return request<AuthorResponse>(`/api/authors/${id}`, { token });
  },
  update(id: string, payload: AuthorPayload, token?: string) {
    return request<AuthorResponse>(`/api/authors/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },
  delete(id: string, token?: string) {
    return request<void>(`/api/authors/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export const addressesApi = {
  list(token?: string) {
    return request<AddressResponse[]>("/api/addresses", { token });
  },
  create(payload: AddressPayload, token?: string) {
    return request<AddressResponse>("/api/addresses", {
      method: "POST",
      body: payload,
      token,
    });
  },
};

export const contentCollectionsApi = {
  list(token?: string) {
    return request<ContentCollectionResponse[]>("/api/content-collections", { token });
  },
  create(payload: ContentCollectionPayload, token?: string) {
    return request<ContentCollectionResponse>("/api/content-collections", {
      method: "POST",
      body: payload,
      token,
    });
  },
  getById(id: string, token?: string) {
    return request<ContentCollectionResponse>(`/api/content-collections/${id}`, {
      token,
    });
  },
  update(id: string, payload: ContentCollectionPayload, token?: string) {
    return request<ContentCollectionResponse>(`/api/content-collections/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },
};

export interface VisualStorySlide {
  imageUrl: string;
  contentType?: "text" | "quote";
  text: string;
  html?: string;
  caption?: string;
  quote?: string;
  quoteAuthor?: string;
}

export interface VisualStoryPayload {
  title: string;
  authorId: string;
  slides: VisualStorySlide[];
  imageUrl?: string;
  imageCaption?: string;
  secondImageUrl?: string;
  secondImageCaption?: string;
  lead?: string;
  leadHtml?: string;
  subtitle?: string;
  subtitleHtml?: string;
  cardLead?: string;
  cardTitle?: string;
  category?: string;
  tags?: string[];
  parisSubCategories?: string[];
  parisDistrict?: string | null;
  binaryForGuide?: boolean;
  isHotContent?: boolean;
  isNotebookContent?: boolean;
  isMaagChoice?: boolean;
  published?: boolean;
  publishedAt?: ApiTimestamp;
  relatedContent?: RelatedContent;
  contentCollectionId?: string | null;
}

export interface VisualStoryResponse extends VisualStoryPayload {
  id: string;
  createdAt: string | Date;
  author?: unknown;
}

export const visualStoriesApi = {
  list(token?: string) {
    return request<VisualStoryResponse[]>("/api/visual-stories", { token });
  },
  create(payload: VisualStoryPayload, token?: string) {
    return request<VisualStoryResponse>("/api/visual-stories", {
      method: "POST",
      body: payload,
      token,
    });
  },
  getById(id: string, token?: string) {
    return request<VisualStoryResponse>(`/api/visual-stories/${id}`, { token });
  },
  update(id: string, payload: VisualStoryPayload, token?: string) {
    return request<VisualStoryResponse>(`/api/visual-stories/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },
  delete(id: string, token?: string) {
    return request<void>(`/api/visual-stories/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export const editorialPlacementsApi = {
  getLanding(token?: string) {
    return request<LandingPlacementsResponse>("/api/editorial-placements/landing", {
      token,
    });
  },
  updateLanding(payload: UpdateLandingPlacementsPayload, token?: string) {
    return request<LandingPlacementsResponse>("/api/editorial-placements/landing", {
      method: "PUT",
      body: payload,
      token,
    });
  },
  getCalendarPage(token?: string) {
    return request<CalendarPagePlacementsResponse>(
      "/api/editorial-placements/calendar-page",
      {
        token,
      }
    );
  },
  updateCalendarPage(payload: UpdateCalendarPagePlacementsPayload, token?: string) {
    return request<CalendarPagePlacementsResponse>(
      "/api/editorial-placements/calendar-page",
      {
        method: "PUT",
        body: payload,
        token,
      }
    );
  },
  getCulturePage(token?: string) {
    return request<CulturePagePlacementsResponse>(
      "/api/editorial-placements/culture-page",
      { token },
    );
  },
  updateCulturePage(payload: UpdateCulturePagePlacementsPayload, token?: string) {
    return request<CulturePagePlacementsResponse>(
      "/api/editorial-placements/culture-page",
      { method: "PUT", body: payload, token },
    );
  },
  getParisPage(token?: string) {
    return request<ParisPagePlacementsResponse>(
      "/api/editorial-placements/paris-page",
      { token },
    );
  },
  updateParisPage(payload: UpdateParisPagePlacementsPayload, token?: string) {
    return request<ParisPagePlacementsResponse>(
      "/api/editorial-placements/paris-page",
      { method: "PUT", body: payload, token },
    );
  },
};

export interface PublicLandingResponse {
  landingPlacements: LandingPlacementsResponse;
  mainBlock: {
    mainArticle: unknown | null;
    newsArticles: unknown[];
    landingEvent: unknown | null;
  };
  body: {
    landingPlacements: LandingPlacementsResponse;
    cultureHero: unknown | null;
    cultureCardItems: unknown[];
    parisHero: unknown | null;
    parisCardItems: unknown[];
    maagChoiceItems: unknown[];
    latestInterview: unknown | null;
    carouselItems: unknown[];
    leSaviezVousArticle: unknown | null;
    photoOfTheDay: unknown | null;
  };
}

export const publicLandingApi = {
  get() {
    return request<PublicLandingResponse>("/api/public/landing", {
      public: true,
    });
  },
};

export interface PublicCultureResponse {
  culturePagePlacements: CulturePagePlacementsResponse;
  primaryCultureArticle: unknown | null;
  secondaryStories: unknown[];
  editorialSidebarItems: unknown[];
  cultureFeed: unknown[];
  featuredInterview: unknown | null;
}

export interface PublicParisResponse {
  parisPagePlacements: ParisPagePlacementsResponse;
  primaryParisArticle: unknown | null;
  twoImageArticle: unknown | null;
  interviewFeature: unknown | null;
  secondaryStories: unknown[];
  editorialSidebarItems: unknown[];
  parisFeed: unknown[];
  photoOfTheDay: unknown | null;
}

export interface PublicCalendarResponse {
  calendarPagePlacements: CalendarPagePlacementsResponse;
  events: unknown[];
  featuredEventCards: unknown[];
  topCards: unknown[];
  lastChanceCards: unknown[];
}

export const publicCultureApi = {
  get() {
    return request<PublicCultureResponse>("/api/public/culture", {
      public: true,
    });
  },
};

export interface SessionVerifyResponse {
  uid: string;
  email: string | null;
  role: string;
}

export const authSessionApi = {
  create(idToken: string) {
    return request<{ sessionCookie: string; expiresIn: number }>(
      "/api/auth/session",
      { method: "POST", body: { idToken }, public: true }
    );
  },
  verify(sessionCookie: string) {
    return request<SessionVerifyResponse>("/api/auth/verify-session", {
      method: "POST",
      body: { sessionCookie },
      public: true,
    });
  },
};

export const publicParisApi = {
  get() {
    return request<PublicParisResponse>("/api/public/paris", {
      public: true,
    });
  },
};

export const publicCalendarApi = {
  get() {
    return request<PublicCalendarResponse>("/api/public/calendar", {
      public: true,
    });
  },
};

export type MaterialContentType =
  | "article"
  | "news"
  | "guide"
  | "event"
  | "flipper"
  | "interview"
  | "visual-story";

export interface PublicMaterialItem {
  id: string;
  contentType: MaterialContentType;
  href: string;
  title: string;
  imageUrl: string | null;
  authorId: string | null;
  authorName: string;
  publishedAt: ApiTimestamp;
  tags: string[];
  isHotContent: boolean;
  isNotebookContent: boolean;
  isMaagChoice: boolean;
  // Only set for contentType 'event'.
  startDate?: ApiTimestamp | null;
  endDate?: ApiTimestamp | null;
  dateType?: "single" | "duration";
}

export interface PublicMaterialGroup {
  contentType: MaterialContentType;
  label: string;
  count: number;
  page: number;
  totalPages: number;
  pageParam: string;
  items: PublicMaterialItem[];
}

export interface PublicMaterialsByTagResponse {
  tag: string;
  totalCount: number;
  groups: PublicMaterialGroup[];
  // The single soonest-upcoming tagged event, shown as a card in the aside
  // instead of in `groups` — events never appear in the main list here.
  featuredEvent: PublicMaterialItem | null;
  // Tagged items flagged isHotContent / isNotebookContent / isMaagChoice —
  // pulled out of `groups` and shown as cards below the event card.
  sidebarCards: PublicMaterialItem[];
}

export const publicMaterialsByTagApi = {
  // pageByType keys are the groups' own `pageParam`, e.g. { eventPage: 2 }
  get(tag: string, pageByType?: Record<string, number>) {
    return request<PublicMaterialsByTagResponse>("/api/public/materials-by-tag", {
      public: true,
      query: { tag, ...pageByType },
    });
  },
};

export interface PublicAuthorProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  bio?: string;
  socialLinks?: AuthorSocialLinks;
}

export interface PublicMaterialsByAuthorResponse {
  author: PublicAuthorProfile;
  totalCount: number;
  groups: PublicMaterialGroup[];
}

export const publicMaterialsByAuthorApi = {
  // pageByType keys are the groups' own `pageParam`, e.g. { eventPage: 2 }
  get(authorId: string, pageByType?: Record<string, number>) {
    return request<PublicMaterialsByAuthorResponse>("/api/public/materials-by-author", {
      public: true,
      query: { authorId, ...pageByType },
    });
  },
};

export interface PublicFlatListingResponse {
  label: string;
  count: number;
  page: number;
  totalPages: number;
  items: PublicMaterialItem[];
}

export const publicNewsListingApi = {
  get(page = 1) {
    return request<PublicFlatListingResponse>("/api/public/news", {
      public: true,
      query: { page },
    });
  },
};

export const publicInterviewsListingApi = {
  get(page = 1) {
    return request<PublicFlatListingResponse>("/api/public/interviews", {
      public: true,
      query: { page },
    });
  },
};

export type DashboardMaterialType =
  | "article"
  | "tips"
  | "le_saviez_vous"
  | "guide"
  | "visual-story"
  | "flipper"
  | "news"
  | "interview"
  | "photo-of-the-day"
  | "event";

export type DashboardBucket = "culture" | "paris" | "events" | "none";

export interface DashboardMaterialRow {
  id: string;
  type: DashboardMaterialType;
  title: string;
  category: "culture" | "paris" | null;
  bucket: DashboardBucket;
  published: boolean;
  isHotContent: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  startDate: string | null;
  tags: string[];
}

export interface DashboardOverviewResponse {
  counts: {
    total: number;
    byBucket: Record<DashboardBucket, number>;
    byStatus: { published: number; draft: number };
  };
  materials: DashboardMaterialRow[];
}

export const dashboardApi = {
  overview(auth: { token?: string; sessionCookie?: string } = {}) {
    return request<DashboardOverviewResponse>("/api/dashboard/overview", {
      token: auth.token,
      sessionCookie: auth.sessionCookie,
    });
  },
};
