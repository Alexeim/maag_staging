# Le Saviez-vous

Статус: source-verified на 2026-06-17, runtime-not-verified.

Цель файла: зафиксировать, что `le-saviez-vous` сейчас не является отдельным полноценным creator engine, а использует article workflow.

## Source files

- Create page: `src/pages/dashboard/le-saviez-vous/create.astro`
- Edit page: `src/pages/dashboard/le-saviez-vous/[id]/edit.astro`
- Preview page: uses article preview flow.
- Composer: uses `src/components/dashboard/ArticleComposer.astro`
- Logic: uses `src/components/article/creatorLogic.ts`

## Текущий workflow

- Это отдельный material route, но не отдельная logic implementation.
- UI, preview draft, save/update/delete и block logic наследуют поведение `article`.
- Preview draft key: `articlePreview`.
- Save/update action: `saveArticle()`.
- Delete action: `deleteArticle(deleteRedirect)`.

## Author logic

- Author behavior совпадает с `article`.
- Preview рендерит `articleData.author.name` и `articleData.author.avatarUrl`.
- Evidence: `src/pages/dashboard/article/preview.astro:47-49`.

Проблема:

- Так как используется `creatorLogic.ts`, preview draft не хранит полный transient author UI state.
- Evidence: `src/components/article/creatorLogic.ts:1416-1425`.
- Restore может перезаписать `selectedAuthorId` из `article.authorId`.
- Evidence: `src/components/article/creatorLogic.ts:1019`.

## Preview draft lifecycle

- Read/write/cleanup совпадают с `article`.
- Read: `src/components/article/creatorLogic.ts:892`.
- Write: `src/components/article/creatorLogic.ts:1425`.
- Cleanup: `src/components/article/creatorLogic.ts:1556`, `src/components/article/creatorLogic.ts:1564`.

## Block and media logic

- Block/media risks совпадают с `article`.
- Preview не делает тот же обязательный commit открытого блока, который делает save.
- Evidence: `src/components/article/creatorLogic.ts:1416-1435`.

## Save/update/delete/cancel

- Реальное поведение определяется `ArticleComposer.astro`.
- Published/draft: `PublicationToggle model="article"`.
- Footer layout совпадает с article footer.
- Evidence: `src/components/dashboard/ArticleComposer.astro:1789-1816`.

## Known inconsistencies

- В документации и implementation plan нельзя описывать `le-saviez-vous` как отдельный engine, пока он технически использует article implementation.
- Любой fix в `creatorLogic.ts` затронет и `article`, и `le-saviez-vous`.

## First safe fix

1. Фиксить author preview/persistence один раз в article workflow.
2. После этого отдельно проверить create/edit pages `le-saviez-vous`, потому что route-specific redirects/type могут отличаться.
