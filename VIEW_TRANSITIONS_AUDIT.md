# View Transitions — Full Audit

> Status: audit only, no code changes pending approval.
> Last updated: 2026-06-05

---

## Canonical name scheme

| Content type | Name pattern | Used by |
|---|---|---|
| article / news / interview / guide / visual-story / flipper | `main-article-image-${id}` | most source + destination pages |
| event | `event-image-${id}` | MainLandingBlock + events/[id] |

Single source of truth: `src/lib/utils/transitions.ts` → `getTransitionName(item)`.

---

## Pass-through components (no logic, just forward the prop)

These components accept `transitionName?: string` and pass it down. They are not the problem — they are neutral pipes.

| Component | What it does with the prop |
|---|---|
| `LazyImage.astro` | applies `transition:name={transitionName}` to `<img>` or `<Image>` (all 4 variants: lazy/eager × remote/local) |
| `ArticleCard.astro` | passes `transitionName` down to `LazyImage` |
| `NetlenkaCard.astro` | passes `transitionName` down to `LazyImage` |
| `NetlenkaCardOne.astro` | passes `transitionName` down to `LazyImage` |
| `NetlenkaCardTwo.astro` | passes `transitionName` down to `LazyImage` |
| `NetlenkaCardThree.astro` | passes `transitionName` down to `LazyImage` |
| `LatestInterview.astro` | applies `transition:name={transitionName}` directly to `<img>` (portrait photo) |

---

## Destination components (the "B" side — receive the user after navigation)

These are the hero components on detail pages. They receive `transitionName` from their page and apply it.

### `ArticleImage.astro`
- Applies `transition:name={transitionName}` to hero `<img>` or `<Image>`
- Also renders hidden 1×1px `<img>` elements for each alias in `transitionAliases[]`
- Used by: `article/[id].astro`, `news/[id].astro`

### `NewsImage.astro` (news sticky image)
- Same pattern: `transition:name={transitionName}` on main image + aliases loop
- Used by: `news/[id].astro` (for sticky in-article image, NOT the hero — see below)

### `InterviewHero.astro`
- Applies `transition:name={transitionName}` to `<img>` or `<Image>` (if/else for remote vs local)
- Also renders hidden alias pixels loop
- Used by: `interviews/[id].astro`

### `GuideHero.astro`
- Same pattern as InterviewHero
- Used by: `guide/[id].astro`

### `CategoryHero.astro`
- **Self-generates** `heroTransitionName = main-article-image-${article.id}` internally (does NOT receive it as a prop)
- Applies to if/else `<img>` / `<Image>`
- ⚠️ **ISSUE**: imported nowhere in any page. This component is never used. Dead code.

---

## Destination pages (the "B" side — full page view)

### `article/[id].astro`
```
transitionName = `main-article-image-${id}`
transitionAliases = [`landing-body-main-article-image-${id}`]
```
Passes both to `ArticleImage`. The alias renders as a hidden 1×1 pixel.
- ⚠️ **ISSUE**: `landing-body-main-article-image-*` alias is stale. It was created to catch the old broken LandingBody namespace. LandingBody now uses canonical names. The alias is dead code — harmless but unnecessary.

### `news/[id].astro`
```
transitionName = `main-article-image-${id}`
transitionAliases = [`landing-body-main-article-image-${id}`]
```
Same issue as article — stale alias.

### `interviews/[id].astro`
```
transitionName = `main-article-image-${id}`
transitionAliases = [`landing-body-main-article-image-${id}`]
```
Same issue — stale alias.

### `guide/[id].astro`
```
transitionName = `main-article-image-${id}`
transitionAliases = [`landing-body-main-article-image-${id}`]
```
Same issue — stale alias.

### `events/[id].astro`
```
transition:name={`event-image-${id}`}
```
Applied directly inline on `<img>`. No aliases. ✅ Clean.

### `visual-story/[id].astro`
No transition names at all. Not wired up to the system. ⚠️ Could be intentional or oversight.

---

## Source pages (the "A" side — where user clicks)

### `index.astro`
Renders: `<Hero />` + `<MainLandingBlock />` + `<LandingBody />`

---

#### `MainLandingBlock.astro` (rendered on index.astro)

