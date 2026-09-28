# astro check — что осталось (2026-09-28)

Было 55 ошибок, теперь 0. Проверка:
`npx astro check` (для `server/` — `cd server && npx tsc --noEmit`).

Ниже — что и почему сделано, чтобы не расследовать заново.

## 1. Редакторы flipper / visual story

Как в статье: `EditorAuthor` / `LoadedAuthorFields`, `event: Event` +
`(event.target as HTMLInputElement).files?.[0]`, `this.flipperId!` в удалении.

## 2. `Astro.params.id` — `string | undefined`

Не решение, а формальность: для сегмента `[id]` Astro строит `([^/]+?)`
(`getPattern` в `astro/dist`), то есть id на такой странице всегда непустой.
Везде `if (!id) return Astro.redirect("/404");` сразу после чтения —
ветка недостижима, поведение не меняется.

## 3–4. Публичные страницы flipper и интервью

- `author` в `FlipperResponse` / `InterviewResponse` — `AuthorPayload | null`:
  `getById` кладёт сырой документ `authors/{authorId}` (без id) или `null`;
  списки его не отдают.
- `heroOrientation?: "image-left" | "image-right"` добавлен в
  `InterviewPayload` — бэкенд его хранит.
- Блоки приводятся на странице к `ComponentProps<typeof ArticleBody>`
  (интервью, статья, гид, «первое лицо»): бэкенд хранит `content` как
  `any[]` без валидации.
- Статья, гид, «первое лицо» больше не держат данные в `any`. Это вскрыло
  `heroOrientation` (статья, гид) и `updatedAt` (гид), которых не было в
  типах, и мёртвые фоллбеки статьи на поля мок-JSON 2025-09 (`header`,
  `meta.readTime`, `mainImage`, `eventDetails`) — их никогда не писали ни
  API, ни скрипты; удалены вместе с `EventDetails.astro`, как и такие же в
  `tips/[id].astro` и `events/[id].astro`. Сам мок `Article.json` удалён
  вместе с демо-страницей `/article-variant`, которая его читала, и
  компонентами, нужными только ей.

## Остальное

- `video.ts` — `isHttpUrl` стал type predicate (`parsed is URL`).
- Маркизы — атрибут `key` удалён: в Astro это просто HTML-атрибут
  (`addAttribute(..., "key")`), никто его не читал.
- Юридические страницы — `LegalPageLayout` принимает `MarkdownInstance` из
  `astro`, форма frontmatter приводится в одном месте.
- `ArticleBody` — `quoteAuthor` в типе `Block` (редактор интервью его пишет,
  бэкенд хранит блоки целиком).
- `ArticleTips` — предикат с `url: string | undefined`, как в данных.
- `LandingBody` — `quote={interviewQuote ?? undefined}`: `null` не включал
  дефолт `LatestInterview`, читатель видел пустые кавычки вместо заглушки.
  **Меняет вывод на главной** (решение владельца).
- `calendarEditorLogic` — `unknown` заменён типами выбора из `api.ts`.
- `landingPlacementManager` — добавлен `photoOfTheDayFeature: auto-latest`
  (как на сервере). Аудит 4.6: последствий не было — менеджер это поле не
  читает и не отправляет.
- `api.ts` — убран вариант `PhotoOfTheDayFeatureEmptySelection`
  (`mode: "empty"`): сервер его не знает, пустой слот — `null`.
- `lazyLoadPlugin` — `Alpine.nextTick` вместо `this.$nextTick` (та же
  функция: `magic('nextTick', () => nextTick)`).

## Публичные страницы без `any` (2026-09-28)

На `src/pages` вне дашборда `any` больше нет. Карточки culture/paris —
`PublicCardItem`, события календаря — `PublicCalendarEvent` (`api.ts`). Оба
типа — зеркало серверных `toLandingItem()` и `toPublicCalendarEvent()` в
`publicLandingController.ts`: меняешь поле там — меняй и тип. Главная
(`PublicLandingResponse`, `MainLandingBlock`, `LandingBody`) — тоже
`PublicCardItem`. Проверка всего сразу: `npm run check` (не при запущенном
`npm run dev`).
