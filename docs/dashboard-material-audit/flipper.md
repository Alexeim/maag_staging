# Flipper

Статус: source-verified на 2026-06-17, runtime-not-verified.

## Source files

- Create page: `src/pages/dashboard/flippers/create.astro`
- Edit page: `src/pages/dashboard/flippers/edit/[id].astro`
- Preview page: `src/pages/dashboard/flippers/preview.astro`
- Composer: `src/components/dashboard/FlipperComposer.astro`
- Logic: `src/components/dashboard/flipperCreatorLogic.ts`

## Текущий workflow

- Preview action: `previewFlipper()`.
- Save/update action: `saveFlipper()`.
- Preview draft key: `flipperPreview`.
- Delete action: `deleteFlipper()`.

## Author logic

- Preview page рендерит автора через `ArticleAuthor`.
- Evidence: `src/pages/dashboard/flippers/preview.astro:45-47`.
- `previewFlipper()` сохраняет transient author fields.
- Evidence: `src/components/dashboard/flipperCreatorLogic.ts:239-257`.

Проблема:

- Restore читает `selectedAuthorId` из `flipperPreview`.
- Evidence: `src/components/dashboard/flipperCreatorLogic.ts:173-185`.
- Но позже `selectedAuthorId` выставляется из `flipper.authorId`.
- Evidence: `src/components/dashboard/flipperCreatorLogic.ts:212`.

Риск:

- Author selection может теряться после preview return.

## Preview draft lifecycle

- Read: `localStorage.getItem("flipperPreview")`.
- Evidence: `src/components/dashboard/flipperCreatorLogic.ts:173`.
- Write: `localStorage.setItem("flipperPreview", ...)`.
- Evidence: `src/components/dashboard/flipperCreatorLogic.ts:257`.
- Cleanup после save/update не найден в проверенных строках.

## Block and media logic

- Flipper работает с carousel/items, а не article body.
- Preview/save должны блокироваться на время image upload.
- В composer carousel items используют index key.
- Evidence: `src/components/dashboard/FlipperComposer.astro:208`.

Риск:

- Index-based key в списке может давать UI mismatch при reorder/delete/edit, если item identity не стабильна.

## Save/update/delete/cancel

- Published/draft: `PublicationToggle model="flipper"`.
- Footer layout: canonical-like `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Evidence: `src/components/dashboard/FlipperComposer.astro:249-268`.

## Known inconsistencies

- Author restore может перетираться.
- Preview draft cleanup отсутствует или не найден.
- Carousel index key is a stability risk.

## First safe fix

1. Fix author restore priority.
2. Add cleanup `flipperPreview` after save/update.
3. Replace index-only item identity with stable item ids before bigger carousel refactors.
