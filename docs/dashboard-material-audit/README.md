# Аудит dashboard material creators/editors/previewers

Дата аудита: 2026-06-16.

Scope: только material creators/editors/previewers в dashboard. Этот аудит не
меняет код и фиксирует текущее состояние реализации.

Не входит в scope: `landing`, `paris`, `culture`, `calendar` editors. Это
только граница scope, не отдельный deliverable.

## Материалы

| Материал | Файл аудита | Главный статус |
|---|---|---|
| Article | [article.md](./article.md) | Частично унифицирован |
| Le saviez-vous | [le-saviez-vous.md](./le-saviez-vous.md) | Использует Article flow |
| News | [news.md](./news.md) | Частично унифицирован |
| Tips | [tips.md](./tips.md) | Не унифицирован |
| Guide | [guide.md](./guide.md) | Частично унифицирован, есть wiring/redirect проблемы |
| Event | [event.md](./event.md) | Частично унифицирован, грязное именование state |
| Interview | [interview.md](./interview.md) | Delete workflow не завершен |
| Visual Story | [visual-story.md](./visual-story.md) | Частично унифицирован |
| Flipper | [flipper.md](./flipper.md) | Частично унифицирован |
| Photo of the Day | [photo-of-the-day.md](./photo-of-the-day.md) | Не унифицирован |

## Ожидаемый единый action footer

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

## Главные проблемы

- `Tips` использует другой footer layout и вложенный `<a><Button>...</Button></a>`.
- `Photo of the Day` использует другой footer layout без mobile-first поведения.
- `Interview` имеет props под delete, но delete action в editor footer не реализован.
- `Button.astro` дублирует `cursor-pointer` в base и variants.
- Preview author rendering сломан системно: большинство preview pages показывают
  статический `articleData.author`, `Photo of the Day` показывает literal
  `"Автор"`, а не выбранного автора из preview draft.
- Preview author persistence inconsistent: часть creators теряет выбранного
  автора после перехода `creator -> preview -> return to edit`, потому что
  author UI state не сохраняется или перетирается из пустого `authorId`.
- Tips has a data-loss risk in block editing: open `editingBlock` can be lost
  on preview/add-item flows, and item image upload needs stronger button
  disabling plus clearer loading state.
- Similar block-editing risks exist outside Tips: `Article` and `Guide`
  preview does not auto-commit open blocks; most block editors can switch to a
  new block while an old `editingBlock` is unsaved.
- Upload-in-progress guards are inconsistent: some save flows block upload,
  some preview flows do not, and block/slide/item buttons do not consistently
  disable while uploads are running.
- Preview draft cleanup есть у `Article` и `Guide`, но отсутствует у большинства остальных.
- Cancel/delete кнопки реализованы разными способами.
- Redirect behavior не одинаковый между материалами.

## Что теперь описывает каждый material-файл

- State model: основные Alpine state поля.
- Init logic: как применяется initial data или preview draft.
- UI interaction logic: title/caption, author, tags/category, flags.
- Material-specific logic: blocks, tips items, event date/time, slides, carousel, photo upload.
- Data-loss risks: open block editing, upload-in-progress guards, disabled
  states, and clear save/preview availability.
- Upload behavior.
- Related content / content collections / placement, если они есть у материала.
- Publication behavior: `published` и отсутствие/наличие явной работы с `publishedAt`.
- Preview behavior: localStorage key, write/read, return-to-edit.
- Save/update/delete: validation, payload, API call, redirect, cleanup.
