# Dashboard material creators/editors/previewers audit

Дата полной пересборки: 2026-06-17.

Статус: source-verified, runtime-not-verified.

Этот folder описывает только dashboard material creators/editors/previewers.
Это документация текущего поведения и безопасного порядка исправлений.

## Как читать

1. Сначала этот файл.
2. Потом material file для нужного материала.
3. Потом `IMPLEMENTATION_PLAN.md`, если нужно писать код.
4. `IMPLEMENTATION_ROADMAP.md` использовать только как target-contract reference, не как порядок работ.

## Scope

В scope входят:

- Article
- Le Saviez-vous
- News
- Tips
- Guide
- Event
- Interview
- Visual Story
- Flipper
- Photo Of The Day

Вне scope:

- landing
- paris
- culture
- calendar

Эти editors не смешивать с material creators/editors/previewers.

## Current material docs

Каждый файл ниже является актуальным verified-паспортом материала:

| Material | Doc |
|---|---|
| Article | [article.md](./article.md) |
| Le Saviez-vous | [le-saviez-vous.md](./le-saviez-vous.md) |
| News | [news.md](./news.md) |
| Tips | [tips.md](./tips.md) |
| Guide | [guide.md](./guide.md) |
| Event | [event.md](./event.md) |
| Interview | [interview.md](./interview.md) |
| Visual Story | [visual-story.md](./visual-story.md) |
| Flipper | [flipper.md](./flipper.md) |
| Photo Of The Day | [photo-of-the-day.md](./photo-of-the-day.md) |

## Что есть в каждом material file

- Source files: create/edit/preview/composer/logic.
- Current workflow.
- Author preview rendering.
- Author return-to-edit persistence.
- Preview draft lifecycle.
- Block/media risks.
- Save/update/delete/cancel behavior.
- Footer/action layout status.
- Known inconsistencies.
- First safe fix.

## Главные verified проблемы

1. Author preview/persistence is inconsistent.
   - `photo-of-the-day` hardcodes author as `Автор`.
   - `visual-story` dashboard preview author render is not confirmed.
   - `article`, `guide`, `news`, `tips`, `interview`, `flipper` have high-risk author restore patterns.

2. Preview draft cleanup is inconsistent.
   - Cleanup found for `article` and `guide`.
   - Cleanup not found for `news`, `tips`, `event`, `interview`, `visual-story`, `flipper`, `photo-of-the-day`.

3. Block/media data-loss protection is inconsistent.
   - `article`, `guide`, `tips` save commits open edit state, but preview does not clearly share the same path.
   - `tips` has the highest user-facing data-loss risk around uncommitted items and image upload timing.
   - `visual-story` and `photo-of-the-day` need preview/save upload guard verification.

4. Action footer is not unified.
   - Majority uses `mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
   - `tips` and `photo-of-the-day` are clear layout outliers.
   - Cancel/delete implementations differ between raw links, nested link/button, and Button component.

## Implementation rule

Do not fix everything at once.

Use `IMPLEMENTATION_PLAN.md`:

- one workflow at a time;
- one material first when risk is high;
- no opportunistic footer/delete/redirect fixes while fixing author or data-loss;
- every PR must have allowed files and manual checks.
