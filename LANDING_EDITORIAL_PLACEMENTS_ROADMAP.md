# Roadmap: editorial document для landing

## Зачем переписываем roadmap

Предыдущая версия roadmap ушла в смешанную модель:

- часть слотов переводилась на central document;
- часть продолжала жить на старых fallback'ах;
- `null` трактовался неоднообразно;
- `mainHero`, `event`, `interview block` начали вести себя по разным правилам.

Это сделало систему непредсказуемой.

Новая цель:

- зафиксировать **нормальную editorial architecture**;
- сделать **один явный источник истины на каждый slot**;
- сделать поведение **декларативным**;
- зафиксировать правило:

`null = slot empty`

Это главное решение новой модели.

---

## Статус реализации

### Уже внедрено

- [x] roadmap переписан под declarative editorial model
- [x] backend `editorialPlacementsController.ts` переведён на schema v2
- [x] backend читает старый v1 document и нормализует его в новую форму
- [x] `api.ts` переведён на:
  - `mainHero`
  - `newsRail`
  - `eventCard`
  - `cultureInterviewBlock`
- [x] `MainLandingBlock.astro` переведён на новую slot-модель
- [x] `MainLandingBlock.astro` больше не использует скрытые fallback'и для hero/event/news
- [x] `eventCard = null` больше не рисует fake placeholder-card
- [x] `LandingBody.astro` переведён на `cultureInterviewBlock`
- [x] `culture.astro` отвязан от landing editorial document
- [x] dashboard placement manager переведён на новую schema v2
- [x] frontend build проходит
- [x] backend build проходит

### Ещё не завершено

- [ ] dashboard UX пока не даёт полноценно управлять `auto-*` режимами
- [ ] `LandingPlacementPanel.astro` всё ещё в старой терминологии и требует доводки под new slots
- [ ] `server/scripts/removeLegacyIsOnLanding.js` ещё не переведён на новую schema v2
- [ ] legacy `isOnLanding` ещё не удалён из payloads/controllers/forms
- [ ] не сделана финальная data migration existing document'ов в Firestore

---

## Best Practice, который берём за основу

1. Content хранится отдельно.
2. Placement хранится отдельно.
3. Один slot = один owner = один source of truth.
4. `null` имеет один смысл.
5. Manual и auto режимы задаются явно.
6. Никаких скрытых fallback'ов, разбросанных по компонентам.

---

## Новая целевая модель

### Главный принцип

Landing собирается не из хаотичных флагов внутри документов контента, а из **editorial document**, который описывает:

- какой slot пуст;
- какой slot ручной;
- какой slot автоматический;
- по какому правилу автоматический.

### Базовая семантика

- `null` = slot empty
- `{ mode: "manual", ... }` = редактор выбрал вручную
- `{ mode: "auto-*", ... }` = slot заполняется по правилу

---

## Целевой документ в Firestore

Коллекция:

```ts
editorialPlacements
```

Документ:

```ts
landing
```

Схема v2:

```ts
{
  schemaVersion: 2,

  mainHero:
    | null
    | {
        mode: "manual",
        ref: {
          type: "article" | "guide" | "interview" | "flipper" | "visual-story",
          id: string,
        },
      },

  newsRail:
    | null
    | {
        mode: "auto-latest",
        limit: number,
      }
    | {
        mode: "manual",
        ids: string[],
      },

  eventCard:
    | null
    | {
        mode: "auto-nearest",
      }
    | {
        mode: "manual",
        id: string,
      },

  cultureInterviewBlock:
    | null
    | {
        mode: "auto-latest",
      }
    | {
        mode: "manual",
        id: string,
      },

  updatedAt: Timestamp,
  updatedBy: string | null,
}
```

---

## Что значит каждый slot

### `mainHero`

Управляет только блоком `Главное`.

Правила:

- `null` -> hero пустой
- `manual` -> показать выбранный материал

Для `mainHero` в v2 **не вводим auto-режим**, пока нет чёткой редакционной потребности.

### `newsRail`

Управляет блоком новостей.

Правила:

