# MAAG France SEO Roadmap

## Current State

MAAG France already has a solid technical SEO base:

- Astro is configured with `site: "https://maagfrance.fr"`, so canonical URLs and generated sitemap URLs use the production domain.
- `@astrojs/sitemap` is installed and creates `sitemap-index.xml` and `sitemap-0.xml` during `astro build`.
- `src/pages/robots.txt.ts` generates a runtime `robots.txt` with:
  - `Allow: /`
  - `Disallow: /dashboard/`
  - `Sitemap: https://maagfrance.fr/sitemap-index.xml`
- `Layout.astro` and `VisualStoryLayout.astro` output core metadata:
  - `<title>`
  - `meta description`
  - canonical URL
  - Open Graph tags
  - Twitter card tags
  - Google Search Console verification tag
- Dynamic content pages already pass page-specific SEO data into the layout:
  - `/article/[id]`
  - `/news/[id]`
  - `/interviews/[id]`
  - `/guide/[id]`
  - `/events/[id]`
  - `/visual-story/[id]`
  - `/photo-of-the-day/[id]`
  - `/flippers/[id]`
  - `/tips/[id]`
- The Express wrapper serves precompressed static assets first and then passes all dynamic routes to the Astro SSR handler.

## Current Sitemap Finding

Initial finding: after running `npm run build`, the generated sitemap contained 14 URLs:

- `/`
- `/about/`
- `/building/`
- `/calendar/`
- `/cookies/`
- `/culture/`
- `/news/new-news1/`
- `/news/new-news2/`
- `/news/new-news3/`
- `/news/new-news4/`
- `/news/new-news5/`
- `/paris/`
- `/privacy/`
- `/terms/`

This explains why Google Search Console reports around 14 discovered pages.

Current implementation status:

- Demo news variant pages were excluded from the generated Astro sitemap.
- The generated static sitemap now contains 9 public static URLs:
  - `/`
  - `/about/`
  - `/building/`
  - `/calendar/`
  - `/cookies/`
  - `/culture/`
  - `/paris/`
  - `/privacy/`
  - `/terms/`
- `src/pages/sitemap-content.xml.ts` was added as an API-backed dynamic sitemap endpoint for content pages.
- `src/pages/robots.txt.ts` now advertises both:
  - `https://maagfrance.fr/sitemap-index.xml`
  - `https://maagfrance.fr/sitemap-content.xml`

The important distinction:

- Dynamic routes such as `src/pages/article/[id].astro` can render SEO metadata when a concrete URL is requested.
- The sitemap generator does not automatically know which real API-backed IDs exist.

So this route:

```text
/article/[id]
```

can render this URL:

```text
https://maagfrance.fr/article/some-real-article-id
```

but the sitemap needs a concrete list of URLs:

```xml
<loc>https://maagfrance.fr/article/some-real-article-id</loc>
<loc>https://maagfrance.fr/article/another-real-article-id</loc>
```

## Brand Search Goal

The SEO goal is not only to rank individual articles. Google also needs to understand that `MAAG France` is a real media brand.

Brand search examples:

- `MAAG France`
- `maagfrance`
- `maag paris`
- `мааг франция`
- `русскоязычное медиа во франции`

Actions:

- Use the brand name consistently as `MAAG France`.
- Avoid mixing `Maag`, `MAAG`, `Maag France`, and `MAAG France` unless there is a deliberate editorial reason.
- Strengthen the homepage title and description.
- Make the About page clearly describe the project, audience, geography, and editorial focus.
- Link official social profiles back to the site using the same brand name.
- Add structured data for `NewsMediaOrganization`.

Recommended homepage metadata:

```text
title: MAAG France — русскоязычное медиа о культуре и Париже
description: MAAG France — медиа о культуре, событиях, Париже и жизни во Франции. Афиша, интервью, гиды и авторские материалы на русском языке.
```

## Structured Data

Structured data should be added as JSON-LD. It helps search engines understand entities, page types, article authorship, dates, publisher identity, breadcrumbs, and events.

Recommended schema types:

- `WebSite` for the whole site.
- `NewsMediaOrganization` for MAAG France as publisher.
- `Article` or `NewsArticle` for editorial articles and news.
- `Event` for event pages.
- `BreadcrumbList` for navigational context.

Current implementation status:

- Done: `StructuredData.astro` renders JSON-LD safely through `<script type="application/ld+json">`.
- Done: `Layout.astro` and `VisualStoryLayout.astro` include global `WebSite` and `NewsMediaOrganization` schema.
- Done: `/article/[id]` includes `Article` schema.
- Done: `/news/[id]` includes `NewsArticle` schema.
- Done: `/interviews/[id]`, `/guide/[id]`, `/tips/[id]`, `/flippers/[id]`, and `/visual-story/[id]` include `Article` schema.
- Done: `/photo-of-the-day/[id]` includes `ImageObject` schema.
- Done: `/events/[id]` includes `Event` schema.
- Pending: `BreadcrumbList` schema once breadcrumb UI/data is implemented.

