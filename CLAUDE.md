# maag_staging — project facts

Only things that are non-obvious or that I have already got wrong here.

## This is a TypeScript project

- **All application code is TypeScript**: `src/` (`.ts`, and `.astro`
  frontmatter/scripts) and `server/src/`. New files are `.ts`, new parameters
  get types, and no new implicit `any`. Untyped code that exists here is debt,
  not the house style — don't copy it.
- **JavaScript only for one-off tech scripts** — migrations, seeds, backfills
  in `server/scripts/` (all `.js`, run by hand). `seedAddresses.json` next to
  them is data, not code: `seedAddresses.js` used it to seed the addresses
  into the database. The only other `.mjs` files
  are tooling: `astro.config.mjs`, `server.mjs`, `tests/sitemap.test.mjs`.
- Open `astro check` errors are listed in `docs/astro-check-remaining.md`.
- Shared editor types: `EditorBlock` (`src/lib/utils/contentBlocks.ts`),
  `EditorAuthor` / `LoadedAuthorFields` (`src/lib/utils/editorAuthors.ts`).
  Fields a material has only once loaded from the API (`author`, `authorId`)
  are read through `LoadedAuthorFields`, not added to the editor state.
- Traps hit on 2026-09-28:
  - `this` inside a **parameter default** of an object-literal method is
    `any` even with the parameter annotated. Move the default into the body:
    `blocks?: EditorBlock[]` + `blocks ?? this.article.contentBlocks`.
  - `.filter(Boolean)` does not narrow out `null`; `.filter((x) => x !== null)`
    does (TS 5.5+, the project is on 5.9).
  - An empty `[]` in initial state is `never[]` — write `[] as string[]`.
  - Link-block helpers (`getFilteredContentList`, `getRelatedContentItemLabel`)
    also get `photoOfTheDay` and raw stored strings: keep the parameter
    `string`, narrow only the lookup key (`as MaterialLinkContentType`).
    The "related materials" section itself uses `RelatedContentType`.

## Backend

- The API backend is **in this repo**, at `server/` (Express + firebase-admin +
  Firestore). It is not a separate repository. `src/pages/api/` holds only
  `session.ts`, which makes it look otherwise.
- A frontend type existing in `src/lib/api/api.ts` does **not** mean the backend
  stores or returns that field — controllers whitelist fields explicitly.
  Check `server/src/controllers/*Controller.ts` before assuming a change is done.
- Verify backend with `cd server && npx tsc --noEmit`. Not `astro check`, which
  scans `server/*.ts` with the wrong tsconfig and invents errors.
- `npm run check` runs all three: `check:ts` (plain `tsc` on `src/`, skips
  `.astro`), `check:server` (the backend `tsc` above), `check:astro`. Don't
  run `check:astro` while `npm run dev` is up: on 2026-09-28 it rewrote
  `node_modules/.vite/deps` under the dev server and the browser got
  `504 Outdated Optimize Dep` until the dev server was restarted.
- **Tests are Vitest** (since 2026-09-28), not Jest and not `node:test`.
  `npm test` at the root runs both: `tests/*.test.ts` (root
  `vitest.config.ts`) and `server/tests/*.test.ts` (`server/vitest.config.mts`,
  `.mts` because `server/` is a CommonJS package). Vitest does not type-check:
  root tests are covered by `check:ts`; server tests by
  `server/tsconfig.test.json`, which `check:server` runs. `server/tsconfig.json`
  has `include: ["src"]` on purpose — without it `tsc` pulls in the tests and
  the build fails on `rootDir`.
- `tests/sitemap.test.ts` reads `dist/client/sitemap-*.xml`: it fails until
  `npm run build` has run.
- `server/tsconfig.json` has `"types": ["node"]` because otherwise `tsc`
  picks up the frontend's `@types/*` from the root `node_modules` (DOM,
  Alpine) — which the Cloud Run build, with `server/` as its context, never
  sees. `"lib": ["es2022"]` relies on the Node 24 image in `server/Dockerfile`.