- `null` -> news rail пустой
- `auto-latest` -> взять последние `N` новостей
- `manual` -> взять новости по `ids`

### `eventCard`

Управляет event-card в main landing block.

Правила:

- `null` -> event-card пустая
- `auto-nearest` -> взять ближайшее событие
- `manual` -> показать конкретное событие

### `cultureInterviewBlock`

Управляет **существующим interview block в culture section на landing**, не на `culture` page.

Правила:

- `null` -> interview block пустой
- `auto-latest` -> взять последний interview
- `manual` -> показать конкретный interview

---

## Редакционная модель landing

| Slot | Что показывает | Кто может туда попадать | Режимы |
|---|---|---|---|
| `mainHero` | Большой блок `Главное` | `article`, `tips`, `guide`, `interview`, `flipper`, `visual-story` | `null`, `manual` |
| `newsRail` | Блок новостей | `news` | `null`, `auto-latest`, `manual` |
| `eventCard` | Event card | `event` | `null`, `auto-nearest`, `manual` |
| `cultureInterviewBlock` | Interview block в culture section landing | `interview` | `null`, `auto-latest`, `manual` |

Важная оговорка:

- `tips` технически живёт внутри `articles`, но редакционно считается допустимым кандидатом для `mainHero`.

---

## Почему это лучше текущего состояния

1. Нет скрытых fallback'ов внутри компонентов.
2. У каждого slot есть явная схема.
3. `null` больше не спорит сам с собой.
4. Auto-логика описана как правило, а не как случайная ветка в Astro-файле.
5. Dashboard потом можно строить поверх этой модели без переизобретения логики.

---

## Что именно убираем из текущей модели

### Убираем

- `featuredInterviewInCultureId`
- `featuredEventId`
- старую форму `mainHero: { type, id }`
- implicit fallback-логику, завязанную на `null`
- попытки трактовать `null` как “покажи что-нибудь”

### Заменяем на

- `mainHero: null | { mode: "manual", ref }`
- `newsRail: null | auto | manual`
- `eventCard: null | auto | manual`
- `cultureInterviewBlock: null | auto | manual`

---

## Что делаем с legacy `isOnLanding`

`isOnLanding` больше не должен быть source of truth ни для одного landing-slot.

Поле остаётся только как временное legacy-наследие на время миграции.

После перехода:

- `article.isOnLanding` удаляем
- `guide.isOnLanding` удаляем
- `visual-story.isOnLanding` удаляем
- `event.isOnLanding` удаляем
- все runtime-проверки по `isOnLanding` удаляем

---

## Новые правила рендера

### 1. `MainLandingBlock.astro`

Должен читать:

- `mainHero`
- `newsRail`
- `eventCard`

Правила:

- hero рендерится только по `mainHero`
- news rail рендерится по `newsRail`
- event card рендерится по `eventCard`
- если slot = `null`, slot пустой
- никаких внутренних “если null, подставить что-то случайное”

### 2. `LandingBody.astro`

Должен читать:

- `cultureInterviewBlock`
- `mainHero`

Правила:

- special interview block в culture section landing рендерится только по `cultureInterviewBlock`
- если `cultureInterviewBlock = null`, блока нет
- если interview уже стоит в special block, его нужно исключать из обычной выдачи этой секции
- если material уже стоит в `mainHero`, его нужно исключать из повторного показа там, где это редакционно нужно

### 3. `culture.astro`

На этом этапе **не должен зависеть от landing editorial document**, если для этого нет отдельной продуктовой задачи.

Очень важно:

- `culture section` на landing
- и `culture page`

это разные сущности и не должны смешиваться.

---

## API-модель

### Response

```ts
interface LandingEditorialDocument {
  schemaVersion: 2;
  mainHero:
    | null
    | {
        mode: "manual";
        ref: {
          type: "article" | "guide" | "interview" | "flipper" | "visual-story";
          id: string;
        };
      };
  newsRail:
    | null
    | { mode: "auto-latest"; limit: number }
    | { mode: "manual"; ids: string[] };
  eventCard:
    | null
    | { mode: "auto-nearest" }
    | { mode: "manual"; id: string };
  cultureInterviewBlock:
    | null
    | { mode: "auto-latest" }
    | { mode: "manual"; id: string };
  updatedAt: string | Date | null;
  updatedBy: string | null;
}
```

