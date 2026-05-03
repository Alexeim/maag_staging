import { PUBLIC_API_BASE_URL } from "@/lib/utils/constants";

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
  articleType?: 'standard' | 'tips';
  content: unknown[];
  tips?: Array<{ type: string; text: string }>;
  imageUrl?: string;
  imageCaption?: string;
  lead?: string;
  cardLead?: string;
  category?: string;
  tags?: string[];
  techTags?: string[];
  isHotContent?: boolean;
  isOnLanding?: boolean;
  isMainInCategory?: boolean;
  isNews?: boolean;
}

export interface ArticleResponse extends ArticlePayload {
  id: string;
  createdAt: string | Date;
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
  category: 'exhibition' | 'concert' | 'performance';
  tags: string[];
  techTags: string[];
  startDate: string | Date;
  endDate?: string | Date | null;
  dateType?: "single" | "duration";
  address?: string;
  timeMode?: "none" | "start" | "range";
  startTime?: string | null;
  endTime?: string | null;
  isOnLanding: boolean;
  isMainEvent?: boolean;
}

export interface EventResponse extends EventPayload {
  id: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  author?: unknown;
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
  techTags?: string[];
  isHotContent?: boolean;
  carouselContent: { imageUrl: string; caption: string }[];
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
  techTags?: string[];
  isHotContent?: boolean;
  isOnLanding?: boolean;
  isMainInCategory?: boolean;
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

export const flippersApi = {
  list(token?: string) {
    return request<any[]>("/api/flippers", { token });
  },
  create(payload: FlipperPayload, token?: string) {
    return request<any>("/api/flippers", {
      method: "POST",
      body: payload,
      token,
    });
  },
  getById(id: string, token?: string) {
    return request<any>(`/api/flippers/${id}`, { token });
  },
  update(id: string, payload: FlipperPayload, token?: string) {
    return request<any>(`/api/flippers/${id}`, {
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

export interface VisualStorySlide {
  imageUrl: string;
  text: string;
}

export interface VisualStoryPayload {
  title: string;
  authorId: string;
  slides: VisualStorySlide[];
  imageUrl?: string;
  lead?: string;
  cardLead?: string;
  category?: string;
  tags?: string[];
  techTags?: string[];
  isHotContent?: boolean;
  isOnLanding?: boolean;
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
