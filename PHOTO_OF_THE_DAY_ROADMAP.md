# Photo of the Day — Implementation Roadmap

## Overview

A "Фото дня" content type: one image + caption per document, shown as a card in the landing sidebar (above Le saviez-vous) and on a dedicated public page. Dashboard editor for create/edit/delete.

---

## Data Model

Firestore collection: `photosOfTheDay`

```typescript
{
  id: string;        // auto-generated
  title: string;     // short title — shown in landing card and page header
  imageUrl: string;  // Firebase Storage URL
  caption: string;   // shown below image on public page
  authorId: string;  // reference to authors collection
  createdAt: Date;
  updatedAt?: Date;
}
```

No tags, no category, no carousel, no paid flag. KISS.

---

## Steps

### Step 1 — Backend: controller

**File:** `server/src/controllers/photoOfTheDayController.ts`

Pattern: copy structure from `flipperController.ts`.
- `createPhotoOfTheDay` — validates `title`, `imageUrl`, `authorId`; resolves author on GET
- `getPhotosOfTheDay` — ordered by `createdAt` desc
- `getPhotoOfTheDayById` — joins author data from `authors` collection
- `updatePhotoOfTheDay`
- `deletePhotoOfTheDay` — calls `deleteFileFromStorage(imageUrl)` to clean up Firebase Storage

No `contentCollectionId`, no `carouselContent`, no `relatedContent` for now.

---

### Step 2 — Backend: route + registration

**File:** `server/src/routes/photoOfTheDayRoutes.ts`

```
GET    /api/photos-of-the-day
POST   /api/photos-of-the-day
GET    /api/photos-of-the-day/:id
PUT    /api/photos-of-the-day/:id
DELETE /api/photos-of-the-day/:id
```

**File:** `server/src/index.ts`
Add: `app.use('/api/photos-of-the-day', photoOfTheDayRoutes);`

---

### Step 3 — API client

**File:** `src/lib/api/api.ts`

Add `PhotoOfTheDayResponse` and `PhotoOfTheDayPayload` types, and `photosOfTheDayApi`:

```typescript
export const photosOfTheDayApi = {
  list(token?: string) { ... }           // GET /api/photos-of-the-day
  create(payload, token?) { ... }        // POST
  getById(id, token?) { ... }            // GET /:id
  update(id, payload, token?) { ... }    // PUT /:id
  delete(id, token?) { ... }             // DELETE /:id
};
```

---

### Step 4 — Public page

**File:** `src/pages/photo-of-the-day/[id].astro`

Structure mirrors `flippers/[id].astro` but simpler — no Alpine carousel state:

```
Layout
  main.bg-base-200
    ArticleHeader (category="Фото дня", title)
    ArticleAuthor + ArticleDate
    Full-width image (max-w-[1200px], h-[649px], object-cover) — plain <img>, no ArticleImage component needed
    Caption (text-center, text-sm, text-black/60, font-inter)
    hr divider
```

Image: use a plain `<img>` with `loading="lazy"` and Alpine fade-in (same pattern as `LazyImage.astro`):
```html
<img
  src={photo.imageUrl}
  alt={photo.title}
  class="opacity-0 transition-opacity duration-300 w-full h-full object-cover"
  x-data=""
  x-init="$el.complete ? ($el.style.opacity='1') : $el.addEventListener('load', () => $el.style.opacity='1')"
/>
```
This is the **existing Alpine lazy-load pattern** — no skeleton div needed, just the fade from opacity-0.

---

### Step 5 — Landing card

**File:** `src/components/common/LandingBody.astro`

In the frontmatter, add after the existing data fetches:
```typescript
import { photosOfTheDayApi } from '@/lib/api/api';
let photoOfTheDay: any = null;
try {
  const photos = await photosOfTheDayApi.list();
  photoOfTheDay = photos[0] ?? null; // already sorted desc by createdAt
} catch (e) {
  console.error('Failed to fetch photo of the day', e);
}
```