| Element | Name applied | Variable | Risk |
|---|---|---|---|
| News rail items (80×80 thumbnail, `<Image>`) | `main-article-image-${newsItem.id}` | `newsArticles` from `newsApi.list()` — news items only | ✅ no overlap with mainArticle (different content type pools) |
| Main hero (`<img>`) | `main-article-image-${mainArticle.id}` | `mainArticle` from editorial placement — articles/guides/interviews/flippers/visual-stories, NEVER news | ✅ |
| Event card img (when imageUrl exists) | `event-image-${landingEvent.id}` | `landingEvent` | ✅ if/else with Image below — only one renders |
| Event card Image (fallback, no imageUrl) | `event-image-${landingEvent.id}` | same `landingEvent` | ✅ if/else — only one renders |

Data separation guarantee: `landingContent` (mainArticle source) explicitly excludes news items. `newsArticles` only contains news items. No ID collision possible between mainArticle and newsArticles.

Status: ✅ **No duplicate transition:name issues.**

---

#### `LandingBody.astro` (rendered on index.astro)

Data deduplication chain:
- `cultureItems` / `parisItems` both filter: `!isHotContent && !isNews && !isPlacedMainHero`
  — this means: `mainArticle` from MainLandingBlock is excluded from LandingBody sections
  — news items are excluded from culture/paris sections
- `cultureHero` is excluded from `cultureCardItems` (via `excludedIds`)
- `parisHero` is excluded from `parisCardItems` (via `excludedIds`)
- `hotContentItems` requires `isLandingHotContentItem` flag — mutually exclusive with `cultureCardItems`/`parisCardItems` which require `!isHotContent`

| Line | Element | Name applied | Variable | Risk |
|---|---|---|---|---|
| 612 | `LazyImage` | `getTransitionName(cultureHero)` → `main-article-image-${id}` | `cultureHero` — manually placed culture section hero | ✅ excluded from cultureCardItems |
| 694 | `ArticleCard` → `LazyImage` | `getTransitionName(item)` → `main-article-image-${id}` | `cultureCardItems.slice(0, 2)` — top 2 culture articles | ✅ excludes cultureHero; mutually exclusive with hotContentItems |
| 716 | `LatestInterview` → `<img>` | `getTransitionName({id, href:/interviews/})` → `main-article-image-${id}` | `latestInterview` | ⚠️ see ISSUE 1 below |
| 751 | `NetlenkaCardOne` → `LazyImage` | `getTransitionName(item)` → `main-article-image-${id}` | `hotContentItems` (editorial "Выбор" rail) | ⚠️ see ISSUE 1 below |
| 793 | `LazyImage` | `getTransitionName(parisHero)` → `main-article-image-${id}` | `parisHero` — manually placed paris section hero | ✅ excluded from parisCardItems |
| 865 | `ArticleCard` → `LazyImage` | `getTransitionName(item)` → `main-article-image-${id}` | `parisCardItems.slice(0, 2)` | ✅ excludes parisHero; mutually exclusive with hotContentItems |
| 999 | `ArticleCard` (in doubled marquee) | **NO transition:name** | `[...carouselItems, ...carouselItems]` | ✅ correct — doubled array, no name applied |

**⚠️ ISSUE 1 — latestInterview vs hotContentItems potential overlap:**

`latestInterview` = from `interviews` array (auto-latest = `interviews[0]`, or manual by ID)
`hotContentItems` = from `netlenkaCandidates` filtered by `isLandingHotContentItem`, which includes interviews

If an interview has the hot content flag AND is `interviews[0]` (or manually placed as latestInterview), it will appear in BOTH sections simultaneously with the same `transition:name = main-article-image-${id}` → **duplicate on the same page**.

`selectNetlenkaItems` only excludes the manually-placed `cultureInterviewBlock.id` in manual mode. Auto-latest mode has no such exclusion.

Risk level: LOW in practice (interviews are usually not flagged as hot content), but the code does not prevent it.

---

### `paris.astro`

Data deduplication chain:
- `primaryParisArticle`: manually placed or first non-hot item → ID goes into `topIds`
- `secondaryStories`: from `topWithoutPrimary` (excludes primary, excludes hot content via `topItems` filter)
- `editorialSidebarItems`: hot content items, filtered `!topIds`
- `parisFeed`: `allParisItems.filter(!topIds && !sidebarIds && !isHotContent)`
- `editorialGridItems = parisFeed.slice(0, MAX)` 
- `editorialCarouselItems = parisFeed.slice(MAX)` — doubled for infinite scroll

