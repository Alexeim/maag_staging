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
  `publicLandingController.ts`. These filter `.where('published','==',true)`.
  **Safe for readers.**
- `server/src/routes/{article,news,guide,interview,flipper,visualStory,event,
  firstPerson}Routes.ts` → `router.get('/')` and `router.get('/:id')`.
  No auth, no `published` filter. **Editorial endpoints, drafts included.**

**Open defect (2026-09-18, not fixed):** `fetchPublicContentPools()` in
`src/lib/utils/contentCollectionMarquee.ts` calls `articlesApi.list()` etc. —
the unfiltered routes — and never filters `published`. Drafts therefore reach
the "Похожие материалы" carousels, the in-news sidebar rail and
`src/components/article/LinkToContent.astro`.

Before touching any public card list, check which read model it uses.

Admin draft preview on real pages is intentional and separate:
`canPreviewUnpublished()` in `src/lib/utils/preview.ts`, gated on
`role === "admin"`. Do not break it while fixing the above.

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

## Documents in this repo

Nothing reads these automatically. Status is unverified unless noted.

**Live:**
- `docs/security-auth-dependency-roadmap.md` — security/auth/hosting, last
  reviewed 2026-09-01. Contains the open question about editorial GET routes.
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
