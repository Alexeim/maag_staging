# astro check — что осталось (2026-09-28)

Редакторы статьи, гида, интервью, новостей, события и «первого лица» — 0 ошибок.
Ниже всё остальное, по группам. Проверка: `npx astro check` (для `server/` —
`cd server && npx tsc --noEmit`). Причины — по тексту ошибки, если не сказано
«проверено».

## 1. То же, что уже чинили в редакторах (готовый приём)

- **Авторы** — `flipperCreatorLogic.ts:280, 430, 457, 472, 488` (6),
  `visualStoryCreatorLogic.ts:294` (1). Как в статье: `EditorAuthor` /
  `LoadedAuthorFields` из `src/lib/utils/editorAuthors.ts`.
- **`event` в загрузках** — `flipperCreatorLogic.ts:570, 614` (2):
  `event: Event` + `(event.target as HTMLInputElement).files?.[0]`.
- **id в async-замыкании удаления** — `flipperCreatorLogic.ts:765` (1): `this.flipperId!`.

## 2. `Astro.params.id` — `string | undefined` (10)

`pages/article/[id].astro:44`, `guide/[id].astro:38`, `first-person/[id].astro:19`,
`flippers/[id].astro:21`, `dashboard/{article,event,first-person,guide,visual-story}/[id]/edit.astro:15`,
`dashboard/flippers/edit/[id].astro:15`. Нужно решить, что делать без id
(404 / редирект), — решение, не подпись.

## 3. Публичные страницы: `author` приходит как `unknown` (8)

`flippers/[id].astro:56, 117, 118` (5), `interviews/[id].astro:55, 112` (3).
В `api.ts` `author?: unknown` у ответов. Сначала проверить, что реально
отдаёт контроллер (`server/src/controllers/*`), потом описать тип.

## 4. Интервью, публичная страница (2)

- `interviews/[id].astro:121` — `heroOrientation` нет в `InterviewResponse`.
  Проверить, хранит ли его бэкенд.
- `interviews/[id].astro:132` — `content: unknown[]` не подходит под типы блоков.

## 5. `lib/utils/video.ts:136–159` — `parsed` может быть `null` (5)

## 6. Маркизы: атрибут `key` на элементах (5)

`ContentCollectionMarquee.astro:151, 260`, `RelatedContentMarquee.astro:238`,
`RelatedMaterialsMarquee.astro:158, 267`. `key` — из React, в Astro его нет.

## 7. Юридические страницы — импорт `.md` (3)

`cookies.astro:6`, `privacy.astro:6`, `terms.astro:6`: тип `MarkdownDocument`.

## 8. Разное (по одной-две)

- `ArticleBody.astro:280, 282` — `quoteAuthor` нет в типе `Block` (2).
- `ArticleTips.astro:57, 61` — type predicate не совпадает с параметром (2).
- `LandingBody.astro:299` — `null` там, где ждут `undefined` (1).
- `calendarEditorLogic.ts:201, 242` — `unknown` вместо типа выбора карточек (2).
- `landingPlacementManager.ts:31` — нет `photoOfTheDayFeature` в начальном
  состоянии (1). Это аудит 4.6, последствия не проверены.
- `landing-editor.astro:886, 1205` — `.id` у объединения, где у пустого
  варианта его нет (2).
- `lazyLoadPlugin.ts:95` — `$nextTick` (магия Alpine) не в типе (1).
