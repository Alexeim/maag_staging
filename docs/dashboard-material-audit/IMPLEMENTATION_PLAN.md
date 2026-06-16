# Dashboard material fixes implementation plan

Дата полной пересборки: 2026-06-17.

Это единственный файл, который задает порядок внедрения.

Перед кодом читать:

1. `README.md`
2. material file для текущего материала
3. текущий step в этом файле

`IMPLEMENTATION_ROADMAP.md` не является порядком внедрения.

## Strategy

- One workflow at a time.
- Start with correctness/data integrity.
- Do not mix author fixes, block/data-loss fixes, footer refactor, delete cleanup and redirect cleanup in one PR.
- No opportunistic fixes.
- No new production dependencies.
- If a step needs extra files outside Allowed files, stop and document why.

## Workflow order

1. Author preview + return-to-edit persistence.
2. Block/media data-loss prevention.
3. Preview draft cleanup.
4. Action footer component/layout unification.
5. Delete/cancel/redirect cleanup.
6. Save/update payload audit.
7. Final DOM/manual verification pass.

## Step 1: Interview author fix

Reason:

- Confirmed high-risk restore pattern.
- User observed author disappearing after preview return.
- Small enough to prove the pattern before applying it elsewhere.

Allowed files:

- `src/components/dashboard/interviewCreatorLogic.ts`
- `src/pages/dashboard/interview/preview.astro`

Not allowed:

- `src/components/dashboard/InterviewComposer.astro`
- footer code
- delete code
- redirect code
- other materials
- common preview draft migration

Rules:

- Keep `interviewPreview`.
- Preview state wins over `interview.authorId`.
- Existing selected author must render in preview.
- New unsaved author name must render in preview.
- Return from preview must keep selected/new author UI state.

Manual checks:

- Create interview, select existing author, preview shows selected author.
- Return to edit, selected author is still selected.
- Create interview, enter new author first/last name, preview shows that name.
- Return to edit, new author form state is still present.
- Edit existing interview, preview still shows saved author.

Stop condition:

- Stop after Interview author workflow is fixed and manually checked.

## Step 2: Tips author fix

Allowed files:

- `src/components/dashboard/tipsArticleCreatorLogic.ts`
- `src/pages/dashboard/tips/preview.astro`

Not allowed:

- `src/components/dashboard/TipsArticleComposer.astro`
- tips item/block data-loss fixes
- footer code
- other materials

Rules:

- Keep `tipsPreview`.
- Preview state wins over `article.authorId`.
- Do not touch tips item saving yet.

## Step 3: Article and Le Saviez-vous author fix

Allowed files:

- `src/components/article/creatorLogic.ts`
- `src/pages/dashboard/article/preview.astro`
- route files only if they pass material-specific props needed by existing flow

Not allowed:

- `src/components/dashboard/ArticleComposer.astro`
- block editor refactor
- footer code
- other materials

Rules:

- Article and Le Saviez-vous share `creatorLogic.ts` and `articlePreview`.
- Fix them as one workflow.

## Step 4: Guide author fix

Allowed files:

- `src/components/article/guideCreatorLogic.ts`
- `src/pages/dashboard/guide/preview.astro`

Not allowed:

- `src/components/dashboard/GuideComposer.astro`
- block editor refactor
- footer code

## Step 5: News author fix

Allowed files:

- `src/components/dashboard/newsCreatorLogic.ts`
- `src/pages/dashboard/news/preview.astro`

Not allowed:

- `src/components/dashboard/NewsComposer.astro`
- block editor refactor
- footer code

## Step 6: Flipper author fix

Allowed files:

- `src/components/dashboard/flipperCreatorLogic.ts`
- `src/pages/dashboard/flippers/preview.astro`

Not allowed:

- carousel item identity refactor
- footer code
- delete/redirect cleanup

## Step 7: Photo Of The Day author rendering fix

Allowed files:

- `src/components/dashboard/photoOfTheDayCreatorLogic.ts`
- `src/pages/dashboard/photo-of-the-day/preview.astro`

Rules:

- Replace hardcoded `Автор` preview author with actual selected/saved author.
- Do not do footer or upload guard in this step.

## Step 8: Visual Story author decision

Allowed files:

- `src/components/article/visualStoryCreatorLogic.ts`
- `src/pages/dashboard/visual-story/preview.astro`

Rules:

- First decide whether dashboard visual-story preview should display author.
- If yes, add author rendering using the same contract.
- If no, document the product decision in `visual-story.md`.

## Step 9: Event author verification

Allowed files:

- `src/components/article/eventCreatorLogic.ts`
- `src/pages/dashboard/event/preview.astro`

Rules:

- Event currently looks lower risk because restore uses fallback through `||`.
- Do runtime check before changing code.

## Step 10: Tips data-loss prevention

Allowed files:

- `src/components/dashboard/tipsArticleCreatorLogic.ts`
- `src/components/dashboard/TipsArticleComposer.astro`

Rules:

- Preview and save must share the same commit-current-item path.
- Save/preview must be disabled while image upload is in progress.
- UI must clearly show image upload/loading state.
- Do not change footer layout in this step unless it is required for disabled state.

Manual checks:

- Edit existing tips item, do not click "save item", click preview: preview includes latest text/media.
- Slow image upload: save/preview unavailable until upload completes.
- Add item while previous item is dirty: user cannot silently lose previous item changes.

## Step 11: Article/Guide block preview-save parity

Allowed files:

- `src/components/article/creatorLogic.ts`
- `src/components/article/guideCreatorLogic.ts`

Rules:

- Preview and save must share the same commit-current-block behavior.
- Do not change composer layout.

## Step 12: Preview draft cleanup

Allowed logic files:

- `newsCreatorLogic.ts`
- `tipsArticleCreatorLogic.ts`
- `eventCreatorLogic.ts`
- `interviewCreatorLogic.ts`
- `visualStoryCreatorLogic.ts`
- `flipperCreatorLogic.ts`
- `photoOfTheDayCreatorLogic.ts`

Rules:

- Remove only the matching material preview key after successful save/update.
- Do not change preview draft shape in the same step.

## Step 13: Action footer unification

Allowed files:

- Composer files for all 10 materials.
- A new shared component only if it stays within existing project patterns.

Rules:

- Use one footer layout contract.
- No nested `<a><Button></Button></a>`.
- Keep material-specific actions, labels and redirects.
- Do not change save/delete behavior.

Target layout:

```html
<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div class="flex gap-2">
    <!-- delete -->
  </div>
  <div class="flex justify-end gap-3">
    <!-- publication, cancel, preview, save -->
  </div>
</div>
```

## Step 14: Delete/cancel/redirect cleanup

Rules:

- Only after footer is visually unified.
- Verify every material's cancel destination and delete redirect.
- Do not change payload shapes.

## Step 15: Final verification

Manual checks for every material:

- create
- edit
- preview
- return from preview
- save/update
- delete when supported
- cancel
- draft/published toggle
- author selection/new author where supported
- image upload timing where supported
- block/item/slides data preservation
