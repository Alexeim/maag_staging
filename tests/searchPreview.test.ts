import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The network module is replaced: these tests check when the component
// queries, not how Algolia answers.
vi.mock("@/lib/search/algoliaSearch", () => ({
  searchMaterials: vi.fn(async () => ({ nbHits: 87, hits: [], page: 0, nbPages: 1 })),
}));

import { searchMaterials } from "@/lib/search/algoliaSearch";
import createSearchPreview, {
  SEARCH_DEBOUNCE_MS,
  getHitTitle,
  getHitAuthorName,
  getHitBadgeLabel,
  getHitSnippetParts,
  getHitTitleParts,
} from "@/components/search/searchPreviewLogic";

const searchMock = vi.mocked(searchMaterials);

type SearchResult = Awaited<ReturnType<typeof searchMaterials>>;

// Simulates x-model + x-on:input: the value changes, then the handler runs.
const type = (component: ReturnType<typeof createSearchPreview>, value: string) => {
  component.query = value;
  component.onQueryInput();
};

describe("searchPreview debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    searchMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends one query for a word typed faster than the debounce window", async () => {
    const component = createSearchPreview();

    for (const value of ["б", "ба", "бал", "бале", "балет"]) {
      type(component, value);
      await vi.advanceTimersByTimeAsync(100);
    }
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);

    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledWith("балет", 0);
    expect(component.nbHits).toBe(87);
  });

  it("sends nothing before the window has passed", async () => {
    const component = createSearchPreview();

    type(component, "балет");
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS - 1);

    expect(searchMock).not.toHaveBeenCalled();
  });

  it("never queries for an empty or blank string", async () => {
    const component = createSearchPreview();

    type(component, "   ");
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);

    expect(searchMock).not.toHaveBeenCalled();
    expect(component.nbHits).toBeNull();
  });
});

// A promise the test resolves or rejects by hand, to control answer order.
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

// Starts a search for `value` directly, skipping the debounce timer.
const startSearch = (component: ReturnType<typeof createSearchPreview>, value: string) => {
  component.query = value;
  return component.search();
};

describe("searchPreview stale responses", () => {
  beforeEach(() => {
    // mockClear keeps the default implementation (nbHits: 87) for other tests.
    searchMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the newer answer when an older one arrives later", async () => {
    const older = deferred<SearchResult>();
    const newer = deferred<SearchResult>();
    searchMock.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    const component = createSearchPreview();

    const first = startSearch(component, "бал");
    const second = startSearch(component, "балет");
    newer.resolve({ nbHits: 87, hits: [], page: 0, nbPages: 1 });
    await second;
    older.resolve({ nbHits: 10, hits: [], page: 0, nbPages: 1 });
    await first;

    expect(component.nbHits).toBe(87);
  });

  it("ignores an older error once a newer answer is shown", async () => {
    const older = deferred<SearchResult>();
    const newer = deferred<SearchResult>();
    searchMock.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const component = createSearchPreview();

    const first = startSearch(component, "бал");
    const second = startSearch(component, "балет");
    newer.resolve({ nbHits: 87, hits: [], page: 0, nbPages: 1 });
    await second;
    older.reject(new Error("network"));
    await first;

    expect(component.errorMessage).toBe("");
    expect(component.nbHits).toBe(87);
  });

  it("drops an answer that arrives after the input was cleared", async () => {
    const pending = deferred<SearchResult>();
    searchMock.mockReturnValueOnce(pending.promise);
    const component = createSearchPreview();

    const inFlight = startSearch(component, "балет");
    await startSearch(component, "");
    pending.resolve({ nbHits: 87, hits: [], page: 0, nbPages: 1 });
    await inFlight;

    expect(component.nbHits).toBeNull();
  });
});

describe("getHitTitle", () => {
  const base = { objectID: "x#0", href: "/x", title: "о балете" };

  it("uses displayTitle for first-person", () => {
    expect(
      getHitTitle({ ...base, type: "first-person", displayTitle: "Анна Иванова о балете" }),
    ).toBe("Анна Иванова о балете");
  });

  it("falls back to title when first-person has no displayTitle", () => {
    expect(getHitTitle({ ...base, type: "first-person" })).toBe("о балете");
  });

  it("keeps title for opinion even if displayTitle were present", () => {
    expect(getHitTitle({ ...base, type: "opinion", displayTitle: "ignored" })).toBe("о балете");
  });
});

