# Article

## Область проверки

Обычная статья. Проверены creator, editor, previewer, action footer,
save/update/delete, preview draft и redirects.

## Файлы

- Create page: `src/pages/dashboard/article/create.astro`
- Edit page: `src/pages/dashboard/article/[id]/edit.astro`
- Preview page: `src/pages/dashboard/article/preview.astro`
- Composer: `src/components/dashboard/ArticleComposer.astro`
- Logic: `src/components/article/creatorLogic.ts`
- API/controller: `articlesApi`, `server/src/controllers/articleController.ts`

## Creator

- Create page передает `isEditMode: false` и `onSaveRedirect: "/dashboard"`.
- Composer подключается через `x-data="$lazy('articleCreator', articleCreatorState)"`.

## Editor

- Edit page загружает материал через `articlesApi.getById(id)`.
- Передает `initialArticle`, `articleId`, `isEditMode: true`.
- Передает `deleteArticleId={id}` и `deleteRedirect="/dashboard"`.

## Previewer

- Preview page использует `articleCreator` с `{ isPreview: true }`.
- Действия в header: `returnToEdit()` и `saveArticle()`.
- Preview storage key: `articlePreview`.
- `previewArticle()` пишет preview state в `localStorage`.
- Preview author rendering не использует выбранного автора из draft: page
  рендерит `ArticleAuthor` из статического `articleData.author.name` и
  `articleData.author.avatarUrl`.
- Author persistence bug: `previewArticle()` не сохраняет `selectedAuthorId`,
  `useNewAuthor`, `newAuthorFirstName`, `newAuthorLastName`; после return-to-edit
  `init()` восстанавливает `selectedAuthorId` только из `article.authorId`, где
  выбранного, но еще не сохраненного автора может не быть.

## Action footer

- Footer начинается в `src/components/dashboard/ArticleComposer.astro:1788`.
- Layout: `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Левая группа: delete только в edit mode.
- Правая группа: `PublicationToggle`, cancel, preview, save.
- Delete: ручной inline `<button>`, не общий `Button`.
- Cancel: ручной inline `<a>`, не `Button href`.
- Preview/save: общий `Button`.

## Карта логики

### State

- Основной объект: `article`.
- Ключевые поля: `title`, `lead`, `cardLead`, `articleType`, `imageUrl`, `imageCaption`, `category`, `tags`, `parisSubCategories`, `parisDistrict`, `tips`, `isHotContent`, `isMainInCategory`, `paid`, `published`, `publishedAt`, `contentBlocks`, `relatedContent`, `contentCollectionId`.
- UI state: title/caption edit state, `showBlockOptions`, `editingIndex`, `editingBlock`, drag/drop state, upload state, `isSaving`.
- Author state поддерживает existing author и new author form.

### Init

- Init normalizes loaded article или `articlePreview`.
- Mismatched preview draft удаляется.
- Нормализуются category, tags, Paris fields, tips, related content, content collection id, published flags и content blocks.
- Загружаются authors, content collections и related content lists.

### Title / Caption

- `editTitle()` открывает edit mode и копирует `article.title`.
- `saveTitle()` пишет trim-значение в `article.title`.
- `cancelEditTitle()` выходит без записи.
- Caption methods повторяют тот же pattern для `article.imageCaption`.

### Author

- `resolveAuthorId()` возвращает selected author или создает нового автора.
- После создания нового автора returned id сохраняется в `selectedAuthorId`, `useNewAuthor` сбрасывается.
- Без resolved author save не продолжается.

### Category / Tags / Tips / Flags

- `handleCategoryChange(value)` нормализует category, tags, Paris subcategories и district.
- `toggleTag(value)` переключает normalized tags.
- `toggleTip(type)`, `setTipText`, `setTipUrl` управляют `article.tips`.
- Legacy `category === "hotContent"` превращается в `isHotContent = true` и очищает category.
- `isMainInCategory`, `paid`, `published` идут в payload как boolean flags.

### Blocks

- `openBlockSelector()` показывает selector.
- `addBlock(type)` создает typed content block, пушит его в `contentBlocks`, закрывает selector и открывает block на edit.
- Поддерживаются paragraph/first-paragraph, headings, quote, image, collage, one-big-one-small, columns, link/url-link, video, flipper.
- `editBlock(index)` deep-copy-ит block в `editingBlock`.
- `updateBlock()` валидирует video blocks, пишет block обратно, нормализует metadata/order и закрывает edit mode.
- Drag/drop запрещен при active edit или upload.
- `deleteBlock(index)` удаляет block после confirmation.
- Data-loss risk: `previewArticle()` does not auto-commit an open
  `editingBlock`, while `saveArticle()` does.
- Data-loss risk: `addBlock(type)` can switch editing to a new block while a
  previous `editingBlock` has unsaved changes.

### Upload / Related / Collections / Placement

- Cover upload пишет URL в `article.imageUrl`.
- Image/video/flipper slide upload methods пишут URL в `article` или `editingBlock`.
- Save блокируется при `uploading = true`; preview currently does not check
  `uploading`.
- Block-level `updateBlock()` can still be clicked during upload, which can
  clear `editingBlock` before upload completion writes the URL.
- Related content хранится в `article.relatedContent` и sanitize-ится перед save.
- Content collections управляют `article.contentCollectionId`.
- Landing placement manager подключен для hero/category placements.

## Save / Update

- `saveArticle()` начинается в `src/components/article/creatorLogic.ts:1429`.
- Есть upload guard.
- Есть double-submit guard через `isSaving`.
- Update вызывает `articlesApi.update(this.articleId, payload)`.
- Create вызывает `articlesApi.create(payload)`.
- После create/update удаляет `articlePreview`.
- Перед save открытый block auto-commit-ится через `updateBlock()`.
- Validation: category или hot content обязателен, минимум один selected category tag обязателен, cover image обязателен, video blocks должны быть валидны.
- Payload включает `published`, но `publishedAt` явно не выставляется creator-ом.

## Delete

- `deleteArticle(redirectUrl)` начинается в `src/components/article/creatorLogic.ts:1586`.
- Использует `articlesApi.del(this.articleId)`, что отличается от большинства `.delete(...)`.

## Preview draft / localStorage

- Key: `articlePreview`.
- Cleanup после успешного save: есть.
- Mismatched preview draft cleanup: есть.

## Redirects

- Update redirects to `this.onSaveRedirect || "/dashboard"`.
- Create redirects to `this.createSuccessRedirect || "/dashboard"`.

## Проблемы

- Delete/cancel вручную стилизованы вместо одного общего action component.
- Delete API method отличается: `articlesApi.del`.
- `Button.astro` дублирует `cursor-pointer`.
- Open block can be lost on preview because `previewArticle()` skips the
  save-time `updateBlock()` auto-commit.
- Upload guard is inconsistent: save blocks uploads, preview does not.

## Вердикт

Article близок к общему паттерну, но не полностью унифицирован: footer markup все еще локальный.
