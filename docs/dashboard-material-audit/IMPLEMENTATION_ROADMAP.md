# Roadmap исправления dashboard material creators/editors/previewers

Дата: 2026-06-16.

Scope: только material creators/editors/previewers из `docs/dashboard-material-audit`.
Цель: привести общие workflows к одному контракту, не ломая различия контента,
блоков и специфики отдельных материалов.

## 0. Зафиксировать contract перед кодом

Что сделать:

- Описать единый contract action footer: delete, published, cancel, preview, save.
- Описать единый contract preview draft: key, payload, return-to-edit, cleanup.
- Описать единый contract author preview rendering.
- Описать единый redirect contract после create/update/delete.

Почему:

- Материалы могут иметь разные blocks/content, но footer, preview lifecycle,
  author rendering, save/update/delete и redirect должны вести себя одинаково.

### Action footer contract

Предлагаемый общий component:
`src/components/dashboard/DashboardMaterialActionFooter.astro`.

Минимальный API:

| Prop / slot | Тип / пример | Назначение |
|---|---|---|
| `showDelete` | `boolean` | Показывает левую delete action в edit mode. |
| `deleteAction` | Alpine expression, e.g. `deleteArticle(deleteRedirect)` | Обработчик удаления. |
| `deleteLabel` | `"Удалить"` | Текст delete button. |
| `showPublished` | `boolean` | Показывает publication toggle. |
| `publishedModel` | `"article"`, `"photo"`, `"story"` | Alpine model object для `PublicationToggle`. |
| `cancelHref` | `"/dashboard"` | Куда ведет cancel без сохранения. |
| `previewAction` | Alpine expression, e.g. `previewArticle()` | Обработчик preview. |
| `previewDisabled` | Alpine expression, e.g. `uploading || isSaving` | Disabled state preview. |
| `saveAction` | Alpine expression, e.g. `saveArticle()` | Обработчик save/update. |
| `saveLabel` | `"Сохранить"` / `"Создать"` | Текст save button. |
| `saveDisabled` | Alpine expression, e.g. `isSaving || uploading` | Disabled state save/update. |
| `isSavingExpression` | Alpine expression, e.g. `isSaving` | Loading state для save button. |

Единый layout:

```html
<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div class="flex gap-2">
    <!-- delete action -->
  </div>
  <div class="flex justify-end gap-3">
    <!-- published, cancel, preview, save -->
  </div>
</div>
```

Правила:

- Delete всегда слева.
- Published, cancel, preview, save всегда справа и в этом порядке.
- Cancel не должен быть вложенным interactive markup вида `<a><button>`.
- Footer component не должен знать material-specific payload shape.
- Material-specific labels допустимы, но порядок и responsive layout должны
  оставаться одинаковыми.

### Preview draft common shape

Это target contract. Сейчас в коде preview drafts используют разные field names:
`article`, `photo`, `event`, `interview`, `story`, `flipper`. После
унификации общий shape должен быть одинаковым по смыслу, даже если конкретная
entity остается разной по payload.

| Field | Обязательность | Назначение |
|---|---|---|
| `draftVersion` | required | Версия draft shape для будущих миграций. |
| `materialType` | required | Тип материала: `article`, `tips`, `photo-of-the-day`, etc. |
| `entity` | required | Полный текущий material payload для preview/save. |
| `entityId` | optional | Id в edit mode. Отсутствует в create mode. |
| `isEditMode` | required | Отличает create preview от edit preview. |
| `returnTo` | required | Конкретный route для `returnToEdit()`. |
| `authorState` | required when material has author | UI state выбора/создания автора. |
| `authorDisplay` | required when material shows author | Resolved имя/avatar для preview rendering. |
| `createdAt` | optional | Debug timestamp для stale draft диагностики. |

Правила:

- Preview state wins, persisted entity fields are fallback.
- Mismatched `materialType` или явно несовместимый `draftVersion` должен
  приводить к безопасному cleanup только соответствующего localStorage key.
- После успешного create/update соответствующий preview key удаляется.
- Preview одного материала не должен читать draft другого материала.

### Author display payload

| Field | Назначение |
|---|---|
| `selectedAuthorId` | Id выбранного existing author. |
| `useNewAuthor` | Флаг режима создания нового автора. |
| `newAuthorFirstName` | Введенное имя нового автора до save. |
| `newAuthorLastName` | Введенная фамилия нового автора до save. |
| `displayName` | Resolved имя для preview: existing author или new author form. |
| `avatarUrl` | Avatar existing author, если доступен. |

Правила:

