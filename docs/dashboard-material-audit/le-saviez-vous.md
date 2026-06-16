# Le saviez-vous

## Область проверки

Le saviez-vous. Это не отдельный composer/logic, а Article flow с другим
`articleType` и route configuration.

## Файлы

- Create page: `src/pages/dashboard/le-saviez-vous/create.astro`
- Edit page: `src/pages/dashboard/le-saviez-vous/[id]/edit.astro`
- Preview page: общий `src/pages/dashboard/article/preview.astro`
- Composer: `src/components/dashboard/ArticleComposer.astro`
- Logic: `src/components/article/creatorLogic.ts`
- API/controller: `articlesApi`, `server/src/controllers/articleController.ts`

## Creator

- Create page sets `articleType: "le_saviez_vous"`.
- Также задает:
  - `onSaveRedirect: "/dashboard/le-saviez-vous"`
  - `createSuccessRedirect: "/dashboard/le-saviez-vous"`
  - `editRouteBase: "/dashboard/le-saviez-vous"`
  - `createRoute: "/dashboard/le-saviez-vous/create"`

## Editor

- Edit page загружает article через `articlesApi.getById(id)`.
- Использует `ArticleComposer`.
- Передает `deleteArticleId={id}` и `deleteRedirect="/dashboard/le-saviez-vous"`.

## Previewer

- Использует generic Article preview flow.
- Preview storage key: `articlePreview`.
- Отдельного `le-saviez-vous` preview page нет.
- Preview author rendering наследует проблему общего Article preview:
  отображается статический `articleData.author`, а не выбранный/новый автор из
  draft.
- Author persistence наследует проблему общего Article flow: author UI state не
  пишется в `articlePreview`, поэтому выбранный автор может пропасть после
  `preview -> return to edit`.

## Action footer

- Same footer as Article: `src/components/dashboard/ArticleComposer.astro:1788`.

## Карта логики

- Вся interaction logic inherited from Article:
  - title/caption edit-save-cancel;
  - author selection/new author creation;
  - category/tags/Paris district;
  - tips array controls;
  - content blocks;
  - uploads;
  - related content;
  - content collections;
  - landing placement controls;
  - publication toggle;
  - preview draft via `articlePreview`;
  - save/update/delete через `articlesApi`.
- Отличие: state config sets `articleType: "le_saviez_vous"` and custom dashboard routes.
- Отдельной Le saviez-vous logic map в коде нет, потому что отдельного logic-файла нет.

## Save / Update

- Same `saveArticle()` as Article.
- Payload включает `articleType` из state/config.
- Create/update идут через `articlesApi`.

## Delete

- Same `deleteArticle()` as Article.
- Redirect на `/dashboard/le-saviez-vous`, если edit page передал этот redirect.

## Preview draft / localStorage

- Key: `articlePreview`.
- Cleanup после успешного save: есть, inherited from Article flow.

## Redirects

- Routes кастомизируются через `createSuccessRedirect`, `editRouteBase`, `createRoute`.

## Проблемы

- Это не отдельный previewer, хотя материал отдельный в dashboard.
- Все проблемы Article footer автоматически относятся и сюда.

## Вердикт

Le saviez-vous является Article variant. Это нормально только если явно считать его shared Article flow.