- **Placement updates are rule tables**, not per-field `if` blocks
  (`editorialPlacementsController.ts`): `applyPlacementPayload` + one
  `*PlacementRules()` per document. A new slot = one rule entry plus a test in
  `server/tests/editorialPlacements.test.ts`. The tables are functions, not
  module constants: several normalizers are `const`s declared lower in the
  file, and a module-level table would throw at load (TDZ).
- The culture section hero (`cultureHero`) also accepts an **interview**;
  the Paris hero and both card blocks do not (`LandingCultureHeroType`).

## Two read models — this is the important one

- `server/src/routes/publicRoutes.ts` → `publicMaterialsController.ts`,
  `publicLandingController.ts`, `publicRelatedController.ts`. Published only.
  **Safe for readers.**
- `server/src/routes/{article,news,guide,interview,flipper,visualStory,event,
  firstPerson}Routes.ts` → `router.get('/')` and `router.get('/:id')`.
  No auth, no `published` filter. **Editorial endpoints, drafts included.**
  Anyone with the API host can read drafts through them (the host is in the
  client bundle as `PUBLIC_API_BASE_URL`). **Accepted on 2026-09-18** — the
  owner decided not to close them. Don't re-raise it as a finding.

Before touching any public card list, check which read model it uses.

**Cards on material pages** — the "Похожие материалы" carousel, the news-page
sidebar, in-body `LinkToContent` and the event page's upcoming events
(its `autofill`, since 2026-09-28) — come from one call,
`GET /api/public/related/:type/:id` (`publicRelatedController.ts`). It returns
card fields only, published only. The per-page autofill rules (same rubric,
latest flippers, …) live there, not on the pages. Until 2026-09-18 the pages
downloaded every material of every type (~2.1 MB, drafts included) and picked
cards themselves; that code was removed.

Material pages still load **the material itself** with the editorial
`getById` on purpose: they 404 a draft themselves, and admin draft preview —
`canPreviewUnpublished()` in `src/lib/utils/preview.ts`, `role === "admin"` —
depends on getting the draft. Don't move that call to a published-only route.

**Dates shown to readers and to Google are `publishedAt`, never `createdAt`**
(page headers, cards, landing, carousel, `datePublished`, sitemap `lastmod`).
Unpublishing clears `publishedAt`; republishing sets a new one. A draft has
none, so `ArticleDate` renders "Черновик" — only an admin ever sees that.
Component props are still *named* `createdAt=`; the value passed is the
publication date.

## Alpine

- Entrypoint is `src/alpine-entrypoint.ts` (registered in `astro.config.mjs`).
  Never call `Alpine.start()` — `@astrojs/alpinejs` owns the lifecycle.
- Component logic lives in `*Logic.ts` files, loaded through a central registry
  in `src/lib/alpine/plugins/lazyLoadPlugin.ts`. There are no dynamic
  `import()` calls inside `.astro` files.
- `src/lib/alpine/plugins/lazyLoadPlugin.ts` holds a ~600-line skeleton object
  with every component's state, and the entrypoint loads it on every page —
  readers download dashboard editor state. Known perf debt, not yet fixed.
  Don't grow it.
- **In `.astro` templates write Alpine directives in the long form:**
  `x-bind:class`, `x-on:click` — never `:class` or `@click`. All templates were
  converted on 2026-09-28. Reason: `astro check` turns templates into TSX, and
  an attribute name starting with `:`/`@` is not valid JSX, so the compiler
  emits it as a plain JS string (`{...{":class":"..."}}`); a multiline value
  then becomes "Unterminated string literal" and derails the parser for the
  rest of the file. That produced 108 false errors in 8 files. Same behaviour
  in Alpine, modifiers included. https://github.com/alpinejs/alpine/discussions/3835
