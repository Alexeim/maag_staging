# Flipper

## Область проверки

Листалка. Проверены creator, editor, previewer, action footer,
save/update/delete, preview draft и redirects.

## Файлы

- Create page: `src/pages/dashboard/flippers/create.astro`
- Edit page: `src/pages/dashboard/flippers/edit/[id].astro`
- Preview page: `src/pages/dashboard/flippers/preview.astro`
- Composer: `src/components/dashboard/FlipperComposer.astro`
- Logic: `src/components/dashboard/flipperCreatorLogic.ts`
- API/controller: `flippersApi`, `server/src/controllers/flipperController.ts`

## Creator

- Create page passes `isEditMode: false`.
- Composer использует `x-data="$lazy('flipperCreator', creatorState)"`.

## Editor

- Edit page загружает flipper через `flippersApi.getById(id)`.
- Передает `initialFlipper`, `flipperId`, `isEditMode: true`.
- Передает `deleteFlipperId={id}`.

## Previewer

- Preview page использует `flipperCreator` with `{ isPreview: true }`.
- Действия в header: `returnToEdit()` и `saveFlipper()`.
- Preview storage key: `flipperPreview`.
- Preview author rendering не использует выбранного автора из draft: page
  рендерит `ArticleAuthor` из статического `articleData.author.name` и
  `articleData.author.avatarUrl`.
- Author persistence bug: preview draft сохраняет `selectedAuthorId`, но после
  restore `init()` снова присваивает `selectedAuthorId` из `flipper.authorId`,
  что может стереть выбранного автора, если он еще не записан в flipper payload.

## Action footer

- Footer начинается в `src/components/dashboard/FlipperComposer.astro:249`.
- Layout: `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Левая группа: delete при `deleteFlipperId` exists.
- Правая группа: `PublicationToggle`, cancel, preview, save.
- Delete использует общий `Button`.
- Cancel: ручной inline `<a>`.
- Preview/save: общий `Button`.

## Карта логики

### State

- Основной объект: `flipper`.
- Ключевые поля: `title`, `lead`, `cardLead`, `category`, `tags`, `parisSubCategories`, `parisDistrict`, `isHotContent`, `paid`, `published`, `publishedAt`, `carouselContent`, `relatedContent`, `contentCollectionId`.

### Init

- Init читает `flipperPreview` in preview mode.
- Loaded flipper normalizes category/tags/Paris fields, booleans, related content and author state.
- If `carouselContent` is empty, init creates one empty slide.

### Category / Tags / Author / Flags

- Category/tag logic mirrors Visual Story/Tips: Paris category использует `parisSubCategories`, other categories use `tags`.
- Legacy `category === "hotContent"` becomes `isHotContent = true`.
- Author logic supports selected author and new author creation.
- `paid` and `published` are direct flags included in payload.

### Carousel / Upload

- `addCarouselItem()` pushes `{ imageUrl: "", caption: "" }`.
- `removeCarouselItem(index)` removes carousel item.
- `handleImageUpload(event, index)` uploads image and writes URL into `flipper.carouselContent[index].imageUrl`.
- Save блокируется while carousel image upload is active.

### Related / Collections / Placement

- Related content поддерживается and sanitized перед save.
- Content collection id включается in payload.
- `LandingPlacementPanel` is connected in composer.

## Save / Update

- `saveFlipper()` начинается в `src/components/dashboard/flipperCreatorLogic.ts:474`.
- Есть upload guard.
- Есть double-submit guard через `isSaving`.
- Update вызывает `flippersApi.update(this.flipperId, payload)`.
- Create вызывает `flippersApi.create(payload)`.
- Validation: title обязателен, каждый carousel item должен иметь image.
- Payload включает carousel content через spread `...this.flipper`, плюс normalized tags/Paris fields/hot/paid/related/content collection.

## Delete

- `deleteFlipper()` начинается в `src/components/dashboard/flipperCreatorLogic.ts:562`.
- Использует `flippersApi.delete(this.flipperId)`.

## Preview draft / localStorage

- Key: `flipperPreview`.
- Cleanup после успешного save: не найден.

## Redirects

- Update redirects to `this.onSaveRedirect || "/dashboard/flippers"`.
- Create redirects to `/dashboard/flippers`.

## Проблемы

- Delete использует общий `Button`, while Article/News/Guide/Event/VisualStory use ручной delete buttons.
- Cancel остается ручным.
- Preview draft cleanup отсутствует.
- Carousel rendering uses `:key="index"`, which is fragile for remove/reorder
  flows.
- Upload guard exists for preview/save, but add/remove slide controls do not
  consistently communicate upload-blocked state.

## Вердикт

Flipper близок по footer layout, но button implementation и preview cleanup не полностью унифицированы.
