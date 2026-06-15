# Дорожная карта рефакторинга предпросмотров в дашборде

## Зачем нужен этот документ

Сейчас creators/editors материалов в дашборде используют разные сценарии предпросмотра:

- `article` имеет dashboard-страницу предпросмотра, но она дублирует публичную разметку статьи и уже расходится с реальными публичными стилями.
- `guide` имеет похожую dashboard-страницу предпросмотра с тем же риском расхождения.
- список `flipper` использует ссылку на публичную страницу как `Просмотр`.
- список `tips` открывает публичную страницу вместо draft-предпросмотра.
- у `news` и `interview` в creators/editors нет полноценного предпросмотра.
- колонки действий в списках визуально и структурно отличаются на разных dashboard-страницах.

Цель: сделать поведение предпросмотра предсказуемым для всех типов материалов и не добавлять второй путь инициализации Alpine.

## Цели

- Один общий dashboard-паттерн предпросмотра для всех creators/editors материалов.
- Предпросмотр должен выглядеть максимально близко к реальной публичной странице.
- Предпросмотр должен использовать draft-данные из редактора до сохранения.
- Каждый редактор материала должен иметь одинаковый action-flow:
  - вернуться к редактированию;
  - сохранить из предпросмотра, если это применимо;
  - сохранить draft-state через `localStorage`.
- Все dashboard-списки должны использовать одинаковую ячейку действий:

```astro
<td class="px-6 py-4 text-right">
  <div class="flex justify-end gap-4">
    <a
      href="/public-route/id"
      class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
      target="_blank"
    >
      Просмотр
    </a>
    <a
      href="/dashboard/type/edit/id"
      class="font-medium text-primary hover:underline"
    >
      Редактировать
    </a>
    <button
      type="button"
      class="font-medium text-error hover:underline"
      @click="handleDeleteClick('id', 'title')"
    >
      Удалить
    </button>
  </div>
</td>
```

## Не цели

- Не добавлять production-зависимости без явного подтверждения.
- Не заменять lazy loading Alpine.
- Не вызывать `Alpine.start()` вручную.
- Не решать несвязанные проблемы редизайна публичных страниц в рамках этого рефакторинга.
- Не переписывать все composers одним огромным изменением.

## Текущие важные файлы

### Существующие страницы предпросмотра

- `src/pages/dashboard/article/preview.astro`
- `src/pages/dashboard/guide/preview.astro`

Эти страницы сейчас дублируют публичную render-логику. Поэтому стили цитат, rich text, media rails и сложные блоки могут расходиться с реальными публичными страницами.

### Публичные render-компоненты, которые нужно переиспользовать

- `src/pages/article/[id].astro`
- `src/pages/news/[id].astro`
- `src/pages/interviews/[id].astro`
- `src/pages/tips/[id].astro`
- `src/pages/flippers/[id].astro`
- `src/components/article/ArticleBody.astro`
- `src/components/article/TipsArticleBody.astro`
- `src/components/news/NewsContent.astro`
- `src/components/interview/InterviewHero.astro`

Главный принцип: preview-страницы должны собираться из тех же renderer-компонентов, что и публичные страницы, когда Astro может отрендерить данные на сервере.

### Существующая creator-логика

- `src/components/article/creatorLogic.ts`
- `src/components/article/guideCreatorLogic.ts`
- `src/components/dashboard/newsCreatorLogic.ts`
- `src/components/dashboard/interviewCreatorLogic.ts`
- `src/components/dashboard/tipsArticleCreatorLogic.ts`
- `src/components/dashboard/flipperCreatorLogic.ts`
- `src/components/article/eventCreatorLogic.ts`
- `src/components/article/visualStoryCreatorLogic.ts`
- `src/components/dashboard/photoOfTheDayCreatorLogic.ts`

### Существующие страницы списков

