// Where French article versions live. Kept apart from articleTranslationStore
// so that readers of these collections (API controllers) do not load the
// Google Translation client.
//
// `articles_fr/{own id}` — the French version, with `sourceId` → the Russian
// article. `articles_fr_by_source/{sourceId}` → { translationId }: the lookup
// from an article to its French version, and the lock that allows only one.
export const FR_COLLECTION = 'articles_fr';
export const FR_BY_SOURCE_COLLECTION = 'articles_fr_by_source';