describe("searchPreview loading state", () => {
  beforeEach(() => {
    searchMock.mockClear();
  });

  it("is on while the request is in flight and off after the answer", async () => {
    const pending = deferred<SearchResult>();
    searchMock.mockReturnValueOnce(pending.promise);
    const component = createSearchPreview();

    const inFlight = startSearch(component, "балет");
    expect(component.isLoading).toBe(true);
    pending.resolve({ nbHits: 0, hits: [], page: 0, nbPages: 1 });
    await inFlight;

    expect(component.isLoading).toBe(false);
    expect(component.nbHits).toBe(0);
  });

  it("stays on when an older request finishes before the newer one", async () => {
    const older = deferred<SearchResult>();
    const newer = deferred<SearchResult>();
    searchMock.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    const component = createSearchPreview();

    const first = startSearch(component, "бал");
    const second = startSearch(component, "балет");
    older.resolve({ nbHits: 10, hits: [], page: 0, nbPages: 1 });
    await first;
    expect(component.isLoading).toBe(true);

    newer.resolve({ nbHits: 87, hits: [], page: 0, nbPages: 1 });
    await second;
    expect(component.isLoading).toBe(false);
  });

  it("is off after clearing the input mid-request", async () => {
    const pending = deferred<SearchResult>();
    searchMock.mockReturnValueOnce(pending.promise);
    const component = createSearchPreview();

    const inFlight = startSearch(component, "балет");
    await startSearch(component, "");
    expect(component.isLoading).toBe(false);
    pending.resolve({ nbHits: 87, hits: [], page: 0, nbPages: 1 });
    await inFlight;
    expect(component.isLoading).toBe(false);
  });
});

describe("getHitAuthorName", () => {
  const firstPerson = { objectID: "x#0", href: "/x", type: "first-person" };

  it("recovers the name that displayTitle prepends to the tail", () => {
    expect(
      getHitAuthorName({
        ...firstPerson,
        title: "о том, как он попал в DAU",
        displayTitle: "Роман Должанский о том, как он попал в DAU",
      }),
    ).toBe("Роман Должанский");
  });

  it("is empty when the record had no author name", () => {
    expect(getHitAuthorName({ ...firstPerson, title: "о балете", displayTitle: "о балете" })).toBe("");
  });

  it("is empty for other types", () => {
    expect(
      getHitAuthorName({ ...firstPerson, type: "opinion", title: "о балете", displayTitle: "А Б о балете" }),
    ).toBe("");
  });
});

describe("getHitBadgeLabel", () => {
  const base = { objectID: "x#0", href: "/x", title: "t" };

  it("labels news and interviews by type, whatever their tags", () => {
    expect(getHitBadgeLabel({ ...base, type: "news", tags: ["ballet"] })).toBe("Новости");
    expect(getHitBadgeLabel({ ...base, type: "interview" })).toBe("Интервью");
  });

  it("uses the first tag for other types", () => {
    expect(getHitBadgeLabel({ ...base, type: "article", tags: ["ballet", "opera"] })).toBe("Балет");
  });

  it("maps the index's photo-of-the-day type to its label", () => {
    expect(getHitBadgeLabel({ ...base, type: "photo-of-the-day", tags: [] })).toBe("Фото дня");
  });
});

describe("getHitSnippetParts", () => {
  const base = { objectID: "x#0", href: "/x", title: "t", type: "article" };

  it("prefers the field where the query matched", () => {
    const parts = getHitSnippetParts({
      ...base,
      _snippetResult: {
        introduction: { value: "вводка", matchLevel: "none" },
        content: { value: "текст __maag_hl_start__балет__maag_hl_end__", matchLevel: "full" },
      },
    });
    expect(parts).toEqual([
      { text: "текст ", highlighted: false },
      { text: "балет", highlighted: true },
    ]);
  });

  it("falls back to the introduction when nothing matched in the text", () => {
    const parts = getHitSnippetParts({
      ...base,
      _snippetResult: {
        introduction: { value: "вводка", matchLevel: "none" },
        content: { value: "текст", matchLevel: "none" },
      },
    });
    expect(parts).toEqual([{ text: "вводка", highlighted: false }]);
  });

  it("is empty for a restricted record without text", () => {
    expect(getHitSnippetParts(base)).toEqual([]);
  });
});

