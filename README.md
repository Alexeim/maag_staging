# MAAG France

Russian-language online magazine about culture and life in Paris and France:
articles, interviews, guides, news, events calendar, visual stories.

Astro (SSR) on the front, Express + Firestore on the back, both deployed to
Google Cloud Run.

## Layout

```
src/        Astro frontend — pages, components, Alpine logic
server/     Express API (its own package.json and tsconfig)
docs/       long-form documents
```

## Running it

```sh
npm install
npm run dev          # frontend and backend together
```

Frontend only: `npm run dev:frontend`. Backend only: `npm run dev:backend`.

## Checking your work

```sh
npx astro check                  # frontend
cd server && npx tsc --noEmit    # backend — do not use astro check here
```

## Deploying

```sh
npm run deploy:front
npm run deploy:back
```

See `FRONTEND_DEPLOYMENT_GUIDE.md` and `BACKEND_DEPLOYMENT_GUIDE.md`.

## Where to look next

`CLAUDE.md` — the non-obvious facts about this codebase and an index of every
document in the repo. Start there.
