# Interview

Статус: source-verified на 2026-06-17, runtime-not-verified.

## Source files

- Create page: `src/pages/dashboard/interview/create.astro`
- Edit page: `src/pages/dashboard/interview/[id]/edit.astro`
- Preview page: `src/pages/dashboard/interview/preview.astro`
- Composer: `src/components/dashboard/InterviewComposer.astro`
- Logic: `src/components/dashboard/interviewCreatorLogic.ts`

## Текущий workflow

- Preview action: `previewInterview()`.
- Save/update action: `saveInterview()`.
- Preview draft key: `interviewPreview`.
- Delete action: `deleteInterview(deleteRedirect)`.

## Author logic

- Preview page рендерит автора через `ArticleAuthor`.
- Evidence: `src/pages/dashboard/interview/preview.astro:67-69`.
- `previewInterview()` сохраняет transient author fields.
- Evidence: `src/components/dashboard/interviewCreatorLogic.ts:500-523`.

Проблема:

- Restore читает `selectedAuthorId` из `interviewPreview`.
- Evidence: `src/components/dashboard/interviewCreatorLogic.ts:428-440`.
- Но позже `selectedAuthorId` выставляется из `interview.authorId`.
- Evidence: `src/components/dashboard/interviewCreatorLogic.ts:481`.

Риск:

- Выбранный автор может пропасть после preview return.
- Это совпадает с пользовательским наблюдением: author selected -> preview -> back -> author missing.

## Preview draft lifecycle

- Read: `localStorage.getItem("interviewPreview")`.
- Evidence: `src/components/dashboard/interviewCreatorLogic.ts:428`.
- Write: `localStorage.setItem("interviewPreview", ...)`.
- Evidence: `src/components/dashboard/interviewCreatorLogic.ts:523`.
- Cleanup после save/update не найден в проверенных строках.

## Block and media logic

- Interview имеет article-like block editor.
- Composer содержит update/delete block controls.
- Evidence: `src/components/dashboard/InterviewComposer.astro:872-873`, `src/components/dashboard/InterviewComposer.astro:1151`.
- Preview/save preparation нужно унифицировать, чтобы открытый block не терялся.

## Save/update/delete/cancel

- Published/draft: `PublicationToggle model="interview"`.
- Footer layout: canonical-like `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Evidence: `src/components/dashboard/InterviewComposer.astro:1200-1217`.
- Delete уже реализован в composer.
- Evidence: `src/components/dashboard/InterviewComposer.astro:1202-1205`.
- Cancel сделан raw `<a>` с button classes.

## Known inconsistencies

- High-priority author persistence bug.
- Preview draft cleanup отсутствует или не найден.
- Cancel implementation отличается от Button-based materials.

## First safe fix

1. Fix author preview/return persistence только в `interviewCreatorLogic.ts`.
2. Добавить cleanup `interviewPreview` после успешного save/update.
3. Не трогать footer/delete в первом PR, чтобы не смешивать workflow bugs и layout.