- Existing author preview показывает выбранного автора из draft/current state.
- New author preview показывает введенные имя/фамилию до сохранения автора.
- Если avatar недоступен, preview должен использовать тот же fallback, что и
  production author component.
- `Visual Story` должен быть либо приведен к этому contract, либо явно
  documented как no-author-preview exception.

### Redirect defaults

| Action | Default behavior |
|---|---|
| Create save | Redirect to material dashboard list unless page passes explicit `onSaveRedirect`. |
| Update save | Redirect to explicit `onSaveRedirect` or material dashboard list. |
| Delete | Redirect to explicit `deleteRedirect` or material dashboard list. |
| Cancel | Follow explicit `cancelHref`; never save data. |
| Preview return | Return to exact create/edit route stored in preview draft. |

Rule: defaults may differ by material route, but they must be declared in the
composer/page boundary instead of hidden across several fallbacks.

### Preview draft keys

| Material | localStorage key | Create route | Edit route pattern | Cleanup behavior |
|---|---|---|---|---|
| Article | `articlePreview` | `/dashboard/article/create` | `/dashboard/article/[id]/edit` | Delete after successful create/update; delete mismatched Article draft only. |
| Le saviez-vous | `articlePreview` | `/dashboard/le-saviez-vous/create` | `/dashboard/le-saviez-vous/[id]/edit` | Same generic Article preview flow; no separate Le saviez-vous preview page; must preserve `articleType`/type marker and route metadata. |
| News | `newsPreview` | `/dashboard/news/create` | `/dashboard/news/[id]/edit` | Delete after successful create/update; delete mismatched News draft only. |
| Tips | `tipsPreview` | `/dashboard/tips/create` | `/dashboard/tips/[id]/edit` | Delete after successful create/update; delete mismatched Tips draft only. |
| Guide | `guidePreview` | `/dashboard/guide/create` | `/dashboard/guide/[id]/edit` | Delete after successful create/update; delete mismatched Guide draft only. |
| Event | `eventPreview` | `/dashboard/event/create` | `/dashboard/event/[id]/edit` | Delete after successful create/update; delete mismatched Event draft only. |
| Interview | `interviewPreview` | `/dashboard/interview/create` | `/dashboard/interview/[id]/edit` | Delete after successful create/update; delete mismatched Interview draft only. |
| Visual Story | `visualStoryPreview` | `/dashboard/visual-story/create` | `/dashboard/visual-story/[id]/edit` | Delete after successful create/update; delete mismatched Visual Story draft only. |
| Flipper | `flipperPreview` | `/dashboard/flippers/create` | `/dashboard/flippers/edit/[id]` | Delete after successful create/update; delete mismatched Flipper draft only. |
| Photo of the Day | `photoOfTheDayPreview` | `/dashboard/photo-of-the-day/create` | `/dashboard/photo-of-the-day/[id]/edit` | Delete after successful create/update; delete mismatched Photo draft only. |

## 1. Исправить preview author rendering

Приоритет: высокий.

Definition of done:

- Changed files: relevant preview pages, relevant creator logic files, and any
  shared author preview helper/component introduced for this workflow.
- Manual flows: existing author preview, new author preview, preview save, and
  preview return for every material with author selection.

Текущее состояние:

- `Article`, `Le saviez-vous`, `News`, `Tips`, `Guide`, `Event`, `Interview`,
  `Flipper` показывают автора из статического `articleData.author`.
- `Photo of the Day` показывает hardcoded `ArticleAuthor name="Автор"`.
- `Visual Story` хранит author state в preview draft, но не показывает автора в
  preview page.

Что сделать:

- В preview state хранить достаточный author display payload:
  `selectedAuthorId`, `useNewAuthor`, `newAuthorFirstName`,
  `newAuthorLastName`, и resolved display name/avatar, если он доступен.
- В preview pages рендерить автора из draft/current state, а не из
  `articleData.author`.
- Для нового автора в draft показывать введенные имя/фамилию до сохранения.
- Для `Visual Story` явно решить: автор должен отображаться в preview или нет.
  Если да, рендерить тем же способом; если нет, зафиксировать как осознанное
  исключение.

Проверка:

- Выбрать existing author -> открыть preview -> отображается выбранный автор.
- Включить new author -> ввести имя/фамилию -> открыть preview -> отображается
  введенный автор.
- Вернуться из preview в editor -> author state сохранен.

## 1.1. Исправить author persistence при return-to-edit

Приоритет: высокий.

Definition of done:

- Changed files: creator logic for every material that writes/reads preview
  draft author state.
- Manual flows: select existing author in create mode -> preview -> return;
  enter new author in create mode -> preview -> return; repeat in edit mode
  where new author flow exists.