In the template, add a new `<section>` **above** the Le saviez-vous section (before line ~917):
```astro
{photoOfTheDay && (
  <section class="grid gap-4">
    <h3 class="m-0 text-lg font-semibold uppercase tracking-[0.3em] font-old_standard">
      Фото дня
    </h3>
    <article class="overflow-hidden bg-white">
      <a href={`/photo-of-the-day/${photoOfTheDay.id}`} class="block" aria-label={photoOfTheDay.title}>
        <LazyImage
          src={photoOfTheDay.imageUrl}
          alt={photoOfTheDay.title}
          class="block h-auto w-full object-cover lg:h-[240px]"
        />
      </a>
      <div class="grid gap-[0.55rem] p-4 lg:px-4 lg:py-6">
        <a href={`/photo-of-the-day/${photoOfTheDay.id}`} class="text-current no-underline hover:underline">
          <h4 class="m-0 text-xl font-normal font-old_standard tracking-[-0.02em] leading-[1.16]">
            {photoOfTheDay.title}
          </h4>
        </a>
        {photoOfTheDay.caption && (
          <p class="m-0 text-sm text-black/60 font-inter font-normal line-clamp-2">
            {photoOfTheDay.caption}
          </p>
        )}
      </div>
    </article>
  </section>
)}
```

The card width is identical to Le saviez-vous (it sits in the same `<aside>` column).

---

### Step 6 — Dashboard: PhotoOfTheDayComposer component

**File:** `src/components/dashboard/PhotoOfTheDayComposer.astro`

Alpine.js component, based on `FlipperComposer.astro` pattern but much simpler:

Fields:
- **Title** — text input
- **Caption** — textarea
- **Author** — select (existing authors list, same as FlipperComposer)
- **Image upload** — single image, Firebase Storage upload to `photos-of-the-day/` prefix
  - Shows upload progress
  - Shows current image preview with replace button
- **Save / Delete** buttons

State shape:
```javascript
{
  title: '',
  caption: '',
  authorId: '',
  imageUrl: '',       // Firebase Storage URL after upload
  uploading: false,
  saving: false,
  isEditMode: false,
  photoId: null,
}
```

Image upload: use the same client-side Firebase upload pattern already present in `FlipperComposer.astro`. Storage path: `photos-of-the-day/${Date.now()}-${filename}`.

Preview section: live preview below the form showing the card as it will appear on the landing page.

---

### Step 7 — Dashboard pages

**File:** `src/pages/dashboard/photo-of-the-day/index.astro`
- Fetch all photos (server-side with auth token)
- Table: thumbnail + title + date + Edit / Delete actions
- "Create" button → `/dashboard/photo-of-the-day/create`

**File:** `src/pages/dashboard/photo-of-the-day/create.astro`
```astro
<DashboardLayout title="Фото дня — Создать" active="photo-of-the-day">
  <PhotoOfTheDayComposer creatorState={...} />
</DashboardLayout>
```

**File:** `src/pages/dashboard/photo-of-the-day/[id]/edit.astro`
- Fetch existing photo server-side
- Pass to composer in edit mode

---

### Step 8 — Dashboard nav link

**File:** wherever the dashboard sidebar nav is defined (check `DashboardLayout.astro`)
- Add link "Фото дня" → `/dashboard/photo-of-the-day`

---

## Implementation Order

```
1. server/src/controllers/photoOfTheDayController.ts
2. server/src/routes/photoOfTheDayRoutes.ts
3. server/src/index.ts                               (register route)
4. src/lib/api/api.ts                                (add photosOfTheDayApi)
5. src/pages/photo-of-the-day/[id].astro             (public page)
6. src/components/common/LandingBody.astro            (landing card)
7. src/components/dashboard/PhotoOfTheDayComposer.astro
8. src/pages/dashboard/photo-of-the-day/index.astro
9. src/pages/dashboard/photo-of-the-day/create.astro
10. src/pages/dashboard/photo-of-the-day/[id]/edit.astro
11. DashboardLayout nav link
```

Steps 1–4 are pure backend/API — no UI. Steps 5–6 are read-only frontend — need step 4 done first. Steps 7–11 are dashboard — need steps 1–4 done first.

---

## Notes

- **Alpine lazy-load**: No separate skeleton component. The existing pattern (`opacity-0 transition-opacity duration-300` + `x-init` reveal) is used on both the public page image and the landing card via `LazyImage.astro`.
- **Landing fetch**: Single `list()` call, take `[0]`. Cheap. If the collection is empty the section just doesn't render.
- **Image cleanup**: `deletePhotoOfTheDay` must call `deleteFileFromStorage(imageUrl)` — same as flipper delete.
- **No auth on GET routes**: Consistent with all other content types (articles, flippers, etc.).
- **Edit replaces image**: If editor uploads a new image, the old Firebase Storage file should be deleted by the backend on `PUT` when `imageUrl` changes.
