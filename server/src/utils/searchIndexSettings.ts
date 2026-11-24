import type { IndexSettings } from 'algoliasearch';

/**
 * Settings of the public materials index (dev and prod alike).
 *
 * searchableAttributes order is the tie-breaker of Algolia's `attribute`
 * ranking criterion: a title match beats a hero-name match, which beats a
 * tag, the introduction, then the body. Long texts are `unordered` so the
 * position of a word inside them does not matter. Identifiers, href, type and
 * access are not listed, so they never influence matching.
 *
 * Language options (plurals, stop words) and synonyms are intentionally off
 * until the behaviour of the new index has been measured.
 */
export const SEARCH_INDEX_SETTINGS = {
  searchableAttributes: [
    'title',
    'interviewee',
    'tags',
    'unordered(introduction)',
    'unordered(content)',
  ],
  // filterOnly: needed to list one publication's records, never shown as a facet.
  attributesForFaceting: ['filterOnly(publicationId)'],
  // One hit per publication, done by the engine, so pagination counts publications.
  attributeForDistinct: 'publicationId',
  distinct: true,
  // Card fields only; the body is returned as a short snippet. This saves
  // bandwidth, it is not access control: restricted records have no body.
  attributesToRetrieve: [
    'publicationId', 'type', 'href', 'title', 'displayTitle', 'imageUrl', 'tags', 'interviewee', 'access',
  ],
  attributesToSnippet: ['introduction:20', 'content:20'],
  attributesToHighlight: ['title', 'interviewee'],
} satisfies IndexSettings;

// Algolia accepts `distinct: true` and treats it as 1; compare them as equal.
const normalize = (key: string, value: unknown): unknown =>
  key === 'distinct' && value === true ? 1 : value;

/** Keys whose remote value differs from SEARCH_INDEX_SETTINGS. */
export const findSettingsDrift = (remote: IndexSettings): string[] =>
  Object.entries(SEARCH_INDEX_SETTINGS)
    .filter(([key, expected]) =>
      JSON.stringify(normalize(key, (remote as Record<string, unknown>)[key]))
        !== JSON.stringify(normalize(key, expected)))
    .map(([key]) => key);
