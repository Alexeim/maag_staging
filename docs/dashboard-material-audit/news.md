# News

Статус: source-verified на 2026-06-17, runtime-not-verified.

## Source files

- Create page: `src/pages/dashboard/news/create.astro`
- Edit page: `src/pages/dashboard/news/[id]/edit.astro`
- Preview page: `src/pages/dashboard/news/preview.astro`
- Composer: `src/components/dashboard/NewsComposer.astro`
- Logic: `src/components/dashboard/newsCreatorLogic.ts`

## Текущий workflow

- Preview action: `previewArticle()`.
- Save/update action: `saveArticle()`.
- Preview draft key: `newsPreview`.
- Footer delete action: `deleteArticle(deleteRedirect)`.

## Author logic

- Preview page рендерит автора через `ArticleAuthor`.
- Evidence: `src/pages/dashboard/news/preview.astro:54-56`.
- `previewArticle()` сохраняет transient author fields:
  - `selectedAuthorId`
  - `useNewAuthor`
  - `newAuthorFirstName`
  - `newAuthorLastName`
- Evidence: `src/components/dashboard/newsCreatorLogic.ts:448-471`.

Проблема:

- Restore сначала читает `selectedAuthorId` из preview state.
- Evidence: `src/components/dashboard/newsCreatorLogic.ts:382-394`.
- Но позже `selectedAuthorId` выставляется из `article.authorId`.
- Evidence: `src/components/dashboard/newsCreatorLogic.ts:432`.

Риск:

- Выбранный автор может пропасть после preview return, если `article.authorId` еще не синхронизирован с UI selection.

## Preview draft lifecycle

- Read: `localStorage.getItem("newsPreview")`.
- Evidence: `src/components/dashboard/newsCreatorLogic.ts:382`.
- Write: `localStorage.setItem("newsPreview", ...)`.
- Evidence: `src/components/dashboard/newsCreatorLogic.ts:471`.
- Cleanup после save/update не найден в проверенных строках.

Риск:

- Старый `newsPreview` может пережить успешное сохранение и потом влиять на следующий preview/edit flow.

## Block and media logic

- News имеет block editor с `updateBlock()`, `deleteBlock(index)` и editing state.
- Evidence: `src/components/dashboard/NewsComposer.astro:388-441`.
- Preview/save logic нужно держать под одним contract: перед preview и save должен быть одинаковый commit текущего блока.

## Save/update/delete/cancel

- Published/draft: `PublicationToggle model="article"`.
- Footer layout: canonical-like `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Evidence: `src/components/dashboard/NewsComposer.astro:468-494`.
- Cancel реализован через link/button area внутри footer.

## Known inconsistencies

- Preview draft cleanup отсутствует или не найден.
- Restore author state может перетираться.
- Footer похож на article/guide, но общий компонент отсутствует.

## First safe fix

1. Защитить restore author: preview `selectedAuthorId` должен иметь приоритет над `article.authorId`.
2. Добавить cleanup `newsPreview` после успешного save/update.
3. Унифицировать pre-preview/pre-save block commit.
