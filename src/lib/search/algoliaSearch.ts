// Browser-side query to Algolia's REST API with the search-only key.
// That key is public by design (ACL "search", one index). The write key
// lives in server/.env only and must never be referenced from src/.
import { HIGHLIGHT_POST_TAG, HIGHLIGHT_PRE_TAG } from "@/lib/search/highlight";

const APP_ID: string | undefined = import.meta.env.PUBLIC_ALGOLIA_APP_ID;
const SEARCH_KEY: string | undefined = import.meta.env.PUBLIC_ALGOLIA_SEARCH_KEY;
const INDEX_NAME: string | undefined = import.meta.env.PUBLIC_ALGOLIA_INDEX_NAME;

// One hit per publication (the index has distinct on publicationId).
// Only the fields the result list uses so far; attributesToRetrieve in
// server/src/utils/searchIndexSettings.ts returns more.
export interface MaterialSearchHit {
  objectID: string;
  type: string;
  href: string;
  title: string;
  // Only type "first-person" has it: author name + stored title tail.
  displayTitle?: string;
  // Public cover URL (for first-person: main image, else author's portrait).
  imageUrl?: string;
  tags?: string[];
  // ~20 words around the match (attributesToSnippet in the index settings),
  // with matches between HIGHLIGHT_PRE_TAG/HIGHLIGHT_POST_TAG. Absent on
  // restricted (paid) records, which carry no text.
  _snippetResult?: {
    introduction?: AlgoliaSnippet;
    content?: AlgoliaSnippet;
  };
  // Full title with matches between the same markers (attributesToHighlight).
  _highlightResult?: {
    title?: AlgoliaSnippet;
  };
}

export interface AlgoliaSnippet {
  value: string;
  matchLevel: "none" | "partial" | "full";
}

export interface MaterialSearchResult {
  nbHits: number;
  hits: MaterialSearchHit[];
  // Zero-based page of these hits and the total page count. With distinct
  // on publicationId, pages count publications, so none repeats across pages.
  page: number;
  nbPages: number;
}

export const searchMaterials = async (
  query: string,
  page = 0,
): Promise<MaterialSearchResult> => {
  if (!APP_ID || !SEARCH_KEY || !INDEX_NAME) {
    throw new Error("Algolia search is not configured (PUBLIC_ALGOLIA_* env)");
  }

  // Credentials go in the query string and the body is sent without a
  // Content-Type header (the browser uses text/plain), so this is a "simple"
  // CORS request: no OPTIONS preflight before every search. Algolia's own
  // JS client does the same. The key is no more exposed than before: it is
  // in the page's JS either way.
  const credentials = new URLSearchParams({
    "x-algolia-application-id": APP_ID,
    "x-algolia-api-key": SEARCH_KEY,
  });
  const url = `https://${APP_ID}-dsn.algolia.net/1/indexes/${encodeURIComponent(INDEX_NAME)}/query?${credentials}`;
  const response = await fetch(url, {
    method: "POST",
    // Plain-text markers instead of the default <em>: see highlight.ts.
    body: JSON.stringify({
      query,
      page,
      highlightPreTag: HIGHLIGHT_PRE_TAG,
      highlightPostTag: HIGHLIGHT_POST_TAG,
      // Query-time only, the index settings are unchanged. Russian
      // plural/form handling: without it "святой антоний" found nothing
      // (the text says "святого Антония"). Measured 24.11.2026 on the
      // control queries: no other result changed.
      queryLanguages: ["ru"],
      ignorePlurals: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Algolia search failed with HTTP ${response.status}`);
  }

  const data = (await response.json()) as MaterialSearchResult;
  return { nbHits: data.nbHits, hits: data.hits, page: data.page, nbPages: data.nbPages };
};