Текущее состояние:

- `Article` и `Guide` не сохраняют `selectedAuthorId`, `useNewAuthor`,
  `newAuthorFirstName`, `newAuthorLastName` в preview draft.
- `News`, `Tips`, `Interview`, `Flipper` сохраняют author UI state, но потом
  `init()` перетирает `selectedAuthorId` из `article.authorId`,
  `interview.authorId` или `flipper.authorId`.
- `Event`, `Visual Story`, `Photo of the Day` выглядят устойчивее: restored
  author state не перетирается безусловно.

Что сделать:

- Preview draft всех материалов должен сохранять author UI state одинаково.
- После restore нельзя безусловно перетирать `selectedAuthorId` из payload
  entity field.
- Правило должно быть единым: preview state wins, entity `authorId` is fallback.
- New author form state должен также переживать `preview -> return to edit`.

Проверка:

- Existing author выбран, материал еще не сохранен -> preview -> return -> author
  select показывает того же автора.
- New author имя/фамилия введены, материал еще не сохранен -> preview -> return
  -> форма нового автора не очищена.

## 2. Вынести общий action footer

Приоритет: высокий.

Definition of done:

- Changed files: add `src/components/dashboard/DashboardMaterialActionFooter.astro`;
  update all material composers that currently render footer actions inline.
- Manual flows: create/edit footer layout on desktop and mobile; delete in edit
  mode; cancel; preview; save disabled/loading states.

Текущее состояние:

- Majority layout есть у `Article`, `News`, `Guide`, `Event`, `Interview`,
  `Visual Story`, `Flipper`.
- `Tips` и `Photo of the Day` имеют другой layout.
- Cancel/delete/save/preview реализованы вручную и по-разному.
- `Interview` имеет место под delete, но delete button не реализован в footer.

Что сделать:

- Создать `DashboardMaterialActionFooter.astro` для creators/editors.
- Поддержать слоты/props для:
  - delete visibility/action/label;
  - published toggle visibility/model;
  - cancel href;
  - preview action;
  - save action/label/loading state;
  - material-specific labels.
- Подключить общий component во всех material composers.
- Убрать ручные inline footer blocks из отдельных composers.

Проверка:

- Desktop и mobile layout одинаковые у всех материалов.
- Нет `<a><button>...</button></a>`.
- Нет дублированного `cursor-pointer cursor-pointer`.
- Delete стоит слева, published/cancel/preview/save справа.

## 3. Защитить block/media editing от потери данных

Приоритет: высокий.

Definition of done:

- Changed files: block/item editing logic in Article, Guide, Tips, News, Event,
  Interview, Visual Story, Flipper and Photo of the Day upload guards where
  applicable.
- Manual flows: unsaved block/item preview, add-block/add-item while editing,
  upload-in-progress preview/save blocking, reorder/delete with stable keys.

Текущее состояние:

- `Tips` edits item content in separate `editingBlock`; real
  `article.contentBlocks` is updated only after `updateBlock()`.
- `Article`, `Guide` and `Tips` can open preview without auto-committing an
  active `editingBlock`.
- `News`, `Event` and `Interview` auto-commit before preview/save, but
  `addBlock(type)` can still switch editing to a new block while the previous
  `editingBlock` has unsaved changes.
- `addTipsItem()` opens a new empty item without protecting unsaved changes in
  the current item.
- Block/item image upload often writes into `editingBlock`, but `updateBlock()`
  can be clicked while upload is still in progress.
- `Visual Story` and `Photo of the Day` can open preview while upload is still
  in progress.
- `Photo of the Day` save does not guard `uploading` before validation.
- `TipsArticleComposer` uses `:key="index"` for item rendering.
- `Flipper` and `Visual Story` also use index keys for repeated media items.

Что сделать:

- Add shared `commitOpenBlockBeforeAction()` behavior for save, preview,
  add-block/add-item and navigation-like actions.
- Before preview, auto-commit an open block/item or block preview with a clear
  message if the block is invalid.
- Before add-block/add-item, either auto-commit current block or require explicit
  save/cancel confirmation.
- Disable block/item save, add-block/add-item, preview and final save while
  relevant upload is running.
- Add logic-level guards inside action methods too. UI disabled states are not
  enough; e.g. `savePhoto()` and `previewPhoto()` must return early when
  `uploading` is true.
- Show clear upload state next to the exact block/item/slide being uploaded,
  not only a generic progress bar.
- Add stable ids to tips items/slides/carousel items and use stable keys instead
  of `index`.

Проверка:

- Edit item text -> click preview without `Сохранить пункт` -> preview contains
  latest text.