describe("searchPreview load more", () => {
  const hit = (id: string) => ({ objectID: `${id}#0`, href: `/${id}`, title: id, type: "article" });

  beforeEach(() => {
    searchMock.mockClear();
  });

  it("appends the next page of the shown query", async () => {
    searchMock
      .mockResolvedValueOnce({ nbHits: 3, hits: [hit("a"), hit("b")], page: 0, nbPages: 2 })
      .mockResolvedValueOnce({ nbHits: 3, hits: [hit("c")], page: 1, nbPages: 2 });
    const component = createSearchPreview();

    await startSearch(component, "балет");
    expect(component.hasMore()).toBe(true);
    // The input changed, but its debounced search has not fired yet.
    component.query = "балетный";
    await component.loadMore();

    expect(searchMock).toHaveBeenLastCalledWith("балет", 1);
    expect(component.hits.map((h) => h.title)).toEqual(["a", "b", "c"]);
    expect(component.hasMore()).toBe(false);
  });

  it("does not request past the last page", async () => {
    searchMock.mockResolvedValueOnce({ nbHits: 1, hits: [hit("a")], page: 0, nbPages: 1 });
    const component = createSearchPreview();

    await startSearch(component, "балет");
    await component.loadMore();

    expect(searchMock).toHaveBeenCalledTimes(1);
  });

  it("drops a page that arrives after a new search started", async () => {
    const nextPage = deferred<SearchResult>();
    searchMock
      .mockResolvedValueOnce({ nbHits: 3, hits: [hit("a")], page: 0, nbPages: 2 })
      .mockReturnValueOnce(nextPage.promise)
      .mockResolvedValueOnce({ nbHits: 1, hits: [hit("x")], page: 0, nbPages: 1 });
    const component = createSearchPreview();

    await startSearch(component, "балет");
    const loading = component.loadMore();
    await startSearch(component, "опера");
    nextPage.resolve({ nbHits: 3, hits: [hit("b")], page: 1, nbPages: 2 });
    await loading;

    expect(component.hits.map((h) => h.title)).toEqual(["x"]);
  });
});

describe("searchPreview submit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    searchMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("searches at once on Enter and cancels the pending debounced call", async () => {
    const component = createSearchPreview();

    type(component, "балет");
    component.submitSearch();
    await vi.advanceTimersByTimeAsync(0);
    expect(searchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    expect(searchMock).toHaveBeenCalledTimes(1);
  });
});

describe("getHitTitleParts", () => {
  const PRE = "__maag_hl_start__";
  const POST = "__maag_hl_end__";

  it("splits Algolia's highlighted title", () => {
    expect(
      getHitTitleParts({
        objectID: "x#0",
        href: "/x",
        type: "article",
        title: "Железная дама французского балета",
        _highlightResult: { title: { value: `Железная дама французского ${PRE}балет${POST}а`, matchLevel: "full" } },
      }),
    ).toEqual([
      { text: "Железная дама французского ", highlighted: false },
      { text: "балет", highlighted: true },
      { text: "а", highlighted: false },
    ]);
  });

  it("prepends the first-person author's name as plain text", () => {
    const title = "о возвращении Дмитрия Чернякова";
    expect(
      getHitTitleParts({
        objectID: "x#0",
        href: "/x",
        type: "first-person",
        title,
        displayTitle: `Роман Должанский ${title}`,
        _highlightResult: { title: { value: `о возвращении Дмитрия ${PRE}Чернякова${POST}`, matchLevel: "full" } },
      }),
    ).toEqual([
      { text: "Роман Должанский ", highlighted: false },
      { text: "о возвращении Дмитрия ", highlighted: false },
      { text: "Чернякова", highlighted: true },
    ]);
  });

  it("falls back to the plain title without a highlight result", () => {
    expect(getHitTitleParts({ objectID: "x#0", href: "/x", type: "article", title: "Опера" })).toEqual([
      { text: "Опера", highlighted: false },
    ]);
  });
});
