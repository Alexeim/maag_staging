# Roadmap: полное editorial-разделение `landing`, `culturePage` и `parisPage`

## Зачем нужен этот документ

Сейчас у нас смешанная модель:

- часть landing уже управляется через `editorialPlacements`;
- `calendarPage` уже вынесен в отдельный document;
- `culture` и `paris` страницы до сих пор собираются из авто-логики;
- `isMainInCategory` одновременно влияет и на landing, и на section pages;
- creator/composer формы всё ещё содержат legacy-checkbox, который фактически управляет page composition.

Это создаёт несколько проблем:

- нет одного понятного source of truth;
- landing и section pages начинают спорить за один и тот же флаг;
- редактор не может независимо выставить hero на landing и hero на `/culture` или `/paris`;
- public pages содержат скрытые fallback-ветки, размазанные по Astro-файлам;
- dashboard не отражает полную editorial architecture проекта.

Цель этого roadmap:

- перейти на **полное разделение editorial placements по страницам**;
- убрать `isMainInCategory` из роли source of truth;
- расширить `landing-editor` и добавить page-specific editors;
- сохранить безопасную миграцию без big-bang переписывания.

---

## Короткий вердикт по feasibility

Да, это **реализуемо**.

Но это не “маленькая правка”, а архитектурный рефактор в несколько этапов:

1. backend schema и endpoints;
2. frontend API types;
3. dashboard editors;
4. creator quick-actions;
5. public pages;
6. migration и удаление legacy checkbox.

Правильный путь:

- не переписывать всё за один заход;
- не удалять `isMainInCategory` в первом же PR;
- сначала ввести новые placement-документы;
- потом перевести public pages на новые документы;
- и только после этого вычистить legacy field из creators, payloads и controllers.

---

## Главный архитектурный принцип

Нужно жёстко разделить:

1. **Content metadata**
2. **Page composition**

### Content metadata

Это свойства самого материала:

- `category`
- `tags`
- `paid`
- `isHotContent`
- `contentCollectionId`
- автор
- дата

### Page composition

Это ответ на вопрос:

> Где именно этот материал стоит на конкретной странице?

Именно это должно жить в `editorialPlacements`.

Ключевое правило новой модели:

**Материал принадлежит рубрике через `category`, но попадает в hero/rail/section только через placements.**

---

## Что считаем legacy и что считаем целевой моделью

### Legacy

- `isMainInCategory`
- авто-выбор hero через `find(item => isMainInCategoryItem(item))`
- auto-подбор top stories в `LandingBody.astro`
- auto-подбор primary item в `culture.astro`
- auto-подбор primary item в `paris.astro`
- любые creator-checkbox флаги, которые управляют layout конкретной страницы

### Целевая модель

- `landing` управляется только `landing` placement document
- `calendarPage` управляется только `calendarPage` placement document
- `/culture` управляется только `culturePage` placement document
- `/paris` управляется только `parisPage` placement document

---

## Best practice, на которую ориентируемся

Так обычно устроено в крупных медиа:

1. taxonomy/feed отвечает за принадлежность материала рубрике;
2. page curation отвечает за визуальную сборку страницы;
3. section page hero не обязан совпадать с landing section hero;
4. homepage и section pages могут ссылаться на один и тот же материал, но это осознанное редакционное решение;
5. ручные placements управляют верхними и curated-зонами;
6. длинный feed чаще остаётся авто-генерируемым из категории с вычитанием уже использованных материалов.

Из этого следует важное решение:

**Мы не связываем landing hero и section page hero общим флагом.**

Если когда-нибудь понадобится синхронизация, она должна быть отдельным mode, а не побочным эффектом checkbox-а.

---

## Целевая карта placement documents

У нас уже есть:

- `landing`
- `calendarPage`

Нужно добавить:

- `culturePage`
- `parisPage`

Итоговая карта:

```ts
editorialPlacements/
  landing
  calendarPage
  culturePage
  parisPage
```

---

## Что именно должно управляться через placements

## `landing`

Landing должен управлять **всем curated content**, а не только текущими 4 слотами.