- Edit Article/Guide block -> click preview without `Сохранить блок` -> preview
  contains latest block content.
- Edit item text -> click `Добавить пункт` -> previous item is either preserved
  or user gets explicit confirmation.
- Edit News/Event/Interview block -> click add another block -> previous block is
  either preserved or user gets explicit confirmation.
- Start item image upload -> save/update/add/preview buttons are disabled or
  show clear blocked state until upload finishes.
- Start Visual Story/Photo upload -> preview/save cannot proceed until upload
  finishes.
- Trigger `savePhoto()` / `previewPhoto()` while `uploading === true` -> method
  exits early with a clear message and does not validate stale empty `imageUrl`.
- Reorder/delete items while editing -> editor does not attach state to the
  wrong item.

## 4. Унифицировать preview draft lifecycle

Приоритет: высокий.

Definition of done:

- Changed files: preview write/read/cleanup logic for every material; preview
  pages if return route is currently inferred incorrectly.
- Manual flows: create preview -> save cleanup; edit preview -> save cleanup;
  mismatched draft cleanup; cross-material preview isolation.

Текущее состояние:

- `Article` и `Guide` уже делают cleanup после save/update.
- Большинство остальных preview drafts cleanup не делают.
- Preview keys разные, что нормально, но поведение вокруг них разное.

Что сделать:

- Для каждого материала зафиксировать preview key и payload shape.
- После успешного create/update удалять соответствующий preview key.
- При mismatched draft удалять только безопасно распознанный stale draft.
- Return-to-edit должен вести в правильный create/edit route.

Проверка:

- Create draft -> preview -> save -> localStorage key удален.
- Edit draft -> preview -> save -> localStorage key удален.
- Preview одного материала не подхватывается другим материалом.

## 5. Унифицировать save/update payload

Приоритет: средний.

Definition of done:

- Changed files: creator logic payload builders/save methods, only where create
  and update currently diverge or omit shared fields.
- Manual flows: create and update for each material; published/draft state;
  category/tags/hot content; collections/placements/related content where present.

Что сделать:

- Для каждого материала проверить обязательные поля перед API call.
- Проверить, что create/update используют один и тот же нормализованный payload
  там, где это возможно.
- Проверить `published`, `publishedAt`, `hotContent`, tags/category,
  collections/placements и related content.
- Не пытаться унифицировать material-specific blocks: они остаются разными.

Проверка:

- Create и update не теряют поля.
- Draft/published состояние не меняется неожиданно.
- `hotContent` и collections сохраняются там, где они есть в editor.

## 6. Довести delete/cancel/redirect contract

Приоритет: средний.

Definition of done:

- Changed files: material create/edit pages, composers, and delete methods where
  redirect defaults or delete visibility are inconsistent.
- Manual flows: cancel from create/edit, delete from edit, save redirect from
  create/update, preview return-to-edit.

Что сделать:

- У каждого edit mode должен быть понятный delete path или явно documented
  no-delete exception.
- Cancel должен вести в согласованный dashboard route.
- Delete redirect должен быть одинаково управляемым через props/config.
- Preview header return-to-edit должен возвращать в правильный editor.

Проверка:

- Delete из edit mode работает или явно отсутствует по решению.
- Cancel не сохраняет данные.
- Preview return не теряет draft.
- После save/update/delete пользователь попадает в ожидаемый раздел dashboard.

## 7. Проверить визуально и через DOM

Приоритет: обязательный перед завершением.

Definition of done:

- Changed files: none expected unless visual/DOM verification reveals bugs.
- Manual flows: inspect rendered DOM for all footers; test preview pages with
  selected author, tags, published state and material-specific content.

Что сделать:

- Проверить реальные action blocks в DOM, а не только Astro source.
- Сравнить order кнопок, classes, nesting, disabled state, mobile layout.
- Проверить preview pages после выбора автора, tags, published и blocks.

Проверка:

- У всех материалов одинаковая footer структура.
- Preview показывает данные текущего draft.
- Нет статического автора там, где editor позволяет выбрать автора.

## Рекомендуемый порядок внедрения

1. Preview author rendering.
2. Author persistence on return-to-edit.
3. Block/media data-loss prevention.
4. Общий action footer.
5. Preview draft cleanup.
6. Delete/cancel/redirect.
7. Save/update payload audit.
8. Финальная DOM/visual проверка всех материалов.

## Что не надо унифицировать

- Наборы block types.
- Поля, уникальные для материала: event date/time/place, visual story slides,
  flipper slides, photo image/caption, tips items.
- Разные API endpoints, если backend действительно хранит разные сущности.
