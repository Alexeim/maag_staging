# Roadmap: `calendarPage` editor и data-driven календарь

## Зачем нужен этот документ

Сейчас календарная страница живёт на смешанной и неочевидной логике:

- верхний блок собирается автоматически из `isMainEvent`;
- нижний блок из 4 карточек собирается автоматически по неясным правилам;
- редактор не управляет этими блоками как явными slot'ами;
- поведение страницы нельзя предсказать по данным.

Для новой архитектуры это неприемлемо.

Новая цель:

- сделать для календаря отдельный editorial document `calendarPage`;
- сделать отдельный dashboard editor по паттерну `landing-editor`;
- перевести публичную страницу `calendar.astro` на явное чтение этого документа;
- убрать скрытые fallback'и;
- зафиксировать правило:

`no data = empty`

Это базовое правило всей новой модели.

---

## Статус реализации

- [x] roadmap создан и утверждён
- [x] backend schema `calendarPage` добавлена в `editorialPlacementsController.ts`
- [x] backend endpoints `GET/PUT /api/editorial-placements/calendar-page` добавлены
- [x] frontend API client для `calendarPage`
- [x] dashboard page `calendar-editor`
- [x] Alpine logic `calendarEditor`
- [x] lazy loader registration и skeleton state
- [x] перевод `src/pages/calendar.astro` на `calendarPage`
- [x] auto-режим `secondaryCards` уточнён до current week Monday-Sunday после product feedback
- [x] проверка сборки и финальная валидация

---

## Главные решения, уже подтверждённые

### 1. Источник истины

Календарная страница должна собираться не из хаотичной авто-логики, а из одного документа:

```ts
calendarPage
```

### 2. Поведение пустых данных

- если document отсутствует -> блоки пустые;
- если конкретный slot равен `null` -> этот slot пустой;
- никакого скрытого fallback на старую auto-логику нет.

### 3. Структура страницы

Нужно поддержать два управляемых блока:

- `mainCards` -> верхние 4 карточки;
- `secondaryCards` -> нижние 4 карточки.

### 4. Режимы должны быть явными

Никаких неявных “если не нашли, покажем что-нибудь ещё”.

Каждый block/slot работает только через явный `mode`.

### 5. Auto-режим для нижних 4 карточек нужен

Для `secondaryCards` нужен auto-режим с понятным и детерминированным правилом:

1. Сначала берём события `текущей недели`.
2. Внутри них приоритет у `single-day`.
3. Если событий недели меньше 4, добиваем `upcoming events` после этой недели.
4. Внутри `upcoming` тоже приоритет у `single-day`.
5. Сортировка `upcoming` идёт по ближайшему `startDate`.
6. Берём максимум 4 карточки.

Итоговый порядок:

- current-week single-day
- current-week duration
- upcoming single-day
- upcoming duration

Это единственный auto-режим, который имеет понятный продуктовый смысл.

---

## Что считаем невалидным в текущей реализации

Текущая auto-логика нижних карточек больше не считается целевой архитектурой.

Причины:

- логика прыгает между weekly pool и general upcoming pool;
- порог `3+ событий` выглядит случайным;
- single-day и duration приоритизируются неявно;
- редактор не может предсказать результат;
- пользователь страницы не понимает, почему показаны именно эти карточки.

Эту логику не переносим в новую модель.

---

## Целевая модель документа

Коллекция Firestore:

```ts
editorialPlacements
```

Документ:

```ts
calendarPage
```

Предлагаемая схема v1:

```ts
{
  schemaVersion: 1,

  mainCards:
    | null
    | {
        mode: "manual",
        ids: string[],
      },

  secondaryCards:
    | null
    | {
        mode: "manual",
        ids: string[],
      }
    | {
        mode: "auto-current-week-single-day-priority",
        limit: 4,
      },

  updatedAt: Timestamp | null,
  updatedBy: string | null,
}
```

### Семантика полей

#### `mainCards`

- `null` -> верхний блок пустой
- `manual` -> показать выбранные редактором события

На текущем этапе для `mainCards` не закладываем auto-режим.

#### `secondaryCards`

- `null` -> нижний блок пустой
- `manual` -> показать выбранные редактором события
- `auto-current-week-single-day-priority` -> собрать 4 карточки по утверждённому правилу

### Ограничения данных

- `ids` должны содержать максимум 4 уникальных event id;
- порядок в `ids` сохраняется как editorial order;
- backend валидирует, что все `ids` существуют в коллекции `events`;
- `limit` пока фиксируется в 4, даже если поле хранится в документе явно.

---

## Редакционная семантика auto-режима для `secondaryCards`

### Определения

#### `current-week event`

Событие пересекается с текущей неделей `понедельник-воскресенье`:

```ts
startDate <= weekEnd && endDate >= weekStart
```

