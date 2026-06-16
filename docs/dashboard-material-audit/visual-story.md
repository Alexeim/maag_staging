# Visual Story

Статус: source-verified на 2026-06-17, runtime-not-verified.

## Source files

- Create page: `src/pages/dashboard/visual-story/create.astro`
- Edit page: `src/pages/dashboard/visual-story/[id]/edit.astro`
- Preview page: `src/pages/dashboard/visual-story/preview.astro`
- Composer: `src/components/dashboard/VisualStoryComposer.astro`
- Logic: `src/components/article/visualStoryCreatorLogic.ts`

## Текущий workflow

- Preview action: `previewStory()`.
- Save/update action: `saveStory()`.
- Preview draft key: `visualStoryPreview`.
- Delete action: `deleteStory(deleteRedirect)`.

## Author logic

- Dashboard preview search did not find `ArticleAuthor` rendering in `src/pages/dashboard/visual-story/preview.astro`.
- Проверенный поиск по preview pages нашел author render в других materials, но не в visual-story.

Вывод:

- Visual Story likely does not render dashboard preview author at all, or renders it through a different component/pattern that needs runtime inspection.

Persistence:

- `previewStory()` сохраняет `selectedAuthorId`.
- Evidence: `src/components/article/visualStoryCreatorLogic.ts:557-567`.
- Restore использует fallback `this.selectedAuthorId || copy.authorId`.
- Evidence: `src/components/article/visualStoryCreatorLogic.ts:526-527`.

Вывод:

- Author persistence выглядит лучше, чем у interview/news/tips/flipper, но preview rendering автора требует отдельной проверки.

## Preview draft lifecycle

- Read: `localStorage.getItem("visualStoryPreview")`.
- Evidence: `src/components/article/visualStoryCreatorLogic.ts:464`.
- Write: `localStorage.setItem("visualStoryPreview", ...)`.
- Evidence: `src/components/article/visualStoryCreatorLogic.ts:567`.
- Cleanup после save/update не найден в проверенных строках.

## Block and media logic

- Visual Story отличается от article-like blocks: story-specific structure, cover/media/story items.
- `previewStory()` пишет draft.
- Evidence: `src/components/article/visualStoryCreatorLogic.ts:557-567`.
- `saveStory()` имеет отдельную save path.
- Evidence: `src/components/article/visualStoryCreatorLogic.ts:571`.

Риск:

- Если media upload идет асинхронно, preview/save должны иметь общий upload guard.
- В текущем audit нет подтверждения, что preview блокируется на время upload.

## Save/update/delete/cancel

- Published/draft: `PublicationToggle model="story"`.
- Footer layout: canonical-like `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Evidence: `src/components/dashboard/VisualStoryComposer.astro:411-436`.

## Known inconsistencies

- Dashboard preview author rendering не подтвержден.
- Preview draft cleanup отсутствует или не найден.
- Нужно отдельно проверить upload guards для preview/save.

## First safe fix

1. Проверить runtime visual-story preview: должен ли там быть author.
2. Если author нужен, рендерить его из preview draft/current author contract.
3. Добавить cleanup `visualStoryPreview` после successful save/update.