Recommended article schema fields:

- `@context`
- `@type`
- `headline`
- `description`
- `image`
- `datePublished`
- `dateModified`
- `author`
- `publisher`
- `mainEntityOfPage`
- `inLanguage`

Example:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Название статьи",
  "description": "Лид статьи",
  "image": "https://maagfrance.fr/image.jpg",
  "author": {
    "@type": "Person",
    "name": "Имя автора"
  },
  "publisher": {
    "@type": "NewsMediaOrganization",
    "name": "MAAG France",
    "url": "https://maagfrance.fr"
  },
  "mainEntityOfPage": "https://maagfrance.fr/article/some-id",
  "inLanguage": "ru"
}
```

Implementation direction:

- Add shared helpers for JSON-LD generation.
- Keep schema data close to the page data that already exists.
- Start with `Layout.astro` for global `WebSite` and `NewsMediaOrganization`.
- Add article-level JSON-LD in each dynamic content page.
- Add `BreadcrumbList` once the breadcrumb UI/data model is clear.

## Dynamic Sitemap For API Content

The highest-impact technical SEO task is generating sitemap entries for real published content from the API.

Original issue:

- `@astrojs/sitemap` sees static Astro pages.
- It does not know all IDs from Firestore/API-backed content.
- Therefore dynamic pages are renderable, but not fully discoverable through the generated sitemap.

Implemented solution:

- Created `src/pages/sitemap-content.xml.ts`.
- Updated `robots.txt.ts` to list the content sitemap.
- Excluded `sitemap-content.xml` from the regular Astro sitemap so it is not listed as a normal page URL.
- The content sitemap fetches API-backed content and generates concrete URLs.

Possible future extensions:

- Add `src/pages/sitemap-news.xml.ts` for Google News-specific needs if MAAG qualifies and has the required publishing cadence.
- Add `src/pages/sitemap-images.xml.ts` if image discovery becomes a priority.
- Fetch only public/published content.
- Generate concrete URLs for all content types:
  - `/article/{id}`
  - `/news/{id}`
  - `/interviews/{id}`
  - `/guide/{id}`
  - `/events/{id}`
  - `/visual-story/{id}`
  - `/photo-of-the-day/{id}`
  - `/flippers/{id}`
  - `/tips/{id}`
- Include `<lastmod>` from `updatedAt` or `createdAt` where available.
- Update `robots.txt.ts` to list both the Astro sitemap index and the content sitemap.

Example target output:

```xml
<url>
  <loc>https://maagfrance.fr/article/some-real-id</loc>
  <lastmod>2026-06-14</lastmod>
</url>
```

Rules:

- Include only public pages that should appear in search.
- Exclude drafts, previews, dashboard pages, auth pages, profile pages, payment success/cancel pages, and design variants.
- Keep the sitemap deterministic and valid even if one API source fails.

## Section Page Metadata

Section pages are important SEO hubs. They should have unique metadata that matches the visible page content.

Current issue:

- Some section pages pass only `title`.
- Their `description` falls back to the generic layout default.

Recommended metadata:

Homepage:

```text
title: MAAG France — русскоязычное медиа о культуре и Париже
description: MAAG France — медиа о культуре, событиях, Париже и жизни во Франции. Афиша, интервью, гиды и авторские материалы на русском языке.
```

Culture:

```text
title: Культура в Париже — MAAG France
description: Выставки, театр, музыка, книги, кино и культурные события Парижа на русском языке. Редакционные подборки, интервью и гиды MAAG France.
```

Paris:

```text
title: Париж — гиды, места и жизнь в городе | MAAG France
description: Авторские материалы о Париже: районы, маршруты, места, события, городская жизнь и практические гиды для русскоязычных жителей и гостей Франции.
```

Calendar:

```text
title: Афиша Парижа — события и календарь | MAAG France
description: Календарь событий в Париже: выставки, концерты, спектакли, встречи и культурные мероприятия на русском языке.
```

About:

```text
title: О проекте — MAAG France
description: MAAG France — русскоязычное медиа о культуре, Париже и жизни во Франции. Рассказываем о событиях, людях, местах и идеях.
```

Important:

- Metadata must match visible page content.
- Google may rewrite snippets if the description is generic, misleading, duplicated, or disconnected from the page.

## Multilingual Metadata

Current primary language is Russian:

```html
<html lang="ru">
```

This is correct for the current content.

Guidance:

- Do not add several unrelated language versions of metadata to the same page.
- It is acceptable to include a short English phrase in the homepage description if it helps clarify the brand internationally.
- For real English or French SEO, create real localized pages such as `/en/` and `/fr/`.
- Add `hreflang` only when real alternative language pages exist.

Example bilingual homepage description if needed:

```text
MAAG France — русскоязычное медиа о культуре, Париже и жизни во Франции. Russian-language culture media in France.
```

## Internal Linking

Internal links help crawlers discover content and understand topical relationships.

Recommended linking structure:

- Homepage links to:
  - latest articles
  - featured stories
  - `/culture`
  - `/paris`
  - `/calendar`
  - `/about`
- `/culture` links to:
  - culture articles
  - interviews
  - events
  - culture tags such as exhibitions, theatre, music, books, cinema
- `/paris` links to:
  - guides
  - places
  - districts
  - routes
  - practical city-life content
- Article pages link to:
  - their parent section
  - related articles
  - same-category articles
  - relevant guides/events/interviews
  - older evergreen content when contextually useful

Recommended UI/data additions:

- Breadcrumbs:
  - `Главная > Культура > Название статьи`
  - `Главная > Париж > Название статьи`
- Related content blocks.
- Tag/category landing pages.
- Author pages when author identity becomes editorially important.

Good internal linking pattern:

```text
Article about a Musee d'Orsay exhibition
  -> /culture
  -> exhibition tag page
  -> related museum articles
  -> relevant event page
  -> Paris district guide if available