Для single-day события это означает “событие попадает в текущую неделю”.

#### `upcoming event`

Событие начинается после конца текущей недели:

```ts
startDate > weekEnd
```

#### `single-day event`

Событие, у которого:

```ts
startDate === endDate
```

#### `duration event`

Событие, у которого:

```ts
startDate !== endDate
```

### Алгоритм auto-режима

```ts
1. Берём все валидные события.
2. Делим их на current-week и upcoming.
3. Current-week делим на:
   - currentWeekSingleDay
   - currentWeekDuration
4. Upcoming делим на:
   - upcomingSingleDay
   - upcomingDuration
5. Сортируем все 4 группы по startDate ASC.
6. Склеиваем в таком порядке:
   - currentWeekSingleDay
   - currentWeekDuration
   - upcomingSingleDay
   - upcomingDuration
7. Берём первые 4.
```

### Важные правила

- никакого fallback на “события недели” нет;
- если событий текущей недели мало, добиваем только upcoming после этой недели;
- если после этого найдено меньше 4 событий, показываем столько, сколько есть;
- авто-режим не должен подмешивать случайные или завершённые события.

---

## Backend roadmap

## Фаза 1: Добавить серверную схему `calendarPage`

Нужно расширить текущий слой `editorialPlacementsController.ts`, а не создавать отдельную хаотичную систему.

Что нужно сделать:

- добавить типы для `calendarPage`;
- добавить `createDefaultCalendarPagePlacements`;
- добавить нормализаторы для:
  - `mainCards`
  - `secondaryCards`
- добавить валидацию `manual ids`;
- добавить валидацию auto-mode.

Причина:
`landing` и `calendarPage` должны жить в одном архитектурном паттерне.

Статус:

- [x] выполнено

## Фаза 2: Добавить API endpoints

Предлагаемые endpoints:

- `GET /api/editorial-placements/calendar-page`
- `PUT /api/editorial-placements/calendar-page`

Контракт:

- `GET` возвращает нормализованный document;
- `PUT` принимает partial payload по тому же паттерну, что и `landing`;
- `null` должен сохраняться как пустой slot;
- invalid payload должен отклоняться с понятной ошибкой.

Статус:

- [x] выполнено

## Фаза 3: Добавить server-side resolver для auto-mode

Нужно вынести вычисление auto secondary cards в переиспользуемую функцию на сервере или в общий utility.

Предлагаемый utility:

```ts
src/lib/utils/calendarPage.ts
```

Ответственность:

- нормализовать даты;
- определять current/upcoming;
- отделять single-day от duration;
- строить final ordered list для auto secondary cards.

Причина:
публичная страница не должна содержать business rules вразнобой внутри шаблона.

Статус:

- [x] выполнено

---

## Frontend roadmap

## Фаза 4: Добавить API-клиент

В `src/lib/api/api.ts` нужно добавить:

- типы ответа `CalendarPagePlacementsResponse`;
- типы payload `UpdateCalendarPagePlacementsPayload`;
- методы:
  - `getCalendarPage()`
  - `updateCalendarPage()`

Причина:
фронтенд должен общаться с календарным editorial document так же, как уже общается с `landing`.

Статус:

- [x] выполнено

## Фаза 5: Добавить dashboard page

Новая страница:

```ts
src/pages/dashboard/calendar-editor.astro
```

Требования:

- визуально и архитектурно повторять подход `landing-editor`;
- показывать summary текущих slot'ов;
- отдельно управлять:
  - `mainCards`
  - `secondaryCards`
- уметь переключать режимы:
  - `empty`
  - `manual`
  - `auto-current-week-single-day-priority` для `secondaryCards`

Для `manual` режима редактор должен:

- показывать список событий;
- позволять выбрать до 4 событий;
- сохранять порядок карточек.

Статус:

- [x] выполнено

## Фаза 6: Добавить Alpine logic для editor

Новый lazy-loaded модуль:

```ts
src/components/dashboard/calendarEditorLogic.ts
```

Ответственность:

- хранить form-state для обоих блоков;
- валидировать лимит в 4 карточки;
- переключать режимы;
- сохранять payload через API;
- показывать success/error state;
- поддерживать порядок `manual ids`.

Статус:

- [x] выполнено

## Фаза 7: Подключить lazy loader

В `src/lib/alpine/plugins/lazyLoadPlugin.ts` нужно добавить:

```ts
calendarEditor: () => import('@/components/dashboard/calendarEditorLogic')
```

Также нужно добавить skeleton state для editor, чтобы:

- страница не падала до lazy import;
- `x-model`, `x-show` и кнопки не обращались к отсутствующим полям;
- UX был консистентен с существующими dashboard editors.

Статус:

- [x] выполнено

---

## Публичная календарная страница

## Фаза 8: Перевести `src/pages/calendar.astro` на `calendarPage`