- `ClientRouter` is opt-in per page (`useClientRouter` in
  `src/layouts/Layout.astro`, default `false`). Don't assume view transitions
  are active.
- **Do not add getters or setters to any `*Logic.ts`.** The lazy loader merges
  the loaded module with a bare `Object.assign`, which copies values but not
  property descriptors — a computed property would silently hold no value after
  load, with no error. There are currently zero getters in these files, so the
  trap is dormant. Mentormatic hit exactly this (`formattedValue` on
  `rangeSelector`) and fixed it by copying descriptors explicitly; see
  `wurkspaces-monorepo/apps/mentormatic/src/lib/alpine/plugins/lazyLoaderV2/factory.ts`.
- **View state belongs in a local `x-data`, not in a `*Logic.ts`.** Anything a
  `*Logic.ts` exposes must be mirrored in that skeleton, so a search box or a
  filter added there costs every reader of the public site. Nest a plain
  `x-data` inside the `$lazy` component instead: Alpine's scope chain lets it
  read and write the parent's state, and nothing reaches the skeleton.
  `CustomSelect.astro` and `MaterialPickerList.astro` both do this.

## Dashboard page editors (landing / culture / paris / calendar)

- Their option pools are built in the `.astro` frontmatter from the **editorial**
  list endpoints, which include drafts. Every pool is guarded by a local
  `isPublishedItem`; absent `published` counts as a draft. Keep new pools guarded.
- Picking a draft was never a leak: `toLandingItem()`
  (`publicLandingController.ts:157`) drops unpublished documents, so every
  manual placement is filtered on the way out. What a stale pick causes is a
  **silently collapsed slot**, not a draft on the page. Don't re-report it as one.
- **Order: the last item ticked goes first on the public page.** Every
  `toggle*Item` prepends (`[key, ...keys]`), `save()` maps the array as-is, and
  `fetchByTargets` preserves it. The "Выбрано" list in `MaterialPickerList`
  numbers from the top of the page down.
- The three pick lists are one component, `MaterialPickerList.astro` (badges,
  date, search, type chips, ordered "Выбрано" block with ↑↓). It takes the
  parent's method and array *names* as strings, like `CustomSelect` takes `model`.

## Dashboard editors: preview and unsaved changes (2026-09-28)

- **"Предпросмотр" opens a new tab; the editor never unloads.** All ten
  material editors go through `src/lib/utils/dashboardPreview.ts`
  (`openDashboardPreview` / `readDashboardPreview` / `clearDashboardPreview`).
  The editor writes a snapshot to localStorage, the preview tab reads it, and
  the preview page only has "Закрыть превью" (`window.close()`) — no save
  button, it holds a copy that can be older than the editor.
- **Never go back to "navigate to the preview and restore on return".** That
  was the old design and it lost edits for months: four editors (event,
  visual story, photo, first-person) never restored anything, the rest had
  ten hand-copied restore paths patched one symptom at a time. An editor must
  never apply a stored snapshot to itself; opening an editor clears any
  leftover one.
- Event and first-person build on `articleCreatorLogic`; they pass it
  `isPreview: false` and `watchUnsavedChanges: false` and handle both
  themselves. Otherwise the article base loads the article's snapshot or
  guards only the article's fields.
- **Unsaved changes:** `src/lib/utils/unsavedChangesGuard.ts`, created at the
  end of each editor's `init()` (not on preview pages). Links on the page open
  `ConfirmationModal` ("Остаться" / "Уйти без сохранения"); closing the tab or
  reloading can only show the browser's own dialog. Call `markSaved()` after a
  successful save or delete, or the redirect that follows triggers it.
- The guard relies on `rich-text-change` carrying `detail.initial: true` on
  Quill's mount-time emit (`blockRichTextEditor.ts`): Quill loads lazily, so
  that emit can land after the baseline, and the guard moves the baseline past
  it if nothing had changed. Drop the flag and a false "unsaved changes"
  returns with no error. Keep the `text-change` subscription wrapped
  (`() => emitChange(false)`) — Quill passes `(delta, …)`, which would read
  as a truthy `initial`.
