# Photo of the Day

## Область проверки

Фото дня. Проверены creator, editor, previewer, action footer,
save/update/delete, preview draft и redirects.

## Файлы

- Create page: `src/pages/dashboard/photo-of-the-day/create.astro`
- Edit page: `src/pages/dashboard/photo-of-the-day/[id]/edit.astro`
- Preview page: `src/pages/dashboard/photo-of-the-day/preview.astro`
- Composer: `src/components/dashboard/PhotoOfTheDayComposer.astro`
- Logic: `src/components/dashboard/photoOfTheDayCreatorLogic.ts`
- API/controller: `photosOfTheDayApi`, `server/src/controllers/photoOfTheDayController.ts`

## Creator

- Create page passes `isEditMode: false`.
- Create page sets `onSaveRedirect: "/dashboard/photo-of-the-day"`.
- Composer использует `x-data="$lazy('photoOfTheDayCreator', creatorState)"`.

## Editor

- Edit page загружает photo через `photosOfTheDayApi.getById(id)`.
- Передает `initialPhoto`, `photoId`, `isEditMode: true`.
- Composer не имеет delete id prop; delete visibility основана на `isEditMode`.

## Previewer

- Preview page использует `photoOfTheDayCreator` with `{ isPreview: true }`.
- Действия в header: `returnToEdit()` и `savePhoto()`.
- Preview storage key: `photoOfTheDayPreview`.
- Preview author rendering hardcoded: page рендерит
  `<ArticleAuthor name="Автор" />`, а не выбранного автора из
  `selectedAuthorId`.
- Author persistence выглядит устойчивее: preview draft сохраняет
  `selectedAuthorId`, а initial state читает его напрямую in preview mode.

## Action footer

- Footer начинается в `src/components/dashboard/PhotoOfTheDayComposer.astro:102`.
- Layout: `mt-8 flex justify-between gap-3`.
- Это отличается от majority responsive footer.
- Левая группа: delete при `isEditMode`.
- Правая группа: `PublicationToggle`, cancel, preview, save.
- Delete использует общий `Button`.
- Cancel: ручной inline `<a>`.
- Preview/save: общий `Button`.
- Disabled state save-кнопки включает `isSaving || uploading`.

## Карта логики

### State

- Основной объект: `photo`.
- Ключевые поля: `title`, `caption`, `imageUrl`, `published`, `publishedAt`.
- Editor state: `photoId`, `isEditMode`, `onSaveRedirect`, `selectedAuthorId`, `uploading`, `uploadProgress`, `isSaving`.

### Init / Author

- Init loads authors.
- If no `selectedAuthorId` exists and authors are available, first author is selected.
- New author creation flow отсутствует.

### Image / Preview / Publication

- `handleImageUpload()` uploads image and writes download URL into `photo.imageUrl`.
- `previewPhoto()` writes `photoOfTheDayPreview` with `photo`, `photoId`, `isEditMode`, `selectedAuthorId`.
- `PublicationToggle model="photo"` writes directly to `photo.published`.
- There are no tags/category/hot content/related content/content collection controls.

## Save / Update

- `savePhoto()` начинается в `src/components/dashboard/photoOfTheDayCreatorLogic.ts:148`.
- Требует title, image, selected author.
- Sets `isSaving = true`.
- Early `if (this.isSaving) return` guard перед этим не найден.
- Update вызывает `photosOfTheDayApi.update(this.photoId, payload)`.
- Create вызывает `photosOfTheDayApi.create(payload)`.
- Payload включает `title`, `imageUrl`, `caption`, `authorId`, `published`.
- Payload явно не включает `publishedAt`.

## Delete

- `deletePhoto()` начинается в `src/components/dashboard/photoOfTheDayCreatorLogic.ts:191`.
- Использует `photosOfTheDayApi.delete(this.photoId)`.

## Preview draft / localStorage

- Key: `photoOfTheDayPreview`.
- Cleanup после успешного save: не найден.

## Redirects

- Save redirects to `this.onSaveRedirect || "/dashboard/photo-of-the-day"`.
- Delete redirects to `/dashboard/photo-of-the-day`.

## Проблемы

- Footer layout не унифицирован.
- Footer не имеет majority mobile-first `flex-col` behavior.
- Early double-submit guard не найден.
- Preview draft cleanup отсутствует.
- Composer имеет меньше editorial sections; это может быть нормальным product decision, но сейчас не зафиксировано в коде.
- `savePhoto()` does not guard `uploading`; if save is clicked during image
  upload, validation can fail because `photo.imageUrl` is still empty.
- `previewPhoto()` can be opened while upload is still in progress.
- Save/preview buttons do not clearly communicate upload-blocked state.

## Вердикт

Photo of the Day - второй очевидно сломанный layout case после Tips. Нужна нормализация action footer и workflow.
