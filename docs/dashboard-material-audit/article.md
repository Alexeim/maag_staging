# Article

Статус: source-verified на 2026-06-17, runtime-not-verified.

Цель файла: зафиксировать, как реально работает dashboard creator/editor/previewer для `article`, без догадок и без смешивания с roadmap.

## Source files

- Create page: `src/pages/dashboard/article/create.astro`
- Edit page: `src/pages/dashboard/article/[id]/edit.astro`
- Preview page: `src/pages/dashboard/article/preview.astro`
- Composer: `src/components/dashboard/ArticleComposer.astro`
- Logic: `src/components/article/creatorLogic.ts`

## Текущий workflow

- Create/edit UI живет в `ArticleComposer.astro`.
- Alpine state и actions живут в `creatorLogic.ts`.
- Preview открывается через `previewArticle()`.
- Preview draft хранится в `localStorage` под ключом `articlePreview`.
- Save/update выполняется через `saveArticle()`.
- Delete в footer вызывает `deleteArticle(deleteRedirect)`.

## Author logic

- Preview page рендерит автора через `ArticleAuthor`.
- Evidence: `src/pages/dashboard/article/preview.astro:47-49`.
- Preview берет `articleData.author.name` и `articleData.author.avatarUrl`.

Проблема:

- `previewArticle()` сохраняет в `articlePreview` только `article`, `articleId`, `isEditMode`, `routes`.
- Evidence: `src/components/article/creatorLogic.ts:1416-1425`.
- Отдельные поля `selectedAuthorId`, `useNewAuthor`, `newAuthorFirstName`, `newAuthorLastName` туда не пишутся.
- При восстановлении state `selectedAuthorId` затем выставляется из `article.authorId`.
- Evidence: `src/components/article/creatorLogic.ts:1019`.

Риск:

- Если автор выбран в UI, но еще не записан в `article.authorId`, после перехода в preview и возврата выбор автора может потеряться.

## Preview draft lifecycle

- Read: `localStorage.getItem("articlePreview")`.
- Evidence: `src/components/article/creatorLogic.ts:892`.
- Write: `localStorage.setItem("articlePreview", ...)`.
- Evidence: `src/components/article/creatorLogic.ts:1425`.
- Cleanup после save/update есть.
- Evidence: `src/components/article/creatorLogic.ts:1556`, `src/components/article/creatorLogic.ts:1564`.
- Есть дополнительный cleanup при загрузке non-preview state.
- Evidence: `src/components/article/creatorLogic.ts:986`.

Вывод:

- Article лучше большинства материалов по cleanup.
- Но author preview/persistence contract неполный.

## Block and media logic

- `previewArticle()` не вызывает auto-commit текущего редактируемого блока перед записью draft.
- Evidence: `src/components/article/creatorLogic.ts:1416-1425`.
- `saveArticle()` перед сохранением вызывает commit/update открытого блока.
- Evidence: `src/components/article/creatorLogic.ts:1429-1435`.

Риск:

- Preview может показать не то же состояние, которое потом сохранится.
- Если пользователь держит блок в edit-mode и идет в preview, часть несохраненного UI-state может не попасть в preview draft.

## Save/update/delete/cancel

- Save/update: `saveArticle()`.
- Delete: `deleteArticle(deleteRedirect)`.
- Cancel: footer ведет на `cancelHref`.
- Published/draft: через `PublicationToggle model="article"`.
- Footer layout: canonical-like layout `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Evidence: `src/components/dashboard/ArticleComposer.astro:1789-1816`.

## Known inconsistencies

- Author transient state не сохраняется в preview draft.
- Preview и save не используют один общий pre-submit/pre-preview commit pipeline.
- Footer похож на общий паттерн, но общий компонент отсутствует.

## First safe fix

1. Добавить в `articlePreview` полный author UI state.
2. При restore не перетирать preview `selectedAuthorId` значением из `article.authorId`.
3. Вынести общий helper для commit-current-block перед preview/save.
