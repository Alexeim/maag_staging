# Visual Story

## Область проверки

Визуальная история. Проверены creator, editor, previewer, action footer,
save/update/delete, preview draft и redirects.

## Файлы

- Create page: `src/pages/dashboard/visual-story/create.astro`
- Edit page: `src/pages/dashboard/visual-story/[id]/edit.astro`
- Preview page: `src/pages/dashboard/visual-story/preview.astro`
- Composer: `src/components/dashboard/VisualStoryComposer.astro`
- Logic: `src/components/article/visualStoryCreatorLogic.ts`
- API/controller: `visualStoriesApi`, `server/src/controllers/visualStoryController.ts`

## Creator

- Create page passes `isEditMode: false`.
- Create page sets `onSaveRedirect: "/dashboard/visual-stories"`.
- Composer использует `x-data="$lazy('visualStoryCreator', storyCreatorState)"`.

## Editor

- Edit page загружает story через `visualStoriesApi.getById(id)`.
- Передает `initialStory`, `storyId`, `isEditMode: true`.
- Передает `deleteStoryId={id}` и `deleteRedirect="/dashboard/visual-stories"`.

## Previewer

- Preview page использует `visualStoryCreator` with `{ isPreview: true }`.
- Действия в header: `returnToEdit()` и `saveStory()`.
- Preview storage key: `visualStoryPreview`.
- Preview author rendering отсутствует: preview state хранит author fields, но
  preview page не рендерит `ArticleAuthor`.
- Author persistence выглядит устойчивее: restored `selectedAuthorId`
  сохраняется, а fallback к `story.authorId` делается через `||`.

## Action footer

- Footer начинается в `src/components/dashboard/VisualStoryComposer.astro:411`.
- Layout: `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Левая группа: delete только в edit mode.
- Правая группа: `PublicationToggle`, cancel, preview, save.
- Delete: ручной inline `<button>`.
- Cancel: ручной inline `<a>`.
- Preview/save: общий `Button`.

## Карта логики

### State

- Основной объект: `story`.
- Ключевые поля: `title`, `lead`, `cardLead`, `imageUrl`, `imageCaption`, `category`, `tags`, `parisSubCategories`, `parisDistrict`, `isHotContent`, `paid`, `published`, `publishedAt`, `slides`, `relatedContent`, `contentCollectionId`.

### Init

- Init читает `visualStoryPreview` in preview mode.
- Loaded story normalizes category/tags/Paris fields, booleans, slides, related content and author state.

### Category / Tags / Author

- Category/tag logic mirrors Tips/Flipper style: Paris category использует `parisSubCategories`, other categories use `tags`.
- Author logic supports selected author and new author creation.
- `isHotContent`, `paid`, `published` are direct flags in payload.

### Slides / Upload

- `addSlide()` pushes a slide with empty image, `contentType: "text"` and empty text/quote fields.
- `removeSlide(index)` removes after confirmation.
- Slide fields: `imageUrl`, `caption`, `contentType`, `text`, `quote`, `quoteAuthor`.
- `contentType = "quote"` требует quote; иначе обязателен text.
- Cover upload writes to `story.imageUrl`.
- Slide upload writes to `story.slides[slideIndex].imageUrl`.

### Related / Collections

- Related content поддерживается and sanitized перед save.
- Content collection id включается in payload.

## Save / Update

- `saveStory()` начинается в `src/components/article/visualStoryCreatorLogic.ts:571`.
- Есть upload guard.
- Есть double-submit guard через `isSaving`.
- Update вызывает `visualStoriesApi.update(this.storyId, payload)`.
- Create вызывает `visualStoriesApi.create(payload)`.
- Validation: title обязателен, минимум один slide обязателен, каждый slide должен иметь image, каждый slide должен иметь text или quote в зависимости от `contentType`.
- Payload нормализует каждый slide и включает category/tags/Paris fields, hot/paid/published flags, related content и content collection id.

## Delete

- `deleteStory(redirectUrl)` начинается в `src/components/article/visualStoryCreatorLogic.ts:667`.
- Использует `visualStoriesApi.delete(this.storyId)`.

## Preview draft / localStorage

- Key: `visualStoryPreview`.
- Cleanup после успешного save: не найден.

## Redirects

- Update redirects to `this.onSaveRedirect || "/dashboard/visual-story/{id}/edit"`.
- Create redirects to public `/visual-story/{result.id}`.

## Проблемы

- Create redirect уходит на public page, не как большинство dashboard creators.
- Delete/cancel вручную стилизованы.
- Preview draft cleanup отсутствует.
- Preview can be opened while cover/slide upload is still in progress.
- Add/save/preview buttons do not consistently communicate upload-blocked state.
- Slide rendering uses `:key="index"`, which is fragile for future reorder/delete
  flows.

## Вердикт

Visual Story близок по footer layout, но cleanup и redirect policy не выровнены.