| Line | Element | Name applied | Variable | Risk |
|---|---|---|---|---|
| 354 | `<img>` (primary hero) | `getTransitionName(primaryParisArticle)` → `main-article-image-${id}` | `primaryParisArticle` | ✅ excluded from all other pools |
| 419 | `<img>` loop | `getTransitionName(item)` | `secondaryStories` | ✅ excluded from parisFeed |
| 499 | `NetlenkaCardThree` → `LazyImage` | `getTransitionName(item)` | `editorialSidebarItems` (hot content) | ✅ mutually exclusive pools |
| 531 | `<img>` loop | `getTransitionName(item)` | `editorialGridItems` | ✅ excluded from secondary/sidebar |
| 595–599 | `<img>` in doubled carousel | `getTransitionName(item)` only when `i < editorialCarouselItems.length` | `editorialCarouselItems` (first copy only) | ✅ guard prevents name on cloned items |

Status: ✅ **No duplicate transition:name issues on this page.**

---

### `culture.astro`

Data deduplication chain:
- `primaryCultureArticle`: manually placed or auto → ID goes into `topIds`
- `secondaryStories`: from `topWithoutPrimary` — excludes primary, excludes interviews (`topItems` filters `contentType !== "interview"`)
- `featuredInterview`: interview item, ID goes into `excludedIds`
- `editorialSidebarItems`: hot content, filtered `!excludedIds`
- `cultureFeed`: `allCultureItems.filter(!excludedIds && !sidebarIds && !isHotContent)`
- `editorialGridItems = cultureFeed.slice(0, MAX)`
- `editorialCarouselItems = cultureFeed.slice(MAX)` — doubled for infinite scroll

| Line | Element | Name applied | Variable | Risk |
|---|---|---|---|---|
| 407 | `<img>` (primary hero) | `getTransitionName(primaryCultureArticle)` | `primaryCultureArticle` | ✅ excluded from all other pools |
| 472 | `<img>` loop | `getTransitionName(item)` | `secondaryStories` | ✅ excluded from cultureFeed |
| 541 | `NetlenkaCardTwo` → `LazyImage` | `getTransitionName(item)` | `editorialSidebarItems` (hot content) | ✅ mutually exclusive with cultureFeed |
| 566 | `LatestInterview` → `<img>` | hardcoded `main-article-image-${featuredInterview.id}` | `featuredInterview` | ✅ in `excludedIds` — cannot appear elsewhere; ⚠️ hardcoded string instead of utility |
| 601 | `<img>` loop | `getTransitionName(item)` | `editorialGridItems` | ✅ excluded from secondary/sidebar/interview |
| 682–686 | `<img>` in doubled carousel | `getTransitionName(item)` only when `i < editorialCarouselItems.length` | `editorialCarouselItems` (first copy only) | ✅ guard correct |

Status: ✅ **No duplicate transition:name issues on this page.**

---

## Components cleaned up (no longer have transition:name)

| Component | Before | After | Reason |
|---|---|---|---|
| `RelatedContentMarquee.astro` | `main-article-image-${id}` on each card | removed | same article can appear multiple times in the carousel DOM (cloning for scroll); also destination hero already has the name |
| `ContentCollectionMarquee.astro` | `main-article-image-${id}` on each card | removed | same reason |

---

## Full issues summary

### ISSUE 1 — Stale `transitionAliases` on all destination pages (medium priority)
**Files:** `article/[id].astro`, `news/[id].astro`, `interviews/[id].astro`, `guide/[id].astro`
**What:** Each defines `transitionAliases = [\`landing-body-main-article-image-${id}\`]` and passes it to their hero component. The hero component renders a hidden 1×1 pixel `<img>` with that name. This alias was created to work with the old broken `landing-body-*` namespace in LandingBody.
**Now:** LandingBody uses canonical names (`main-article-image-*`). Nobody on any source page ever assigns `landing-body-main-article-image-*` anymore. The alias is dead.
**Effect:** 4 hidden invisible images per detail page load, each with an orphaned `transition:name`. No visual bug. No animation triggered. Pure dead code.
**Fix:** Remove `transitionAliases` and the alias rendering from all 4 destination pages + the `ArticleImage`, `GuideHero`, `InterviewHero` components.

---

