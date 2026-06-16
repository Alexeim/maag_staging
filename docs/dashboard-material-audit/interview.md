# Interview

## Область проверки

Интервью. Проверены creator, editor, previewer, action footer,
save/update/delete, preview draft и redirects.

## Файлы

- Create page: `src/pages/dashboard/interview/create.astro`
- Edit page: `src/pages/dashboard/interview/[id]/edit.astro`
- Preview page: `src/pages/dashboard/interview/preview.astro`
- Composer: `src/components/dashboard/InterviewComposer.astro`
- Logic: `src/components/dashboard/interviewCreatorLogic.ts`
- API/controller: `interviewsApi`, `server/src/controllers/interviewController.ts`

## Creator

- Create page passes `isEditMode: false`.
- Composer использует `x-data="$lazy('interviewCreator', interviewCreatorState)"`.

## Editor

- Edit page загружает interview через `interviewsApi.getById(id)`.
- Передает `initialInterview`, `interviewId`, `isEditMode: true`.
- Edit page не передает delete props.

## Previewer

- Preview page использует `interviewCreator` with `{ isPreview: true }`.
- Действия в header: `returnToEdit()` и `saveInterview()`.
- Preview storage key: `interviewPreview`.
- Preview author rendering не использует выбранного автора из draft: page
  рендерит `ArticleAuthor` из статического `articleData.author.name` и
  `articleData.author.avatarUrl`.
- Author persistence bug: preview draft сохраняет `selectedAuthorId`, но после
  restore `init()` снова присваивает `selectedAuthorId` из `interview.authorId`,
  что может стереть выбранного автора, если он еще не записан в interview
  payload.

## Action footer

- Footer начинается в `src/components/dashboard/InterviewComposer.astro:1200`.
- Layout: `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Левая группа пустая, только placeholder comment.
- Правая группа: `PublicationToggle`, cancel, preview, save.
- Cancel: ручной inline `<a>`.
- Preview/save: общий `Button`.
- Props include `deleteInterviewId` and `deleteRedirect`, but footer does not use them.

## Карта логики

### State

- Основной объект: `interview`.
- Ключевые поля: `title`, `lead`, `cardLead`, `interviewee`, `mainQuote`, `isHotContent`, `paid`, `published`, `publishedAt`, `imageUrl`, `imageCaption`, `contentBlocks`, `tags`, `relatedContent`, `contentCollectionId`.

### Init

- Init читает `interviewPreview` in preview mode.
- Loaded interview normalizes tags, booleans, related content and content blocks.
- Author state is restored from preview or `interview.authorId`.

### Interaction Logic

- Title/caption logic follows edit/save/cancel temporary text pattern.
- Author logic supports selected author and new author creation.
- Tags are toggled strings normalized через `normalizeTags`.
- Flags `isHotContent`, `paid`, `published` are direct state flags included in payload.
- Block logic похож на Article и включает interview-specific `qa` block type.
- `addBlock("qa")` creates a question/answer block; `updateBlock()` saves it like any other block.
- Related content поддерживается and sanitized перед save.
- Content collection id включается in payload.

## Save / Update

- `saveInterview()` начинается в `src/components/dashboard/interviewCreatorLogic.ts:855`.
- Есть upload guard.
- Есть double-submit guard через `isSaving`.
- Update вызывает `interviewsApi.update(this.interviewId, payload)`.
- Create вызывает `interviewsApi.create(payload)`.
- Перед save открытый block auto-commit-ится.
- Validation: video blocks должны быть валидны, title обязателен, interviewee обязателен, cover image обязателен.
- Payload включает `mainQuote`, `isHotContent`, `paid`, `published`, related content и content collection id.

## Delete

- Editor footer не показывает delete.
- `deleteInterview()` method не найден в audited logic.
- Server/controller route supports interview delete, but editor workflow does not expose it.

## Preview draft / localStorage

- Key: `interviewPreview`.
- Cleanup после успешного save: не найден.

## Redirects

- Update redirects to `this.onSaveRedirect || "/dashboard/interviews"`.
- Create redirects to `/dashboard/interviews`.

## Проблемы

- Delete props есть в composer interface, но не подключены.
- Editor не имеет destructive action, хотя list/backend поддерживают delete.
- Preview draft cleanup отсутствует.
- Preview and save auto-commit an open block, but `addBlock(type)` can still
  switch editing to a new block while a previous `editingBlock` has unsaved
  changes.
- Block-level `updateBlock()` can still be clicked during upload.

## Вердикт

Interview editor неполный относительно остальных material editors: delete support подразумевается, но не реализован.