- `src/components/dashboard/ArticleCategoryList.astro`
- `src/pages/dashboard/news/index.astro`
- `src/pages/dashboard/interviews.astro`
- `src/pages/dashboard/tips/index.astro`
- `src/pages/dashboard/flippers.astro`
- `src/pages/dashboard/guides.astro`
- `src/pages/dashboard/le-saviez-vous/index.astro`
- `src/pages/dashboard/visual-stories.astro`
- `src/pages/dashboard/photo-of-the-day/index.astro`
- `src/pages/dashboard/events/index.astro`

### Alpine lazy loader

- `src/lib/alpine/plugins/lazyLoadPlugin.ts`
- `src/alpine-entrypoint.ts`
- `ALPINE_GUIDELINES.md`

Вся новая preview/editor-логика должна оставаться внутри существующего `$lazy(...)` registration flow.

## Целевая архитектура

## 1. Общий preview-контракт

Создать небольшой utility, который определяет ключи хранения preview, routes и базовую форму draft envelope.

Предлагаемый файл:

```text
src/lib/utils/dashboardPreview.ts
```

Предлагаемые типы:

```ts
export type DashboardPreviewType =
  | "article"
  | "guide"
  | "news"
  | "interview"
  | "tips"
  | "flipper"
  | "event"
  | "visualStory"
  | "photoOfTheDay"
  | "leSaviezVous";

export type DashboardPreviewDraft<T> = {
  type: DashboardPreviewType;
  draft: T;
  id: string | null;
  isEditMode: boolean;
  editRoute: string;
  createRoute: string;
  savedPublicRoute?: string | null;
};
```

Это не даст каждому creator придумывать собственный формат preview-payload.

## 2. Общий dashboard preview shell

Создать переиспользуемую dashboard-обёртку для preview-страниц.

Предлагаемый файл:

```text
src/components/dashboard/DashboardPreviewShell.astro
```

Ответственность:

- dashboard card frame;
- заголовок вроде `Предпросмотр статьи`;
- верхние actions:
  - `Вернуться к редактированию`;
  - `Сохранить`;
- опциональная ссылка на публичную страницу для уже сохранённых материалов;
- единые max width и spacing;
- отсутствие material-specific render-логики.

Компонент должен принимать slots:

- `actions`;
- default preview content.

## 3. Общие client preview helpers

Добавить маленькие helper-методы для creator states вместо копипаста preview-сериализации в каждом модуле.

Ответственность предлагаемого utility:

- `writeDashboardPreviewDraft(type, payload)`;
- `readDashboardPreviewDraft(type)`;
- `clearDashboardPreviewDraft(type)`;
- `getDashboardPreviewRoute(type)`.

Helper должен оставаться framework-neutral. Alpine creator modules могут его вызывать, но сам helper не должен регистрировать Alpine data.

## 4. Preview-страницы должны переиспользовать публичные renderers

Текущий `article` preview должен перестать вручную рендерить каждый блок. Он должен использовать тот же body renderer, что и публичная статья.

Целевое направление:

- при необходимости адаптировать публичные renderers так, чтобы они принимали plain props;
- держать нормализацию данных в utilities, а не внутри preview-only страниц;
- использовать один public-renderer path и для сохранённого контента, и для draft-preview.

Например:

- article preview использует `ArticleHeader`, `ArticleAuthor`, `SocialShare` и `ArticleBody`;
- guide preview использует ту же render-структуру, что публичные guide-страницы;
- news preview использует `NewsHeader` / `NewsContent`;
- interview preview использует публичные interview-компоненты;
- tips preview использует `TipsArticleBody`;
- flipper preview использует публичный visual-компонент flipper, а не redirect на публичную страницу.

Если публичная страница сейчас слишком плотно смешивает fetching и rendering, сначала нужно вынести render-компонент.

## 5. Стратегия маршрутов

Для draft preview использовать dashboard preview routes, а не публичные routes:

```text
/dashboard/article/preview
/dashboard/guide/preview
/dashboard/news/preview
/dashboard/interview/preview
/dashboard/tips/preview
/dashboard/flippers/preview
/dashboard/events/preview
/dashboard/visual-story/preview
/dashboard/photo-of-the-day/preview
/dashboard/le-saviez-vous/preview
```

Ссылки на публичные routes остаются полезными в списках для уже сохранённого контента. Они не должны заменять draft-предпросмотр внутри creators/editors.

## Фазы реализации

## Фаза 1: аудит и нормализация actions в списках

Обновить все dashboard-списки так, чтобы они использовали одинаковую ячейку действий:

- `Просмотр`;
- `Редактировать`;
- `Удалить`.

Правила:

- `Просмотр` ведёт на публичную страницу и открывается в новой вкладке.
- `Редактировать` ведёт на dashboard edit route.
- `Удалить` вызывает существующий `handleDeleteClick(id, title)`.
- Существующая `$lazy('...List')` list-логика остаётся.

Особые случаи:

- в списках категорий article сейчас нет `Просмотр`; добавить;
- в news сейчас нет `Просмотр`; добавить;
- в interviews сейчас нет `Просмотр`; добавить;
- в guides сейчас нет `Просмотр`; добавить;
- visual stories/photo/events должны использовать такой же визуальный action layout, если у них есть публичные routes.

Definition of Done:

- все action cells используют `td.px-6.py-4.text-right`;
- все action wrappers используют `flex justify-end gap-4`;
- ни один dashboard list не имеет одноразовый action layout без явного объяснения.

## Фаза 2: создать общие preview utilities и shell

Добавить:

- `src/lib/utils/dashboardPreview.ts`;
- `src/components/dashboard/DashboardPreviewShell.astro`.

Обновить lazy skeleton в:

- `src/lib/alpine/plugins/lazyLoadPlugin.ts`.

Skeleton должен содержать все методы, которые используются в preview templates:

- `previewArticle`;
- `previewMaterial` или эквивалентный общий метод;
- `returnToEdit`;
- имена save-методов, которые используются каждым creator.

Definition of Done:

- существующие article и guide preview pages всё ещё загружаются через `$lazy(...)`;
- нет нового global Alpine entrypoint code;
- нет ручного `Alpine.start()`.

## Фаза 3: исправить расхождение preview article и guide

Отрефакторить:

- `src/pages/dashboard/article/preview.astro`;
- `src/pages/dashboard/guide/preview.astro`.

Главное изменение:

- убрать дублированный rendering content blocks;
- рендерить через публичные renderer-компоненты.

Важные расхождения, которые нужно исправить:

- стиль цитат;
- rich text rendering;
- first paragraph/drop cap behavior;
- two/three column blocks;
- ширины media rails;
- flipper blocks внутри article/guide bodies;
- video/embed rendering.

Definition of Done:

- quote в article preview визуально совпадает с quote в публичной статье;
- body в guide preview визуально совпадает с публичным guide body;
- draft content всё ещё приходит из `localStorage`;
- return-to-edit и save продолжают работать.

## Фаза 4: добавить недостающие draft preview flows

Добавить preview support в creators/editors, где его нет:

- news;
- interview;
- tips;
- flipper;
- le saviez-vous;
- events;
- visual stories;
- photo of the day.

Рекомендуемый порядок:

1. news и interview, потому что у них сейчас нет preview.
2. tips и flipper, потому что сейчас они используют публичные routes как замену preview.
3. остальные типы материалов.

Для каждого типа материала:

- добавить `preview...()` method в creator logic;
- записывать нормализованный draft в shared preview storage;
- добавить dashboard preview route;
- рендерить через публичный renderer component;
- добавить `returnToEdit()`;
- сохранять `isEditMode` и id;
- добавить preview button рядом с save/cancel actions.

Definition of Done:

- у каждого creator/editor есть кнопка `Предпросмотр` в одном и том же месте;
- каждый preview route использует общий shell;
- preview route работает до первого сохранения;
- preview route работает при редактировании существующего материала.

