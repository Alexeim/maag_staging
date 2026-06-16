# Tips

## Область проверки

Tips article. Проверены creator, editor, previewer, action footer,
save/update/delete, preview draft и redirects.

## Файлы

- Create page: `src/pages/dashboard/tips/create.astro`
- Edit page: `src/pages/dashboard/tips/[id]/edit.astro`
- Preview page: `src/pages/dashboard/tips/preview.astro`
- Composer: `src/components/dashboard/TipsArticleComposer.astro`
- Logic: `src/components/dashboard/tipsArticleCreatorLogic.ts`
- API/controller: `articlesApi`, `server/src/controllers/articleController.ts`

## Creator

- Create page passes `isEditMode: false`.
- Create page sets `onSaveRedirect: "/dashboard"`.
- Composer использует `x-data="$lazy('tipsArticleCreator', tipsCreatorState)"`.

## Editor

- Edit page загружает article через `articlesApi.getById(id)`.
- Передает `initialArticle`, `articleId`, `isEditMode: true`.
- Передает `deleteArticleId={id}`.
- Explicit `deleteRedirect` не передается, значит используется composer default.

## Previewer

- Preview page использует `tipsArticleCreator` with `{ isPreview: true }`.
- Действия в header: `returnToEdit()` и `saveArticle()`.
- Preview storage key: `tipsPreview`.
- `previewArticle()` writes `tipsPreview`.
- Preview author rendering не использует выбранного автора из draft: page
  рендерит `ArticleAuthor` из статического `articleData.author.name` и
  `articleData.author.avatarUrl`.
- Author persistence bug: preview draft сохраняет `selectedAuthorId`, но после
  restore `init()` снова присваивает `selectedAuthorId` из `article.authorId`,
  что может стереть выбранного автора, если он еще не записан в article payload.

## Action footer

- Footer начинается в `src/components/dashboard/TipsArticleComposer.astro:515`.
- Layout: `flex justify-between items-center gap-4 mt-4 pb-16`.
- Это отличается от большинства material footers.
- Левая группа: cancel, delete.
- Правая группа: publication, preview, save.
- Cancel: вложенный интерактивный markup `<a href={cancelHref}><Button>...</Button></a>`.
- Delete/preview/save используют общий `Button`.

## Карта логики

### State

- Основной объект: `article`.
- Ключевые поля: `title`, `lead`, `cardLead`, `imageUrl`, `imageCaption`, `category`, `tags`, `parisSubCategories`, `parisDistrict`, `isHotContent`, `isMainInCategory`, `published`, `publishedAt`, `contentBlocks`, `relatedContent`, `contentCollectionId`.
- UI state: `isEditingTitle`, `editingTitleText`, `isEditingCaption`, `editingCaptionText`, `editingIndex`, `editingBlock`, `uploading`, `uploadProgress`, `uploadingBlockIndex`, `isSaving`.
- Author state: `authors`, `authorsLoading`, `selectedAuthorId`, `useNewAuthor`, `newAuthorFirstName`, `newAuthorLastName`.

### Init

- `init()` читает `tipsPreview` из `localStorage`, если открыт preview mode.
- Preview state заменяет `article`, `articleId`, `isEditMode`, author state.
- После init нормализуются tags, `parisSubCategories`, `parisDistrict`, `relatedContent`, `contentBlocks`.
- Загружаются authors и related content lists.

### Title / Caption

- `editTitle()` копирует `article.title` в `editingTitleText`.
- `saveTitle()` trim-ит временное значение и пишет его в `article.title`.
- `cancelEditTitle()` выходит без записи.
- Caption работает тем же pattern для `article.imageCaption`.

### Author

- Existing author: `resolveAuthorId()` возвращает `selectedAuthorId`.
- New author: создает автора через `authorsApi.create`, пишет новый id в `selectedAuthorId`, сбрасывает `useNewAuthor`.
- Если author не выбран, save падает через error path.

### Category / Tags / Flags

