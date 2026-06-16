# Event

## Область проверки

Событие. Проверены creator, editor, previewer, action footer,
save/update/delete, preview draft и redirects.

## Файлы

- Create page: `src/pages/dashboard/event/create.astro`
- Edit page: `src/pages/dashboard/event/[id]/edit.astro`
- Preview page: `src/pages/dashboard/event/preview.astro`
- Composer: `src/components/dashboard/EventComposer.astro`
- Logic: `src/components/article/eventCreatorLogic.ts`
- API/controller: `eventsApi`, `server/src/controllers/eventController.ts`

## Creator

- Create page passes `isEditMode: false`.
- Composer использует `x-data="$lazy('eventCreator', eventCreatorState)"`.

## Editor

- Edit page загружает event через `eventsApi.getById(id)`.
- Передает `initialEvent`, `eventId`, `isEditMode: true`.
- Передает `deleteEventId={id}` и `deleteRedirect="/dashboard/events"`.

## Previewer

- Preview page использует `eventCreator` with `{ isPreview: true }`.
- Действия в header: `returnToEdit()` и `saveEvent()`.
- Preview storage key: `eventPreview`.
- Preview author rendering не использует выбранного автора из draft: page
  рендерит `ArticleAuthor` из статического `articleData.author.name` и
  `articleData.author.avatarUrl`.
- Author persistence выглядит устойчивее: `init()` сохраняет restored
  `selectedAuthorId` и fallback к `eventDraft.authorId` делает через `||`.

## Action footer

- Footer начинается в `src/components/dashboard/EventComposer.astro:1357`.
- Layout: `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Левая группа: delete при `deleteEventId` exists.
- Правая группа: `PublicationToggle`, cancel, preview, save.
- Delete: ручной inline `<button>`.
- Cancel: ручной inline `<a>`.
- Preview/save: общий `Button`.
- Publication использует `model="article"` because local state stores event content in `article`.

## Карта логики

### State

- Content state живет в `article`.
- Event-specific state живет в `eventForm`.
- `eventForm`: `startDate`, `endDate`, `dateType`, `address`, `timeMode`, `startTime`, `endTime`, `isMainEvent`, `additionalInfo`.

### Init

- Init читает `eventPreview` in preview mode.
- Initial event normalizes dates, time mode, additional info, tags, related content, content collection id and content blocks.
- Event fields are copied into `eventForm`.

### Shared Article-like Logic

- Title/caption, author, upload, related content and content blocks follow the Article-like pattern.
- Preview auto-commits open block before writing `eventPreview`.
- Save auto-commits open block before validation.

### Event Date / Time Logic

- `setStartDate(value)` updates start date and adjusts end date if duration range becomes invalid.
- `setEndDate(value)` updates end date and may adjust start date.
- `setDateType("single")` clears end date.
- `setDateType("duration")` initializes end date from start date when missing.
- `setTimeMode("none")` clears start/end time.
- `setTimeMode("start")` clears end time.
- `setTimeMode("range")` requires start and end time.

### Additional Info Logic

- `addEventInfo()` adds an info row with icon/text.
- `removeEventInfo(index)` removes a row.
- `setEventInfoIcon(index, icon)` changes row icon.

## Save / Update

- `saveEvent()` начинается в `src/components/article/eventCreatorLogic.ts:501`.
- Delegates to `saveArticle()`.
- `saveArticle()` начинается в `src/components/article/eventCreatorLogic.ts:505`.
- Есть upload guard.
- Есть double-submit guard через `isSaving`.
- Update вызывает `eventsApi.update(this.eventId, payload)`.
- Create вызывает `eventsApi.create(payload)`.
- Validation: cover обязателен, title обязателен, start date обязателен, end date обязателен для duration, dates должны быть валидны, end date не раньше start date, time fields должны соответствовать `timeMode`, минимум один tag обязателен.
- Payload включает нормализованные event dates/times, `isMainEvent`, `additionalInfo`, `published`, related content и content collection id.

## Delete

- `deleteEvent(redirectUrl)` начинается в `src/components/article/eventCreatorLogic.ts:681`.
- Использует `eventsApi.delete(this.eventId)`.

## Preview draft / localStorage

- Key: `eventPreview`.
- Cleanup после успешного save: не найден.

## Redirects

- Update redirects to `this.onSaveRedirect || "/dashboard/events"`.
- Create redirects to `/dashboard/events`.

## Проблемы

- Event content живет в state object `article`, что сбивает семантику.
- Publication components используют `article` model для event.
- Delete/cancel вручную стилизованы.
- Preview draft cleanup отсутствует.
- Preview and save auto-commit an open block, but `addBlock(type)` can still
  switch editing to a new block while a previous `editingBlock` has unsaved
  changes.
- Block-level `updateBlock()` can still be clicked during upload.

## Вердикт

Event близок по layout, но state naming и preview cleanup не соответствуют чистому общему contract.
