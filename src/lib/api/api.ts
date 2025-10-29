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

export interface ArticlePayload {
  title: string;
  authorId: string;
  content: unknown[];
  imageUrl?: string;
  imageCaption?: string;
  category?: string;
  tags?: string[];
  techTags?: string[];
  isHotContent?: boolean;
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
  category: 'exhibition' | 'concert' | 'performance';
  tags: string[];
  techTags: string[];
  startDate: string | Date;
  endDate?: string | Date | null;
  isOnLanding: boolean;
}

export interface EventResponse extends EventPayload {
  id: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
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

export interface FlipperPayload {
  title: string;
  category?: string;
  tags?: string[];
  techTags?: string[];
  carouselContent: { imageUrl: string; caption: string }[];
}

export interface InterviewPayload {
  title: string;
  authorId: string;
  interviewee: string;
  content: unknown[];
  imageUrl?: string;
  imageCaption?: string;
  tags?: string[];
}

export interface InterviewResponse extends InterviewPayload {
  id: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  author?: unknown;
}

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
