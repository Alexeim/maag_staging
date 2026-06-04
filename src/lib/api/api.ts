import { PUBLIC_API_BASE_URL } from "@/lib/utils/constants";
import type { RelatedContent } from "@/lib/utils/relatedContent";

export type ApiQueryValue = string | number | boolean | undefined | null;

export interface ApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  token?: string;
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

const isJsonLike = (value: unknown): boolean =>
  typeof value === "object" && value !== null && !(value instanceof FormData);

export async function request<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    headers = {},
    body,
    token,
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

  if (!isPublic && token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
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

export interface TipsItemBlock {
  type: 'tips-item';
  heading: string;
  imageUrl?: string;
  imageCaption?: string;
  meta1?: string;       // First info line (location, time, price, etc.)
  meta2?: string;       // Second info line (link text or extra info)
  meta2IsLink?: boolean;
  meta2Url?: string;    // URL when meta2 is a link
  text?: string;        // Main paragraph text
}

export interface ArticlePayload {
  title: string;
  authorId: string;
  articleType?: 'standard' | 'tips' | 'le_saviez_vous';
  content: unknown[];
  tips?: Array<{ type: string; text: string }>;
  imageUrl?: string;
  imageCaption?: string;
  lead?: string;
  cardLead?: string;
  category?: string;
  tags?: string[];
  parisSubCategories?: string[];
  parisDistrict?: string | null;
  binaryForGuide?: boolean;
  isHotContent?: boolean;
  isMainInCategory?: boolean;
  isNews?: boolean;
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
  cardLead?: string;
  category?: string;
  tags?: string[];
  isMainInCategory?: boolean;
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
  cardLead?: string;
  tags: string[];
  startDate: string | Date;
  endDate?: string | Date | null;
  dateType?: "single" | "duration";
  address?: string;
  timeMode?: "none" | "start" | "range";
  startTime?: string | null;
  endTime?: string | null;
  isMainEvent?: boolean;
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

export interface PhotoOfTheDayFeatureAutoSelection {
  mode: "auto-latest";
}

export interface PhotoOfTheDayFeatureManualSelection {
  mode: "manual";
  id: string;
}

export type PhotoOfTheDayFeatureSelection =
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
  schemaVersion: 1;
  hero: SectionPageHeroManualSelection | null;
  secondaryStories: SectionPageSecondaryStoriesSelection | null;
  leSaviezVousFeature: SectionPageLeSaviezVousSelection | null;
  sidebarRail: SectionPageSidebarRailSelection | null;
  updatedAt?: string | Date | null;
  updatedBy?: string | null;
}

export interface UpdateParisPagePlacementsPayload {
  hero?: SectionPageHeroManualSelection | null;
  secondaryStories?: SectionPageSecondaryStoriesSelection | null;
  leSaviezVousFeature?: SectionPageLeSaviezVousSelection | null;
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
  createdAt: string | Date;
}

export interface AuthorPayload {
  firstName: string;
  lastName: string;
}

export interface AuthorResponse extends AuthorPayload {
  id: string;
  role: "author" | "reader" | "admin" | string;
  avatar: string;
  createdAt: string | Date;
}

export interface FlipperPayload {
  title: string;
  authorId: string;
  lead?: string;
  cardLead?: string;
  category?: string;
  tags?: string[];
  parisSubCategories?: string[];
  parisDistrict?: string | null;
  binaryForGuide?: boolean;
  isHotContent?: boolean;
  carouselContent: { imageUrl: string; caption: string }[];
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
  cardLead?: string;
  mainQuote?: string;
  tags?: string[];
  isHotContent?: boolean;
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
  tips?: Array<{ type: string; text: string }>;
  imageUrl?: string;
  imageCaption?: string;
  lead?: string;
  cardLead?: string;
  category?: string;
  tags?: string[];
  parisSubCategories?: string[];
  parisDistrict?: string | null;
  binaryForGuide?: boolean;
  isHotContent?: boolean;
  isMainInCategory?: boolean;
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
  author?: { firstName: string; lastName: string; avatar?: string } | null;
  createdAt: string | { _seconds: number } | Date;
  updatedAt?: string | { _seconds: number } | Date;
}

export interface PhotoOfTheDayPayload {
  title: string;
  imageUrl: string;
  caption: string;
  authorId: string;
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
  lead?: string;
  cardLead?: string;
  category?: string;
  tags?: string[];
  parisSubCategories?: string[];
  parisDistrict?: string | null;
  binaryForGuide?: boolean;
  isHotContent?: boolean;
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
