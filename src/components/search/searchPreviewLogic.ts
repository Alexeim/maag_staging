// Logic for the admin search prototype (/dashboard/search-preview), loaded
// through $lazy('searchPreview'). The page renders its markup only after
// load (x-if="!isLazyLoading"), so nothing here is mirrored in the shared
// skeleton in lazyLoadPlugin.ts.
import {
  searchMaterials,
  type MaterialSearchHit,
} from "@/lib/search/algoliaSearch";
import { getPrimaryBadgeLabel } from "@/lib/utils/contentBadge";
import { splitHighlight, type HighlightPart } from "@/lib/search/highlight";

// The snippet under a card's title: from the introduction if the query
// matched there, else from the content; if neither matched (the hit came
// from the title or tags), the introduction's opening words. Empty for
// restricted records.
export const getHitSnippetParts = (hit: MaterialSearchHit): HighlightPart[] => {
  const { introduction, content } = hit._snippetResult ?? {};
  const matched = [introduction, content].find(
    (snippet) => snippet && snippet.matchLevel !== "none",
  );
  const snippet = matched ?? introduction ?? content;
  return snippet ? splitHighlight(snippet.value) : [];
};

// Index `type` values that contentBadge knows under another name. Every
// other value (news, interview, article, ...) is passed through unchanged.
const BADGE_CONTENT_TYPES: Record<string, string> = {
  "photo-of-the-day": "photoOfTheDay",
};

// Same badge as on listing cards: "Новости"/"Интервью" for those types,
// else the first tag, else the type's own label.
export const getHitBadgeLabel = (hit: MaterialSearchHit): string =>
  getPrimaryBadgeLabel({
    contentType: BADGE_CONTENT_TYPES[hit.type] ?? hit.type,
    tags: hit.tags,
  });

// Wait this long after the last keystroke before querying Algolia.
// 300 ms still sent a request per letter at a slower (Cyrillic) typing pace.
export const SEARCH_DEBOUNCE_MS = 400;

// "От первого лица" shows the author's name + title tail (displayTitle);
// every other type, «Мнение» included, shows its title as-is.
export const getHitTitle = (hit: MaterialSearchHit): string =>
  hit.type === "first-person" && hit.displayTitle ? hit.displayTitle : hit.title;

// The index has no separate author field: for first-person, displayTitle is
// composeFirstPersonTitle(name, title) = `${name} ${title}`, so the name is
// what precedes the tail. Empty when there is no name to recover.
export const getHitAuthorName = (hit: MaterialSearchHit): string => {
  const displayTitle = (hit.displayTitle ?? "").trim();
  const title = hit.title.trim();
  if (hit.type !== "first-person" || !displayTitle || displayTitle === title) return "";
  if (!title) return displayTitle;
  return displayTitle.endsWith(` ${title}`)
    ? displayTitle.slice(0, -(title.length + 1)).trim()
    : "";
};

// The title as highlight parts. Only `title` is highlighted by Algolia; for
// first-person the author's name (not searchable) is prepended as plain text,
// matching what getHitTitle shows.
export const getHitTitleParts = (hit: MaterialSearchHit): HighlightPart[] => {
  const highlighted = hit._highlightResult?.title?.value;
  const parts = highlighted
    ? splitHighlight(highlighted)
    : [{ text: hit.title, highlighted: false }];
  const authorName = getHitAuthorName(hit);
  return authorName ? [{ text: `${authorName} `, highlighted: false }, ...parts] : parts;
};

export default () => {
  // Kept in the closure, not on the component: a timer id is not view state
  // and must not become reactive.
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  // Bumped on every search() call. A response is applied only if no newer
  // call started while it was in flight, so a slow answer for "бал" cannot
  // overwrite a faster one for "балет".
  let latestRequestId = 0;

  return {
    query: "",
    nbHits: null as number | null,
    hits: [] as MaterialSearchHit[],
    errorMessage: "",
    // True while the latest request is in flight; an older one finishing
    // must not switch it off (see the requestId checks in search()).
    isLoading: false,
    // Pagination of the shown results. shownQuery is the query they belong
    // to: "Показать ещё" must continue it even if the input has changed and
    // its debounced search has not fired yet.
    page: 0,
    nbPages: 0,
    shownQuery: "",

    hasMore() {
      return this.page + 1 < this.nbPages;
    },

    hitTitle(hit: MaterialSearchHit) {
      return getHitTitle(hit);
    },

    hitAuthorName(hit: MaterialSearchHit) {
      return getHitAuthorName(hit);
    },

    hitBadgeLabel(hit: MaterialSearchHit) {
      return getHitBadgeLabel(hit);
    },

    hitSnippetParts(hit: MaterialSearchHit) {
      return getHitSnippetParts(hit);
    },

    hitTitleParts(hit: MaterialSearchHit) {
      return getHitTitleParts(hit);
    },

    // Bound to the input event: restarts the timer on every keystroke, so
    // only the last value typed within the window reaches search().
    onQueryInput() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void this.search();
      }, SEARCH_DEBOUNCE_MS);
    },

    // Enter / the keyboard's "search" key: run now instead of waiting for
    // the debounce, so the result shows as soon as the user asks for it.
    submitSearch() {
      clearTimeout(debounceTimer);
      void this.search();
    },

    async search() {
      // Bumped before the empty check too: clearing the input must also
      // discard an answer that is still on its way.
      const requestId = ++latestRequestId;
      const query = this.query.trim();
      // An empty query must not list the whole archive.
      if (query === "") {
        this.nbHits = null;
        this.hits = [];
        this.errorMessage = "";
        this.isLoading = false;
        this.page = 0;
        this.nbPages = 0;
        this.shownQuery = "";
        return;
      }

      this.isLoading = true;
      try {
        const result = await searchMaterials(query, 0);
        if (requestId !== latestRequestId) return;
        this.nbHits = result.nbHits;
        this.hits = result.hits;
        this.page = result.page;
        this.nbPages = result.nbPages;
        this.shownQuery = query;
        this.errorMessage = "";
        this.isLoading = false;
      } catch (error) {
        if (requestId !== latestRequestId) return;
        console.error("[searchPreview] search failed:", error);
        this.errorMessage = "Поиск не ответил";
        this.isLoading = false;
      }
    },

    // "Показать ещё": fetches the next page of shownQuery and appends it.
    // Shares latestRequestId with search(), so a new query typed meanwhile
    // wins and this page is dropped.
    async loadMore() {
      if (this.isLoading || !this.hasMore()) return;
      const requestId = ++latestRequestId;
      const query = this.shownQuery;

      this.isLoading = true;
      try {
        const result = await searchMaterials(query, this.page + 1);
        if (requestId !== latestRequestId) return;
        this.hits = [...this.hits, ...result.hits];
        this.page = result.page;
        this.nbPages = result.nbPages;
        this.isLoading = false;
      } catch (error) {
        if (requestId !== latestRequestId) return;
        console.error("[searchPreview] load more failed:", error);
        this.errorMessage = "Поиск не ответил";
        this.isLoading = false;
      }
    },
  };
};