## Фаза 5: вынести публичные render-компоненты там, где нужно

Некоторые публичные страницы могут ещё не иметь чистых render-only components. Их нужно вынести аккуратно.

Правила:

- data fetching остаётся в pages;
- rendering остаётся в components;
- нормализованный content передаётся через props;
- публичное URL-поведение не меняется;
- CSS-классы остаются совместимыми с текущими публичными страницами.

Вероятные targets для extraction:

- visual section публичной flipper-страницы;
- public content wrapper для news;
- public body wrapper для interview;
- public layout для photo-of-the-day, если нужен preview;
- public viewer для visual story, если нужен preview.

Definition of Done:

- публичные страницы и dashboard preview pages используют общие render-компоненты;
- публичные страницы всё ещё работают с saved data, загруженными из API;
- dashboard preview работает с локальными draft data.

## Фаза 6: проверка

Ручные проверки:

- create article preview before saving;
- edit article preview before saving;
- create guide preview before saving;
- create news preview before saving;
- create interview preview before saving;
- create tips preview before saving;
- create flipper preview before saving;
- return from preview to editor keeps draft content;
- save from preview saves the same draft;
- list `Просмотр` opens public saved material in a new tab.

Автоматические проверки, где это применимо:

- `npm run check`;
- `npm run build`.

Если в проекте есть существующие lint/test scripts, запустить и их.

## Риски и guardrails

### Astro server rendering vs draft data

Astro pages рендерятся на сервере, а draft data живёт в browser `localStorage`.

Это значит, что preview pages, которым нужны draft data, должны либо:

- рендерить client-side Alpine preview renderer;
- либо передавать draft data в client-rendered island/component.

Если публичные renderers являются Astro-only и требуют server props, они не смогут напрямую получить browser `localStorage` data во время initial server render.

Практический подход:

1. Для article/guide сначала уменьшить duplicated preview markup через extraction renderer-like subcomponents там, где это возможно.
2. Для полностью динамического draft preview использовать Alpine для hydration draft state и рендерить через shared client preview component/template.
3. Держать публичный renderer источником правды по стилям. Если стиль нужно повторить client-side, централизовать classes/constants.

### Alpine lazy loader

Не обходить:

```astro
x-data="$lazy('creatorName', state)"
```

Каждый новый preview route должен использовать существующий lazy loader pattern, а `lazyLoadPlugin.ts` должен иметь skeleton methods для всего, что template вызывает до завершения загрузки модуля.

### Совместимость payload в localStorage

Существующие ключи:

- `articlePreview`;
- `guidePreview`.

При введении shared helper нужно сохранить backward compatibility для этих ключей на время миграции или безопасно их очистить.

### Save from preview

Не у всех материалов сейчас одинаковое имя save-метода:

- `saveArticle`;
- `saveInterview`;
- `saveFlipper`;
- `savePhoto`;
- etc.

Shared shell не должен угадывать имена save-методов. Нужно либо передавать explicit action slots, либо стандартизировать creator methods отдельным проходом позже.

## Рекомендуемый первый pull request

Держать первый PR маленьким:

1. Добавить этот roadmap.
2. Нормализовать dashboard list action cells.
3. Добавить shared preview utility types без изменения поведения.
4. Добавить `DashboardPreviewShell.astro`.
5. Отрефакторить только shell article preview, не меняя rendering behavior.

Это даст стабильную базу перед более сложной работой по extraction renderers.

## Финальный Definition of Done

- У каждого material creator/editor есть dashboard draft preview.
- Каждый preview доступен до сохранения материала.
- Каждый preview имеет одинаковый dashboard shell и action semantics.
- Public saved `Просмотр` links остаются доступны в dashboard lists.
- Public pages и preview pages не поддерживают независимую styling logic для одного и того же material body.
- Alpine остаётся lazy-loaded через `$lazy`.
- `npm run check` и `npm run build` проходят.