Текущий шаблон нужно перестроить из auto-generated страницы в data-driven страницу.

Что нужно изменить:

- загрузить `calendarPage` document;
- загрузить `events`;
- построить event map по id;
- верхний блок рендерить из `mainCards`;
- нижний блок рендерить из `secondaryCards`.

### Правило рендера

#### `mainCards = null`

- верхний блок пустой

#### `mainCards.mode = "manual"`

- показываем выбранные 4 карточки в заданном порядке

#### `secondaryCards = null`

- нижний блок пустой

#### `secondaryCards.mode = "manual"`

- показываем выбранные 4 карточки в заданном порядке

#### `secondaryCards.mode = "auto-current-week-single-day-priority"`

- вычисляем auto list по утверждённому алгоритму
- показываем максимум 4 карточки

### Важное замечание

Текущая логика:

- `isMainEvent`
- weekly pool
- fallback pool
- hero carousel source

не должна больше быть owner'ом этих блоков после миграции на `calendarPage`.

Если часть старого UI сохраняется визуально, его источник данных всё равно должен быть новым.

Статус:

- [x] выполнено

---

## Alpine skeleton и lazy loading

## Фаза 9: Проверить совместимость с текущим `calendar` lazy component

Сейчас публичный календарь и так инициализируется через:

```ts
$lazy('calendar', ...)
```

Нужно сохранить этот паттерн, но очистить initial state от устаревшей editorial-логики.

Что важно:

- не добавлять второй путь инициализации Alpine;
- не делать inline business logic в шаблоне;
- оставить календарный widget, фильтры и список событий внутри текущего lazy flow;
- отдельно решить, какие данные для page cards вычисляются на сервере, а какие на клиенте.

### Рекомендуемое решение

- editorial slots `mainCards` и `secondaryCards` подготовить на сервере в `calendar.astro`;
- в Alpine передавать уже готовые card payloads;
- calendar widget и event list оставить в текущем lazy-модуле `calendar`.

Причина:
editorial slots не зависят от интерактивности календарного виджета и не должны пересчитываться в браузере без причины.

---

## UI/UX требования для editor

- summary block с `updatedAt` и текущим состоянием слотов;
- две независимые панели:
  - `Main Cards Controls`
  - `Secondary Cards Controls`
- явные radio/select controls для режимов;
- понятный empty state;
- понятная ошибка валидации, если выбрано больше 4 карточек;
- возможность переупорядочивать manual cards;
- сохранение каждого блока отдельно, как в `landing-editor`.

---

## Empty states на публичной странице

Нужно заранее зафиксировать поведение, чтобы потом не спорить в коде.

### Если `mainCards` пустой

Верхний блок должен:

- либо не рендериться вообще;
- либо рендериться с лаконичным empty placeholder.

Предпочтительно:

- не рендерить блок вообще, если продукту не нужен видимый placeholder.

### Если `secondaryCards` пустой

Нижний блок должен:

- либо не рендериться вообще;
- либо рендериться с лаконичным empty placeholder.

Предпочтительно:

- не рендерить блок вообще, если продукту не нужен видимый placeholder.

### Если auto-mode дал меньше 4 карточек

- показываем только найденные карточки;
- не добиваем скрытым fallback'ом;
- пустые fake-card не рисуем.

---

## Предлагаемый порядок реализации

1. Создать и утвердить этот roadmap.
2. Добавить backend schema и endpoints для `calendarPage`.
3. Добавить API client в `src/lib/api/api.ts`.
4. Сделать `src/pages/dashboard/calendar-editor.astro`.
5. Сделать `src/components/dashboard/calendarEditorLogic.ts`.
6. Подключить `calendarEditor` в lazy loader skeleton.
7. Перевести `src/pages/calendar.astro` на чтение `calendarPage`.
8. Удалить старую auto-логику page cards из `calendar.astro`.
9. Проверить ручные и auto-режимы на реальных данных.

Статус текущего прохода:

- [x] пункты 1-9 выполнены в коде

---

## Риски

- текущая верстка календаря может быть привязана к старому hero/carousel shape;
- `mainCards` как верхний блок нужно аккуратно согласовать с текущим UI страницы;
- нужен аккуратный mapping event document -> card payload;
- если editor позволит менять порядок, нужно явно продумать UI reorder без новых зависимостей.

---

## Рабочие допущения для первого прохода

Эти пункты пока считаем зафиксированными, если не придёт новое продуктовое решение:

- `mainCards` поддерживает только `manual` и `empty`;
- `secondaryCards` поддерживает `manual`, `empty`, `auto-current-week-single-day-priority`;
- оба блока ограничены 4 карточками;
- `no data = empty`;
- hidden fallback запрещён;
- при нехватке событий текущей недели auto-mode добивает `upcoming` после этой недели;
- upcoming сортируется по ближайшему `startDate`.