### Update payload

```ts
interface UpdateLandingEditorialPayload {
  mainHero?: LandingEditorialDocument["mainHero"];
  newsRail?: LandingEditorialDocument["newsRail"];
  eventCard?: LandingEditorialDocument["eventCard"];
  cultureInterviewBlock?: LandingEditorialDocument["cultureInterviewBlock"];
}
```

---

## Правила валидации на backend

1. `schemaVersion` выставляется сервером.
2. `mainHero.mode` может быть только `manual`.
3. `mainHero.ref.type` проверяется по whitelist.
4. `mainHero.ref.id` должен существовать в правильной коллекции.
5. `newsRail.manual.ids` должны ссылаться только на `news`.
6. `newsRail.auto-latest.limit` должен быть положительным числом и иметь разумный максимум.
7. `eventCard.manual.id` должен ссылаться на существующий `event`.
8. `cultureInterviewBlock.manual.id` должен ссылаться на существующий `interview`.
9. `null` всегда валиден и всегда значит `slot empty`.

---

## Dashboard UX

### Для `mainHero`

Вместо checkbox:

- `Сделать главным материалом`
- `Убрать из главного материала`

### Для news

- `Авто: последние 4`
- `Ручной режим`
- `Очистить блок`

### Для event

- `Авто: ближайшее событие`
- `Поставить это событие`
- `Очистить блок`

### Для interview block

- `Авто: последний interview`
- `Поставить этот interview`
- `Очистить блок`

---

## Миграционная стратегия

### Этап 1. Переписать backend schema

Нужно:

- обновить `editorialPlacementsController.ts`
- обновить `editorialPlacementsRoutes.ts`
- обновить типы в `api.ts`

### Этап 2. Перевести runtime на декларативные slots

Нужно:

- переписать `MainLandingBlock.astro`
- переписать `LandingBody.astro`
- убрать скрытые fallback'и

### Этап 3. Перевести dashboard на slot-actions

Нужно:

- обновить UI actions
- убрать старые assumptions про `featuredEventId`
- убрать старые assumptions про `featuredInterviewInCultureId`

### Этап 4. Прогнать data migration

Нужно:

- сохранить document в новой схеме
- проверить staging
- только потом чистить legacy поля

### Этап 5. Удалить legacy `isOnLanding`

Нужно:

- обновить payload types
- обновить controllers
- обновить creator state
- обновить Alpine skeleton
- обновить cleanup script

---

## Что уже сделано и можно сохранить

Это не нужно выбрасывать:

- сама идея `editorialPlacements/landing`
- backend route/controller как точка входа
- `api.ts` как место для typed editorial API
- dashboard-panel как основа для slot-based UI

То есть мы не делаем полный reset.
Мы **меняем модель**, а не уничтожаем всё.

---

## Что нужно переделать обязательно

- schema документа
- backend validation
- `MainLandingBlock.astro`
- `LandingBody.astro`
- dashboard actions
- roadmap-логика миграции

---

## Самое важное решение

Фиксируем окончательно:

```ts
null = slot empty
```

И второе:

```ts
auto-логика живёт в document как mode/rule,
а не во внутренних fallback'ах компонентов
```

---

## Критерии готовности

Новая модель считается внедрённой, когда:

1. каждый landing-slot имеет явную схему;
2. `null` везде означает только `empty`;
3. auto-режимы описаны в document;
4. runtime больше не гадает, что показывать;
5. `isOnLanding` больше нигде не участвует в landing logic.

---

## Итоговая рекомендация

Идём не в “ещё один patch на старую логику”, а в **настоящий editorial document**:

- `mainHero`
- `newsRail`
- `eventCard`
- `cultureInterviewBlock`

с режимами:

- `null`
- `manual`
- `auto-*`

Это и есть правильная, чистая, профессиональная модель для такой страницы.
