# Guide

## Область проверки

Путеводитель. Проверены creator, editor, previewer, action footer,
save/update/delete, preview draft и redirects.

## Файлы

- Create page: `src/pages/dashboard/guide/create.astro`
- Edit page: `src/pages/dashboard/guide/[id]/edit.astro`
- Preview page: `src/pages/dashboard/guide/preview.astro`
- Composer: `src/components/dashboard/GuideComposer.astro`
- Logic: `src/components/article/guideCreatorLogic.ts`
- API/controller: `guidesApi`, `server/src/controllers/guideController.ts`

## Creator

- Create page passes `isEditMode: false`.
- Create page sets `onSaveRedirect: "/dashboard/guides"`.
- Composer использует `x-data="$lazy('guideCreator', guideCreatorState)"`.

## Editor

- Edit page загружает guide через `guidesApi.getById(id)`.
- Передает `initialArticle`, `articleId`, `isEditMode: true`.
- Передает `deleteGuideId={id}` и `deleteRedirect="/dashboard/guides"`.

## Previewer

- Preview page использует `guideCreator` with `{ isPreview: true }`.
- Действия в header: `returnToEdit()` и `saveArticle()`.
- Preview storage key: `guidePreview`.
- Preview author rendering не использует выбранного автора из draft: page
  рендерит `ArticleAuthor` из статического `articleData.author.name` и
  `articleData.author.avatarUrl`.
- Author persistence bug: `previewArticle()` не сохраняет `selectedAuthorId`,
  `useNewAuthor`, `newAuthorFirstName`, `newAuthorLastName`; после return-to-edit
  `init()` восстанавливает `selectedAuthorId` только из `article.authorId`, где
  выбранного, но еще не сохраненного автора может не быть.

## Action footer

- Footer начинается в `src/components/dashboard/GuideComposer.astro:1460`.
- Layout: `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Левая группа: delete только в edit mode.
- Правая группа: `PublicationToggle`, cancel, preview, save.
- Delete condition использует Alpine state `isEditMode && articleId`, not `deleteGuideId`.
- Cancel: ручной inline `<a>`.
- Preview/save: общий `Button`.

## Карта логики

- Guide logic почти повторяет Article logic: `article` state, title/caption edit state, authors, category/tags, Paris district, tips, content blocks, related content.
- Init читает `guidePreview`, нормализует loaded guide или preview draft, затем нормализует tags, Paris fields, tips, related content и blocks.
- Title/caption logic повторяет Article: edit копирует во temporary text, save пишет trim-значение, cancel не меняет source state.
- Author logic повторяет Article: selected author или creation через `authorsApi.create`.
- Category/tag logic повторяет Article, включая legacy `hotContent` normalization.
- Block logic повторяет Article, но content block normalization идет через guide-specific helpers.
- Related content и content collections подключены.
- `LandingPlacementPanel` подключен для material placement controls.

## Save / Update

- `saveArticle()` начинается в `src/components/article/guideCreatorLogic.ts:1155`.
- Есть upload guard.
- Есть double-submit guard через `isSaving`.
- Update вызывает `guidesApi.update(this.articleId, payload)`.
- Create вызывает `guidesApi.create(payload)`.
- После create/update удаляет `guidePreview`.
- Перед save открытый block auto-commit-ится.
- Validation: category или hot content обязательны, минимум один selected category tag обязателен, cover image обязателен, video blocks должны быть валидны.
- Payload включает `binaryForGuide: isParisCategory`, `tips`, `published`, related content и content collection id.

## Delete

- `deleteArticle(redirectUrl)` начинается в `src/components/article/guideCreatorLogic.ts:1310`.
- Использует `guidesApi.delete(this.articleId)`.

## Preview draft / localStorage

- Key: `guidePreview`.
- Cleanup после успешного save: есть.
- Mismatched preview draft cleanup: есть.

## Redirects

- Update redirects to `this.onSaveRedirect || "/dashboard/guides"`.
- Create redirect currently использует `dashboard/guides` без leading slash.

## Проблемы

- `deleteGuideId` принимается и передается из edit page, но footer использует `articleId`.
- Cancel/delete не вынесены в общий action component.
- Create redirect содержит конкретный bug: нет leading slash.
- Open block can be lost on preview because `previewArticle()` does not
  auto-commit `editingBlock`, while `saveArticle()` does.
- `addBlock(type)` can switch editing to a new block while a previous
  `editingBlock` has unsaved changes.
- Upload guard is inconsistent: save blocks uploads, preview does not; block
  update can still be clicked during upload.

## Вердикт

Guide близок к Article структурно, но есть drift в prop wiring и redirect bug.
