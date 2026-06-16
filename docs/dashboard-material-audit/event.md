# Event

Статус: source-verified на 2026-06-17, runtime-not-verified.

## Source files

- Create page: `src/pages/dashboard/event/create.astro`
- Edit page: `src/pages/dashboard/event/[id]/edit.astro`
- Preview page: `src/pages/dashboard/event/preview.astro`
- Composer: `src/components/dashboard/EventComposer.astro`
- Logic: `src/components/article/eventCreatorLogic.ts`

## Текущий workflow

- Preview action: `previewEvent()`.
- Save/update action: `saveEvent()`.
- Preview draft key: `eventPreview`.
- Delete action: `deleteEvent(deleteRedirect)`.

## Author logic

- Preview page рендерит автора через `ArticleAuthor`.
- Evidence: `src/pages/dashboard/event/preview.astro:51-53`.
- `previewEvent()` сохраняет `selectedAuthorId`.
- Evidence: `src/components/article/eventCreatorLogic.ts:383-406`.
- Restore использует fallback `this.selectedAuthorId || eventDraft.authorId`.
- Evidence: `src/components/article/eventCreatorLogic.ts:350-351`.

Вывод:

- Event выглядит безопаснее, чем article/news/tips/guide/interview/flipper, потому что preview-selected author не должен перетираться `eventDraft.authorId`.

## Preview draft lifecycle

- Read: `localStorage.getItem("eventPreview")`.
- Evidence: `src/components/article/eventCreatorLogic.ts:299`.
- Write: `localStorage.setItem("eventPreview", ...)`.
- Evidence: `src/components/article/eventCreatorLogic.ts:406`.
- Cleanup после save/update не найден в проверенных строках.

Риск:

- Старый `eventPreview` может пережить успешное сохранение.

## Block and media logic

- Event имеет article-like block editor плюс event-specific fields.
- Composer содержит block edit/update/delete controls.
- Evidence: `src/components/dashboard/EventComposer.astro:1037-1040`, `src/components/dashboard/EventComposer.astro:1310`.
- Нужно проверить runtime, одинаково ли preview/save commit-ят открытый block.

## Save/update/delete/cancel

- Published/draft: `PublicationToggle model="article"`.
- Footer layout: canonical-like `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Evidence: `src/components/dashboard/EventComposer.astro:1357-1375`.
- Cancel сделан raw `<a>` с button classes, а не shared Button component.

## Known inconsistencies

- Preview draft cleanup отсутствует или не найден.
- Footer похож на общий layout, но cancel implementation отличается.
- Publication model is `article`, хотя material is event.

## First safe fix

1. Добавить cleanup `eventPreview` после успешного save/update.
2. Проверить и унифицировать pre-preview/pre-save commit open block.
3. После shared footer component решить, должен ли cancel быть Button/link единообразно.