- `showConfirmation(message, onConfirm, { confirmLabel, cancelLabel })` — the
  labels are optional and default to "Подтвердить" / "Отмена".

## Documents in this repo

Nothing reads these automatically. Status is unverified unless noted.

**Live:**
- `docs/audit-2026-09-18.md` — **read this first.** Whole-project audit of
  2026-09-18: what was fixed that day (commits), owner decisions (editorial
  GET routes stay open, publication date only, delete nothing unasked), and
  the open items with file:line — profile overwrite/read, Stripe trusting
  body ids, and more (fixed 2026-09-28: the broken `articlesApi.del`, and
  Quill in every reader's bundle — `blockRichTextEditor.ts` now imports it
  in `init()`; never import `quill` statically from anything the Alpine
  entrypoint reaches).
  Check an item there before re-reporting it as a new finding.
- `docs/security-auth-dependency-roadmap.md` — security/auth/hosting, last
  reviewed 2026-09-01. Line 513 assumes editorial GET routes return no
  drafts; they do (see the audit).
- `docs/astro-check-remaining.md` — what `astro check` still reports after the
  editor typing work of 2026-09-28, grouped, with the known fix per group.
- `CALENDAR_PAYWALL_ROADMAP.md`
- `DASHBOARD_PREVIEW_REFACTOR_ROADMAP.md` — **superseded** by the section
  "Dashboard editors: preview and unsaved changes" above. Its "return to edit
  and restore from localStorage" flow is exactly what was removed.

**Reference (describe how things work, not tasks):**
- `BACKEND_DEPLOYMENT_GUIDE.md`, `FRONTEND_DEPLOYMENT_GUIDE.md`,
  `CONTENT_DISPLAY_LOGIC.md`

**Roadmaps, status unverified:**
- `SEO_ROADMAP.md`, `CALENDAR_PAGE_ROADMAP.md`, `CONTENT_COLLECTIONS_ROADMAP.md`,
  `PHOTO_OF_THE_DAY_ROADMAP.md`, `LANDING_CULTURE_PARIS_EDITORIAL_ROADMAP.md`,
  `LANDING_EDITORIAL_PLACEMENTS_ROADMAP.md`, `VIEW_TRANSITIONS_AUDIT.md`

**History, closed:**
- `FRONTEND_DEPLOYMENT_CHAOS.md`, `SECURITY_INCIDENT_2025-01-27.md`

**Alpine architecture:**
- `ALPINE_ARCHITECTURE.md` — the design document for the Alpine architecture
  actually in use here (renamed from `MENTORMATIC_ALPINE_REFACTOR_PLAN.md`,
  which is why it still reads as written for another project). Part 7 and
  Appendix B specify the `$lazy` magic and `lazyLoadPlugin.ts` (skeleton
  returned synchronously, real logic merged in on `init()`), and Part 1 explains
  why the skeleton exists at all: under View Transitions, Alpine starts scanning
  before a component's logic has loaded, producing `... is not defined`.
  Note the drift: the document registers **one** lazy component (`calendar`);
  the project now registers **35**, and the shared skeleton grew to ~600 lines.

**Deleted:**
- `ALPINE_GUIDELINES.md` — removed 2026-09-18. It was written for Mentormatic,
  named the wrong entrypoint and described a per-component `x-init` dynamic-import
  pattern this project never used; everything correct in it is covered by
  `ALPINE_ARCHITECTURE.md`. An identical copy still lives at
  `wurkspaces-monorepo/apps/mentormatic/ALPINE_GUIDELINES.md`.
  Note: `DASHBOARD_PREVIEW_REFACTOR_ROADMAP.md:114` still links to it — that
  link now points at nothing and means `ALPINE_ARCHITECTURE.md`.