Минимальный целевой набор:

```ts
landing = {
  schemaVersion: 3,

  mainHero: null | manual,
  newsRail: null | auto-latest | manual,
  netlenkaRail: null | auto-latest | manual,
  eventCard: null | auto-nearest | manual,

  cultureSection: {
    hero: null | manual,
    cards: null | auto-latest | manual,
    interviewBlock: null | auto-latest | manual,
  },

  parisSection: {
    hero: null | manual,
    cards: null | auto-latest | manual,
  },

  updatedAt: Timestamp | null,
  updatedBy: string | null,
}
```

### Что это значит

- `cultureSection.hero` заменяет текущую роль `isMainInCategory` для culture-блока на landing
- `parisSection.hero` заменяет текущую роль `isMainInCategory` для paris-блока на landing
- `cultureSection.cards` управляет тремя карточками под hero
- `parisSection.cards` управляет тремя карточками под hero
- `cultureInterviewBlock` логичнее вложить в `cultureSection`, а не держать отдельным top-level полем

Примечание:

Для совместимости на первом этапе можно оставить старое поле `cultureInterviewBlock`, а перенос внутрь `cultureSection` сделать позже в `schemaVersion: 4`.

---

## `culturePage`

Для `/culture` не нужно вручную оркестрировать весь бесконечный feed.

Нужно управлять только curated-зонами верхней части страницы:

```ts
culturePage = {
  schemaVersion: 1,

  hero: null | manual,
  secondaryStories: null | auto-latest | manual,
  featuredInterview: null | auto-latest | manual,
  sidebarRail: null | auto-hot | manual,

  updatedAt: Timestamp | null,
  updatedBy: string | null,
}
```

### Что остаётся auto

Нижний grid/carousel feed лучше оставить авто-генерируемым:

- берём category = `culture`
- исключаем hero
- исключаем `secondaryStories`
- исключаем `featuredInterview`
- исключаем `sidebarRail`
- исключаем hot content, если это уже отдельная зона

Такой подход соответствует нормальной newsroom-практике:

- curated top zone управляется редактором;
- длинный feed остаётся живым category feed.

---

## `parisPage`

Аналогично для `/paris`:

```ts
parisPage = {
  schemaVersion: 1,

  hero: null | manual,
  secondaryStories: null | auto-latest | manual,
  leSaviezVousFeature: null | auto-latest | manual,
  sidebarRail: null | auto-hot | manual,

  updatedAt: Timestamp | null,
  updatedBy: string | null,
}
```

Нижний feed также остаётся авто-генерируемым по категории `paris` с исключением уже использованных placements.

---

## Решение по `isMainInCategory`

### Что делаем

`isMainInCategory` больше не должен управлять:

- landing culture hero
- landing paris hero
- `/culture` page hero
- `/paris` page hero

### Что делаем на переходе

На время миграции:

- public pages сначала читают новый placement;
- если placement отсутствует, используют legacy fallback;
- fallback может читать `isMainInCategory`;
- после стабилизации fallback удаляется.

### Финальная цель

Поле `isMainInCategory` удаляется из:

- API payloads
- forms
- creators
- dashboard composer logic
- public pages selection logic

---

## Creator UX: что должно появиться вместо checkbox

Текущий checkbox должен уйти.

В creator/composer интерфейсах нужно заменить его на **Placement Panels / Quick Actions**.

Для материалов категории `culture` и `paris` логична такая структура:

### 1. Размещение на landing

Это уже существующий блок:

- `Main Hero`
- `Event Card`
- `Culture Interview Block`

Его нужно сохранить и расширить.

### 2. Главный материал рубрики на landing

Новый блок quick actions:

- если `category === culture`, дать действие:
  - “Сделать главным материалом блока «Культура» на landing”
- если `category === paris`, дать действие:
  - “Сделать главным материалом блока «Париж» на landing”

Дополнительно:

- показать текущий статус;
- дать кнопку “Снять из hero рубрики на landing”;
- не показывать этот блок для материалов без `culture/paris` категории.

### 3. Главный материал page-specific section

