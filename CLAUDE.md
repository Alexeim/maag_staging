# maag_staging — project facts

Only things that are non-obvious or that I have already got wrong here.

## Backend

- The API backend is **in this repo**, at `server/` (Express + firebase-admin +
  Firestore). It is not a separate repository. `src/pages/api/` holds only
  `session.ts`, which makes it look otherwise.
- A frontend type existing in `src/lib/api/api.ts` does **not** mean the backend
  stores or returns that field — controllers whitelist fields explicitly.
  Check `server/src/controllers/*Controller.ts` before assuming a change is done.
- Verify backend with `cd server && npx tsc --noEmit`. Not `astro check`, which
  scans `server/*.ts` with the wrong tsconfig and invents errors.

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
sidebar and in-body `LinkToContent` — come from one call,
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

## Documents in this repo

Nothing reads these automatically. Status is unverified unless noted.

**Live:**
- `docs/audit-2026-09-18.md` — **read this first.** Whole-project audit of
  2026-09-18: what was fixed that day (commits), owner decisions (editorial
  GET routes stay open, publication date only, delete nothing unasked), and
  the open items with file:line — profile overwrite/read, Stripe trusting
  body ids, broken `articlesApi.del`, Quill in every reader's bundle, and more.
  Check an item there before re-reporting it as a new finding.
- `docs/security-auth-dependency-roadmap.md` — security/auth/hosting, last
  reviewed 2026-09-01. Line 513 assumes editorial GET routes return no
  drafts; they do (see the audit).
- `CALENDAR_PAYWALL_ROADMAP.md`, `DASHBOARD_PREVIEW_REFACTOR_ROADMAP.md`

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