```

## Robots.txt Approach

The current custom `src/pages/robots.txt.ts` is enough for this project.

`astro-robots-txt` advantages:

- Generates `robots.txt` at build time.
- Keeps sitemap URL in sync with Astro `site`.
- Supports multiple policies, `host`, custom sitemap names, and `transform`.

Why not add it now:

- The current runtime route is simple and explicit.
- The project already uses SSR with an Express wrapper.
- Adding the package would be a new dependency for a small amount of functionality.
- The current file can be extended easily when the dynamic content sitemap is added.

Recommended future `robots.txt`:

```text
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /profile/
Disallow: /success/
Disallow: /cancel/

Sitemap: https://maagfrance.fr/sitemap-index.xml
Sitemap: https://maagfrance.fr/sitemap-content.xml
```

## Sitemap Cleanup

Current sitemap includes design/demo pages:

- `/news/new-news1/`
- `/news/new-news2/`
- `/news/new-news3/`
- `/news/new-news4/`
- `/news/new-news5/`

These should be either:

- removed from sitemap, or
- marked `noindex`, or
- deleted if no longer needed.

Recommended path:

- Exclude them from `@astrojs/sitemap` first.
- Add `noindex` if they remain publicly accessible.
- Consider moving design variants under dashboard/dev-only routes if they are internal tools.

## Search Console Expectations

Two days is not enough time to judge SEO results.

Common statuses:

- `Discovered - currently not indexed`: Google found the URL but has not crawled it yet.
- `Crawled - currently not indexed`: Google crawled the page but has not selected it for indexing yet.

This is normal for a new or recently SEO-enabled site.

Near-term expectations:

- After sitemap cleanup and dynamic sitemap generation, Search Console should show more discovered URLs.
- Indexing will still depend on content quality, uniqueness, internal linking, crawl budget, page performance, and external signals.
- Resubmitting a sitemap can help discovery, but it does not force indexing.

## Priority Plan

### Phase 1: Technical Cleanup

- Done: exclude demo news variant pages from sitemap.
- Decide whether demo pages should be `noindex` or moved.
- Done: add unique metadata for homepage, Culture, Paris, Calendar, and About.
- Done: keep the existing custom `robots.txt.ts`.

### Phase 2: Dynamic Discoverability

- Done: create API-backed `sitemap-content.xml.ts`.
- Done: include API-backed content URLs from the current public list endpoints.
- Done: add `<lastmod>` values from `updatedAt` or `createdAt` where available.
- Done: update `robots.txt.ts` with the dynamic sitemap URL.
- Submit the new sitemap in Google Search Console.

### Phase 3: Structured Data

- Done: add global `WebSite` JSON-LD.
- Done: add global `NewsMediaOrganization` JSON-LD.
- Done: add `Article` / `NewsArticle` JSON-LD to article and news pages.
- Done: add `Article` JSON-LD to interview, guide, tips, flipper, and visual story pages.
- Done: add `ImageObject` JSON-LD to photo-of-the-day pages.
- Done: add `Event` JSON-LD to event pages.
- Add `BreadcrumbList` once breadcrumbs are implemented.

### Phase 4: Internal Linking

- Add breadcrumbs to content pages.
- Strengthen related-content modules.
- Add section links and tag/category links where editorially useful.
- Build tag/category landing pages if content volume justifies them.

### Phase 5: Brand And Authority

- Make brand naming consistent across the site.
- Improve About page positioning.
- Link official social profiles to the website.
- Encourage external mentions and backlinks using the same brand name.
- Monitor branded queries in Search Console.

## Definition Of Done

The SEO foundation is in good shape when:

- The generated sitemap contains all important public content URLs.
- The sitemap no longer contains demo/internal pages.
- Important pages have unique titles and descriptions.
- Article pages have valid JSON-LD.
- Google Search Console can discover dynamic content URLs from sitemap.
- Important content is reachable through internal links.
- Brand name and publisher identity are consistent across metadata, content, schema, and external profiles.
