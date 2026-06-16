# Guide

Статус: source-verified на 2026-06-17, runtime-not-verified.

## Source files

- Create page: `src/pages/dashboard/guide/create.astro`
- Edit page: `src/pages/dashboard/guide/[id]/edit.astro`
- Preview page: `src/pages/dashboard/guide/preview.astro`
- Composer: `src/components/dashboard/GuideComposer.astro`
- Logic: `src/components/article/guideCreatorLogic.ts`

## Текущий workflow

- Preview action: `previewArticle()`.
- Save/update action: `saveArticle()`.
- Preview draft key: `guidePreview`.
- Delete action: `deleteArticle(deleteRedirect)`.

## Author logic

- Preview page рендерит автора через `ArticleAuthor`.
- Evidence: `src/pages/dashboard/guide/preview.astro:47-49`.

Проблема:

- `previewArticle()` сохраняет только `article`, `articleId`, `isEditMode`.
- Evidence: `src/components/article/guideCreatorLogic.ts:1145-1151`.
- Полный transient author UI state не сохраняется.
- Restore затем выставляет `selectedAuthorId` из `article.authorId`.
- Evidence: `src/components/article/guideCreatorLogic.ts:785`.

Риск:

- Author selection может теряться после preview return.

## Preview draft lifecycle

- Read: `localStorage.getItem("guidePreview")`.
- Evidence: `src/components/article/guideCreatorLogic.ts:679`.
- Write: `localStorage.setItem("guidePreview", ...)`.
- Evidence: `src/components/article/guideCreatorLogic.ts:1151`.
- Cleanup после save/update есть.
- Evidence: `src/components/article/guideCreatorLogic.ts:1281`, `src/components/article/guideCreatorLogic.ts:1289`.
- Есть cleanup при загрузке non-preview state.
- Evidence: `src/components/article/guideCreatorLogic.ts:757`.

## Block and media logic

- Guide похож на article: большой block editor, много media block variants.
- `previewArticle()` не делает тот же auto-commit открытого блока, который делает save.
- Evidence: `src/components/article/guideCreatorLogic.ts:1145-1161`.

Риск:

- Preview и save могут расходиться для открытого редактируемого блока.

## Save/update/delete/cancel

- Published/draft: `PublicationToggle model="article"`.
- Footer layout: canonical-like `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Evidence: `src/components/dashboard/GuideComposer.astro:1461-1487`.

## Known inconsistencies

- Author transient state отсутствует в preview draft.
- Preview/save preparation не унифицированы.
- Footer похож на article/news, но общего компонента нет.

## First safe fix

1. Сохранять полный author UI state в `guidePreview`.
2. Restore должен уважать preview `selectedAuthorId`.
3. Вынести общий pre-preview/pre-save block commit contract.
