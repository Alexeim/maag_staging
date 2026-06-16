# Photo Of The Day

Статус: source-verified на 2026-06-17, runtime-not-verified.

## Source files

- Create page: `src/pages/dashboard/photo-of-the-day/create.astro`
- Edit page: `src/pages/dashboard/photo-of-the-day/[id]/edit.astro`
- Preview page: `src/pages/dashboard/photo-of-the-day/preview.astro`
- Composer: `src/components/dashboard/PhotoOfTheDayComposer.astro`
- Logic: `src/components/dashboard/photoOfTheDayCreatorLogic.ts`

## Текущий workflow

- Preview action: `previewPhoto()`.
- Save/update action: `savePhoto()`.
- Preview draft key: `photoOfTheDayPreview`.
- Delete action: `deletePhoto()`.

## Author logic

- Preview page импортирует `ArticleAuthor`.
- Evidence: `src/pages/dashboard/photo-of-the-day/preview.astro:3`.
- Но preview hardcodes author name as `Автор`.
- Evidence: `src/pages/dashboard/photo-of-the-day/preview.astro:37`.

Вывод:

- Это подтвержденный hardcoded author bug.

Persistence:

- Initial state выбирает `selectedAuthorId` из preview state или `photoDraft.authorId`.
- Evidence: `src/components/dashboard/photoOfTheDayCreatorLogic.ts:53-54`.
- `previewPhoto()` сохраняет `selectedAuthorId`.
- Evidence: `src/components/dashboard/photoOfTheDayCreatorLogic.ts:89-96`.

Вывод:

- Persistence выглядит лучше, чем у interview/news/tips/flipper.
- Главный author bug здесь не persistence, а preview rendering.

## Preview draft lifecycle

- Read: `localStorage.getItem("photoOfTheDayPreview")`.
- Evidence: `src/components/dashboard/photoOfTheDayCreatorLogic.ts:29`.
- Write: `localStorage.setItem("photoOfTheDayPreview", ...)`.
- Evidence: `src/components/dashboard/photoOfTheDayCreatorLogic.ts:96`.
- Cleanup после save/update не найден в проверенных строках.

## Block and media logic

- Photo is simpler than article-like materials: mostly single image/content payload.
- `previewPhoto()` writes draft without visible upload guard in checked lines.
- Evidence: `src/components/dashboard/photoOfTheDayCreatorLogic.ts:89-96`.
- `savePhoto()` validates and saves.
- Evidence: `src/components/dashboard/photoOfTheDayCreatorLogic.ts:148-168`.

Риск:

- Save/preview can be clicked while image upload is still pending unless guarded elsewhere.

## Save/update/delete/cancel

- Published/draft: `PublicationToggle model="photo"`.
- Footer layout differs from canonical-like layout.
- Evidence: `src/components/dashboard/PhotoOfTheDayComposer.astro:102-121`.
- Cancel exists.
- Evidence: `src/components/dashboard/PhotoOfTheDayComposer.astro:110-112`.
- Delete exists.
- Evidence: `src/components/dashboard/PhotoOfTheDayComposer.astro:105`.

## Known inconsistencies

- Preview author hardcoded.
- Footer layout differs from most materials.
- Preview draft cleanup absent or not found.
- Upload guard before preview/save needs verification.

## First safe fix

1. Render real selected author in preview instead of hardcoded `Автор`.
2. Add cleanup `photoOfTheDayPreview` after successful save/update.
3. Add/verify upload guard and clear image loading indication.
4. Bring footer into shared action layout.