- `handleCategoryChange(value)` меняет category и нормализует tags, Paris subcategories и district.
- `toggleTag(value)` для Paris меняет `parisSubCategories`, для остальных категорий меняет `tags`.
- `getSelectedCategoryTags()` возвращает Paris subcategories или обычные tags в зависимости от category.
- `isHotContent`, `isMainInCategory`, `published` меняются напрямую через form controls и попадают в save payload.

### Tips Items

- Основной content unit: `tips-item`.
- `addTipsItem()` пушит новый пустой item в `article.contentBlocks` и сразу открывает его на edit.
- `editBlock(index)` deep-copy-ит item в `editingBlock`.
- `updateBlock()` пишет `editingBlock` обратно в `article.contentBlocks[editingIndex]`.
- `deleteBlock(index)` удаляет item после confirmation.
- `moveBlock(index, direction)` меняет порядок items.
- Data-loss risk: edits live in separate `editingBlock` until `updateBlock()`.
  If user opens preview or adds another item before saving current item, current
  edits can be lost.
- `previewArticle()` currently does not auto-commit an open `editingBlock`.
- `addTipsItem()` currently does not auto-commit or block when another item is
  open; it switches `editingBlock` to the new item.
- `x-for` key uses `index`, which is fragile for reorder/delete flows.

### Upload / Related / Collections / Placement

- `handleCoverUpload()` грузит cover и пишет URL в `article.imageUrl`.
- `handleItemImageUpload()` грузит image для текущего item и пишет URL в `editingBlock.imageUrl`.
- Save/preview блокируются при `uploading = true`.
- Item-level upload risk: `updateBlock()` can still be clicked while an image
  upload is running; after `editingBlock` is cleared, upload completion may not
  safely attach the image URL to the intended item.
- UX risk: global `uploading` indicator exists, but action buttons do not all
  communicate clearly that save/preview/add/update are unavailable during item
  upload.
- `addRelatedContent()` и `removeRelatedContent()` меняют `article.relatedContent`.
- `ContentCollectionsEditor` работает через `article.contentCollectionId`.
- `LandingPlacementPanel` подключен для placement controls.

## Save / Update

- `saveArticle()` начинается в `src/components/dashboard/tipsArticleCreatorLogic.ts:644`.
- Есть upload guard.
- Есть double-submit guard через `isSaving`.
- Payload задает `articleType: "tips"`.
- Update вызывает `articlesApi.update(this.articleId, payload)`.
- Create вызывает `articlesApi.create(payload)`.
- Перед API call открытый item auto-commit-ится через `updateBlock()`.
- Validation: title обязателен, минимум один tips item обязателен, минимум один selected category tag обязателен.
- Payload включает `published`, но `publishedAt` явно не отправляется из creator.

## Delete

- `deleteArticle(redirectUrl?)` начинается в `src/components/dashboard/tipsArticleCreatorLogic.ts:614`.
- Использует `articlesApi.delete(this.articleId)`.
- Logic fallback redirect: `/dashboard/tips`.
- Composer default `deleteRedirect`: `/dashboard`.

## Preview draft / localStorage

- Key: `tipsPreview`.
- Cleanup после успешного save: не найден.

## Redirects

- Create page sets `onSaveRedirect: "/dashboard"`.
- Create branch redirects to `/dashboard/tips`.
- Update branch redirects to `this.onSaveRedirect || "/dashboard/tips"`.

## Проблемы

- Footer layout не унифицирован.
- Порядок/grouping кнопок отличается от Article/News/Guide/Event.
- Cancel использует неправильную вложенность интерактивных элементов.
- High data-loss risk in tips item editing:
  - unsaved `editingBlock` is not auto-committed before preview;
  - adding a new item can discard unsaved changes in the current item;
  - item save/update is not consistently disabled during image upload;
  - `index` key can make reorder/delete/edit state more fragile.
- Preview draft cleanup отсутствует.
- Redirect defaults конфликтуют между create state, composer default и logic fallback.

## Вердикт

Tips - один из главных сломанных случаев. Нужна нормализация footer/layout,
workflow and explicit data-loss prevention around item editing and uploads.