Ещё один новый блок quick actions:

- если `category === culture`, дать действие:
  - “Сделать hero страницы /culture”
- если `category === paris`, дать действие:
  - “Сделать hero страницы /paris”

Также:

- показать, стоит ли материал сейчас hero section page;
- дать clear action;
- не привязывать эту кнопку к landing hero.

### Важное уточнение

Creator quick actions не должны становиться полным editor'ом страницы.

Их задача:

- быстро назначить текущий материал в 1-2 ключевых slot-а;
- показать текущий статус placement-а;
- не заменять полноценные page editors.

---

## Dashboard editors: что нужно добавить

## `landing-editor`

Нужно расширить существующий `/dashboard/landing-editor`, чтобы он управлял всем curated landing-контентом:

- `mainHero`
- `newsRail`
- `netlenkaRail`
- `eventCard`
- `cultureSection.hero`
- `cultureSection.cards`
- `cultureSection.interviewBlock`
- `parisSection.hero`
- `parisSection.cards`

### Что важно

Если landing должен управляться “полностью”, то список карточек culture/paris нельзя оставлять только на авто-логике в `LandingBody.astro`.

Нужно явно дать редактору:

- manual mode
- auto mode
- порядок карточек
- ограничения по количеству

---

## `culture-editor`

Нужна отдельная страница, по аналогии с `calendar-editor`:

```ts
/dashboard/culture-editor
```

Она должна управлять:

- `hero`
- `secondaryStories`
- `featuredInterview`
- `sidebarRail`

---

## `paris-editor`

Нужна отдельная страница:

```ts
/dashboard/paris-editor
```

Она должна управлять:

- `hero`
- `secondaryStories`
- `leSaviezVousFeature`
- `sidebarRail`

---

## Backend scope

## 1. API schema и types

Нужно расширить `src/lib/api/api.ts`:

- типы `CulturePagePlacementsResponse`
- типы `ParisPagePlacementsResponse`
- payload types для `updateCulturePage`
- payload types для `updateParisPage`
- при необходимости новая `landing` schema version

## 2. Frontend API methods

Нужно добавить:

```ts
editorialPlacementsApi.getCulturePage()
editorialPlacementsApi.updateCulturePage()
editorialPlacementsApi.getParisPage()
editorialPlacementsApi.updateParisPage()
```

## 3. Backend controller

Нужно обновить server-side controller для `editorialPlacements`:

- чтение и нормализация `culturePage`
- чтение и нормализация `parisPage`
- валидация manual ids
- валидация допустимых content types по slot-ам
- безопасная нормализация старых документов

## 4. Migration support

Нужно поддержать мягкую миграцию:

- документы могут отсутствовать;
- backend возвращает default schema;
- frontend не падает, если placement ещё не настроен.

---

## Frontend scope

## 1. Public pages

Нужно обновить:

- `src/components/common/LandingBody.astro`
- `src/pages/culture.astro`
- `src/pages/paris.astro`

### Для landing

Нужно убрать прямую зависимость от:

- `isMainInCategory`
- “первого свежего материала категории”

и заменить её на:

- explicit `landing.cultureSection.*`
- explicit `landing.parisSection.*`

### Для culture/paris pages

Нужно убрать выбор hero через:

```ts
find(item => isMainInCategoryItem(item)) ?? firstItem
```

и заменить на:

- `culturePage.hero`
- `parisPage.hero`

с переходным fallback только на время миграции.

## 2. Dashboard editors

Нужно создать:

- `culture-editor.astro`
- `paris-editor.astro`
- соответствующую Alpine logic по образцу `calendarEditorLogic.ts`

## 3. Placement panels в creators

Нужно расширить:

- `LandingPlacementPanel.astro`
- `landingPlacementManager.ts`

или создать более общий panel manager, например:

```ts
createEditorialPlacementManager()
```

чтобы он умел:

- landing main hero
- landing culture hero
- landing paris hero
- culture page hero
- paris page hero
- featured interview / event where relevant

## 4. Composer forms

Нужно убрать checkbox `isMainInCategory` из:

- `ArticleComposer.astro`
- `GuideComposer.astro`
- `NewsComposer.astro`
- `TipsArticleComposer.astro`
- и соответствующей creator logic

Но удалять его из UI нужно только после того, как новые placements уже работают end-to-end.

---

## Предлагаемый порядок реализации

## Этап 0. Freeze и архитектурное решение

- [x] подтверждаем, что идём в full separation
- [x] фиксируем roadmap
- [ ] не добавляем новые checkbox-флаги
- [ ] считаем `isMainInCategory` deprecated

## Этап 1. Backend foundation

- [ ] добавить `culturePage` и `parisPage` в backend editorial placements
- [ ] описать default schema
- [ ] добавить `GET/PUT` endpoints
- [ ] расширить frontend API client types

## Этап 2. Public pages with safe fallback

- [ ] перевести `/culture` на `culturePage` placements
- [ ] перевести `/paris` на `parisPage` placements
- [ ] расширить landing schema для culture/paris section slots
- [ ] перевести `LandingBody.astro` на новые landing section placements
- [ ] сохранить временный fallback на legacy-логику

## Этап 3. Dashboard editors

- [ ] расширить `/dashboard/landing-editor`
- [ ] добавить `/dashboard/culture-editor`
- [ ] добавить `/dashboard/paris-editor`
- [ ] реализовать manual/auto режимы для новых slot-ов

## Этап 4. Creator quick actions

- [ ] заменить checkbox `isMainInCategory` на placement panels
- [ ] добавить section “hero рубрики на landing”
- [ ] добавить section “hero страницы рубрики”
- [ ] проверить доступность этих actions только для релевантных категорий

## Этап 5. Legacy cleanup

- [ ] удалить `isMainInCategory` из UI
- [ ] удалить `isMainInCategory` из payloads
- [ ] удалить `isMainInCategory` из public page logic
- [ ] удалить legacy fallback после migration window

---

## Что не надо делать

### 1. Не надо связывать landing и section pages общим флагом

Плохо:

- один checkbox решает hero и для landing, и для `/culture`

Хорошо:

- landing hero и section page hero живут независимо

### 2. Не надо вручную оркестрировать весь длинный feed

Плохо:

- редактор руками управляет каждой карточкой всего feed

Хорошо:

- editor управляет curated top zones
- feed остаётся category-driven

### 3. Не надо удалять legacy field в первом же этапе

Плохо:

- сразу убрать `isMainInCategory`
- потом ловить пустые страницы и недостающие placements

Хорошо:

- сначала placements
- потом public pages
- потом creators
- потом cleanup

---

## Главные риски

1. Разъезд схемы между backend и frontend.
2. Случайное дублирование материала между hero и cards, если не будет централизованного exclusion logic.
3. Слом creator UX, если убрать checkbox раньше времени.
4. Сложность `landing-editor`, если пытаться сделать “всё и сразу” без staged rollout.
5. Миграционные баги в документах, если не нормализовать пустые поля и старые версии schema.

---

## Практическое решение по ближайшему implementation scope

Чтобы не раздувать первый PR, разумный старт такой:

### PR 1

- backend support для `culturePage` и `parisPage`
- frontend API types
- roadmap зафиксирован

### PR 2

- `culture-editor`
- `paris-editor`
- перевод `/culture` и `/paris` на placements с fallback

### PR 3

- расширение `landing` schema для culture/paris sections
- перевод `LandingBody.astro` на новые slots
- расширение `/dashboard/landing-editor`

### PR 4

- замена `isMainInCategory` checkbox на placement quick actions
- cleanup creators

### PR 5

- final legacy removal

---

## Итоговое решение

Финальная архитектура должна быть такой:

- `landing` управляет только landing
- `calendarPage` управляет только calendar
- `culturePage` управляет только culture
- `parisPage` управляет только paris
- `category` определяет принадлежность материала рубрике
- placements определяют композицию страницы
- `isMainInCategory` больше не существует как editorial source of truth

Это и есть целевая clean model, на которую стоит переводить проект.
