# Tips

Статус: source-verified на 2026-06-17, runtime-not-verified.

## Source files

- Create page: `src/pages/dashboard/tips/create.astro`
- Edit page: `src/pages/dashboard/tips/[id]/edit.astro`
- Preview page: `src/pages/dashboard/tips/preview.astro`
- Composer: `src/components/dashboard/TipsArticleComposer.astro`
- Logic: `src/components/dashboard/tipsArticleCreatorLogic.ts`

## Текущий workflow

- Preview action: `previewArticle()`.
- Save/update action: `saveArticle()`.
- Preview draft key: `tipsPreview`.
- Delete action: `deleteArticle(deleteRedirect)`.

## Author logic

- Preview page рендерит автора через `ArticleAuthor`.
- Evidence: `src/pages/dashboard/tips/preview.astro:45-47`.
- `previewArticle()` сохраняет transient author fields.
- Evidence: `src/components/dashboard/tipsArticleCreatorLogic.ts:285-305`.

Проблема:

- Restore читает `selectedAuthorId` из `tipsPreview`.
- Evidence: `src/components/dashboard/tipsArticleCreatorLogic.ts:204-216`.
- Но позже `selectedAuthorId` выставляется из `article.authorId`.
- Evidence: `src/components/dashboard/tipsArticleCreatorLogic.ts:268`.

Риск:

- Автор может исчезать после preview return, если selected author был только в UI state.

## Preview draft lifecycle

- Read: `localStorage.getItem("tipsPreview")`.
- Evidence: `src/components/dashboard/tipsArticleCreatorLogic.ts:204`.
- Write: `localStorage.setItem("tipsPreview", ...)`.
- Evidence: `src/components/dashboard/tipsArticleCreatorLogic.ts:303-305`.
- Cleanup после save/update не найден в проверенных строках.

Риск:

- Старый draft может сохраняться в browser state дольше, чем ожидает пользователь.

## Block and media logic

- Tips работает не как большой article body, а как список tips/items.
- `previewArticle()` пишет draft без явного commit текущего редактируемого item.
- Evidence: `src/components/dashboard/tipsArticleCreatorLogic.ts:285-305`.
- `saveArticle()` перед сохранением вызывает update/commit текущего item.
- Evidence: `src/components/dashboard/tipsArticleCreatorLogic.ts:644-648`.
- `addTipsItem()` создает/переключает item editing flow.
- Evidence: `src/components/dashboard/tipsArticleCreatorLogic.ts:518-528`.

Главная гипотеза потери контента:

- Пользователь редактирует item, потом идет в preview или переключает действие до полного commit/upload.
- На быстрой машине это трудно поймать.
- На медленной машине или при тяжелых image uploads вероятность выше.

## Save/update/delete/cancel

- Published/draft: `PublicationToggle model="article"`.
- Footer layout отличается от большинства материалов.
- Evidence: `src/components/dashboard/TipsArticleComposer.astro:515-535`.
- Отличия:
  - `flex justify-between items-center gap-4 mt-4 pb-16` вместо canonical-like footer.
  - Cancel сделан как nested `<a><Button>`.
  - Delete стоит рядом с cancel в left group.

## Known inconsistencies

- Высокий риск data loss вокруг uncommitted tips item.
- Нет найденного cleanup `tipsPreview` после save/update.
- Footer отличается от остальных creators/editors.
- Preview/save используют разные степени подготовки state.

## First safe fix

1. Заблокировать preview/save, пока идет image upload или item находится в несохраненном editing state.
2. Перед preview выполнять тот же commit текущего item, что и перед save.
3. Добавить явный loading/disabled state для image upload.
4. Добавить cleanup `tipsPreview` после успешного save/update.
5. Привести footer к общему action layout.
