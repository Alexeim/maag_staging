# News

## Область проверки

Новость. Проверены creator, editor, previewer, action footer,
save/update/delete, preview draft и redirects.

## Файлы

- Create page: `src/pages/dashboard/news/create.astro`
- Edit page: `src/pages/dashboard/news/[id]/edit.astro`
- Preview page: `src/pages/dashboard/news/preview.astro`
- Composer: `src/components/dashboard/NewsComposer.astro`
- Logic: `src/components/dashboard/newsCreatorLogic.ts`
- API/controller: `newsApi`, `server/src/controllers/newsController.ts`

## Creator

- Create page passes `isEditMode: false`.
- Create page sets `onSaveRedirect: "/dashboard/news"`.
- Composer использует `x-data="$lazy('newsCreator', newsCreatorState)"`.

## Editor

- Edit page загружает news через `newsApi.getById(id)`.
- Передает `initialArticle`, `articleId`, `isEditMode: true`.
- Передает `deleteArticleId={id}` и `deleteRedirect="/dashboard/news"`.

## Previewer

- Preview page использует `newsCreator` with `{ isPreview: true }`.
- Действия в header: `returnToEdit()` и `saveArticle()`.
- Preview storage key: `newsPreview`.
- Preview author rendering не использует выбранного автора из draft: page
  рендерит `ArticleAuthor` из статического `articleData.author.name` и
  `articleData.author.avatarUrl`.
- Author persistence bug: preview draft сохраняет `selectedAuthorId`, но после
  restore `init()` снова присваивает `selectedAuthorId` из `article.authorId`,
  что может стереть выбранного автора, если он еще не записан в article payload.

## Action footer

- Footer начинается в `src/components/dashboard/NewsComposer.astro:467`.
- Layout: `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Левая группа: delete только в edit mode.
- Правая группа: `PublicationToggle`, cancel, preview, save.
- Delete: ручной inline `<button>`.
- Cancel: ручной inline `<a>`.
- Preview/save: общий `Button`.

## Карта логики

- Основной объект называется `article`, но API family - `newsApi`.
- State включает title/lead/cardLead/image/caption/category/tags/isMainInCategory/published/contentBlocks/relatedContent/contentCollectionId.
- Init читает `newsPreview` in preview mode, иначе использует initial article.
- Title/caption methods работают как в Article: edit copies, save writes trimmed value, cancel exits.
- Author logic поддерживает selected author и creation of new author.
- `handleCategoryChange()` меняет category и нормализует tags.
- `toggleTag()` добавляет/удаляет normalized tag.
- News не использует `isHotContent`; loaded data explicitly removes `isHotContent`.
- Block logic проще Article: UI предлагает paragraph/link/url-link, но add/edit/update/delete and drag/drop still use `contentBlocks`.
- Related content поддерживается.
- Content collection id included in payload.

## Save / Update

- `saveArticle()` начинается в `src/components/dashboard/newsCreatorLogic.ts:656`.
- Есть upload guard.
- Есть double-submit guard через `isSaving`.
- Update вызывает `newsApi.update(this.articleId, payload)`.
- Create вызывает `newsApi.create(payload)`.
- Перед save открытый block auto-commit-ится.
- Validation: category обязательна, cover image обязателен.
- Payload включает `isMainInCategory`, `published`, related content и content collection id.

## Delete

- `deleteArticle(redirectUrl)` начинается в `src/components/dashboard/newsCreatorLogic.ts:754`.
- Использует `newsApi.delete(this.articleId)`.

## Preview draft / localStorage

- Key: `newsPreview`.
- Cleanup после успешного save: не найден.

## Redirects

- Update redirects to `this.onSaveRedirect || "/dashboard/news"`.
- Create redirects to `/dashboard/news`.

## Проблемы

- Delete/cancel вручную стилизованы.
- Preview draft cleanup отсутствует.
- Использует `PublicationStatusBanner model="article"` и `PublicationToggle model="article"`, потому что local state называется `article`.
- Preview and save auto-commit an open block, but `addBlock(type)` can still
  switch editing to a new block while a previous `editingBlock` has unsaved
  changes.
- Block-level `updateBlock()` can still be clicked during upload.

## Вердикт

News визуально близок к Article, но workflow не полностью унифицирован.