### ISSUE 2 — `latestInterview` / `hotContentItems` overlap on index.astro (low priority)
**File:** `LandingBody.astro`
**What:** If an interview is flagged as hot content (`isLandingHotContentItem`) AND is the latest interview (`interviews[0]` in auto-latest mode), it appears in BOTH `latestInterview` (via `LatestInterview`) and `hotContentItems` (via `NetlenkaCardOne`) — both with `transition:name = main-article-image-${id}` on the same page.
**Effect:** Browser sees two elements with same `transition:name` — unpredictable animation behavior.
**Fix option A:** In `selectNetlenkaItems`, also exclude the `latestInterview.id` regardless of its placement mode.
**Fix option B:** Remove `transitionName` from either `latestInterview` or `hotContentItems` in LandingBody.

---

### ISSUE 3 — `CategoryHero.astro` is dead code (low priority)
**File:** `src/components/common/CategoryHero.astro`
**What:** Component self-generates `main-article-image-${id}`. Never imported by any page.
**Effect:** None (unused).
**Fix:** Delete, or wire it up if it's intended to be used.

---

### ISSUE 4 — `NetlenkaCard.astro` (base variant) imported but never rendered (low priority)
**Files:** `paris.astro`, `culture.astro`, `LandingBody.astro` all import it
**What:** The base `NetlenkaCard` component is imported but the template never renders it anywhere (paris uses `NetlenkaCardThree`, culture uses `NetlenkaCardTwo`, LandingBody uses `NetlenkaCardOne`).
**Effect:** Dead import — no runtime effect.
**Fix:** Remove the unused import from those 3 files.

---

### ISSUE 5 — `culture.astro` line 566 hardcodes transition name instead of using utility (cosmetic)
**File:** `culture.astro:566`
**What:** `transitionName={\`main-article-image-${featuredInterview.id}\`}` — hardcoded string instead of `getTransitionName({id: featuredInterview.id, href: \`/interviews/${featuredInterview.id}\`})`
**Effect:** Functionally identical right now. But if the canonical scheme ever changes, this line won't be caught by a refactor of `transitions.ts`.
**Fix:** Replace with utility call.

---

### ISSUE 6 — `visual-story/[id].astro` has no transition:name (possible oversight)
**File:** `visual-story/[id].astro`
**What:** Visual stories appear in source pages (paris.astro, culture.astro) with `getTransitionName(item)` → `main-article-image-${id}`. But the destination page `visual-story/[id].astro` has no `transition:name` on its hero.
**Effect:** When user clicks a visual story card → no morph animation plays. The image just cuts/fades via default page transition.
**Fix:** Wire up `transitionName={\`main-article-image-${id}\`}` on the visual story hero image, same as other detail pages. Requires checking what hero component/element exists there.

---

## What is confirmed clean

| Item | Status |
|---|---|
| `MainLandingBlock` news rail | ✅ canonical names, no duplicates (separate pool from mainArticle) |
| `MainLandingBlock` main hero | ✅ matches destination pages |
| `MainLandingBlock` event (if/else) | ✅ only one branch renders |
| `paris.astro` all sections | ✅ properly deduplicated, guards on carousel |
| `culture.astro` all sections | ✅ properly deduplicated, guards on carousel |
| `LandingBody` culture/paris heroes | ✅ canonical names, excluded from card pools |
| `LandingBody` card pools | ✅ mutually exclusive with each other |
| `LandingBody` carouselItems | ✅ no transition:name (correct, doubled array) |
| `RelatedContentMarquee` | ✅ cleaned |
| `ContentCollectionMarquee` | ✅ cleaned |
| `article/[id]`, `news/[id]`, `interviews/[id]`, `guide/[id]`, `events/[id]` destination names | ✅ canonical |

---

## Proposed fix order

1. **ISSUE 1** — Remove stale `transitionAliases` from 4 destination pages + hero components (safe, no visual change)
2. **ISSUE 6** — Wire up `visual-story/[id].astro` hero transition name (new feature, adds animation)
3. **ISSUE 5** — Replace hardcoded string in `culture.astro:566` with utility call (cosmetic/maintenance)
4. **ISSUE 2** — Decide on latestInterview/hotContentItems exclusion strategy (data logic change)
5. **ISSUE 3** — Delete `CategoryHero.astro` if confirmed unused
6. **ISSUE 4** — Remove dead `NetlenkaCard` imports
