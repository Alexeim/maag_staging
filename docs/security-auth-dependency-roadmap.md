# MAAG: roadmap по security, auth, hosting и зависимостям

Последний review: 2026-09-01

## Прогресс (обновлено 2026-09-01)

Сделано и задеплоено на прод (BE + FE green):

- **`requireAdmin` middleware** в `server/src/middleware/auth.ts` — проверяет Firebase ID
  token через `verifyIdToken` + роль `admin` из Firestore `users/{uid}`. Без токена → 401,
  не-админ → 403.
- **Все editorial write-роуты закрыты** `requireAdmin` на `POST` / `PUT` / `PATCH` / `DELETE`:
  articles, news, events, flippers, interviews, authors, addresses, guides, visual-stories,
  content-collections, photos-of-the-day, editorial-placements. `GET` везде оставлен
  публичным — публичные страницы не задеты.
- **Фронт шлёт токен автоматически.** У `request()` в `src/lib/api/api.ts` появился
  `setAuthTokenProvider`; браузерный entrypoint регистрирует `getIdToken`, поэтому все
  `*Api` write-вызовы несут токен без правок в каждом creator-логе. Списки, которые удаляют
  через голый `fetch`, дописаны вручную (заголовок `Authorization`).
- **`GET /api/test-firebase` удалён** вместе со скриптом `server/src/test-firebase-direct.ts`
  и npm-скриптом `test:firebase`. Это был неаутентифицированный дамп первых 5 юзеров с email
  (Firebase Admin SDK connection check из сентября 2025, забытый в проде).

Проверено `curl` на проде: все write без токена → 401, все `GET` → 200, `/api/test-firebase` → 404.

Коммиты: `de7f18fc`, `d43f729b`, `16546574`, `6a402f4a`.

### Ещё НЕ сделано из Phase 1

- **Astro dashboard guard** (`src/middleware.ts`) всё ещё закомментирован. Защита теперь на
  уровне API, но сами страницы `/dashboard/**` на уровне SSR не закрыты.
- **Cookie `session` → `__session`** не переименована. Нюанс Firebase Hosting rewrite всё ещё открыт.

### Новые находки этой сессии

- **Firebase Storage.** Правил нет в репозитории. Проверка анонимным `curl` на проде:
  запись → `403 Permission denied` (заблокировано), но `LIST /o` и чтение файлов —
  **полностью открыты** (виден весь инвентарь бакета). Правило записи, вероятно,
  `allow write: if request.auth != null`, то есть писать может любой залогиненный
  пользователь, не только admin — надо проверить. Загрузка картинок идёт с клиента напрямую
  в Storage, мимо Express, поэтому `requireAdmin` её не трогает — единственная граница там
  это Storage Rules.
- **Stripe `POST /stripe/create-portal-session`** берёт `customerId` из тела запроса без
  auth → IDOR: можно открыть биллинг-портал чужого клиента. `create-checkout-session`
  так же берёт `userId` из тела.
- **`GET /api/dashboard/overview`** не закрыт (это чтение — счётчики и черновики дашборда).
- **`articlesApi.del`** в `src/components/article/creatorLogic.ts:1730` — такого метода нет
  (есть `delete`), удаление из редактора обычных статей сломано независимо от auth.

## Контекст проекта

MAAG сейчас состоит из двух Node-сервисов:

- Frontend: Astro server output, деплоится в Cloud Run как `maag-frontend`.
- Backend: Express API, деплоится в Cloud Run как `maag-api`.

Firebase Hosting сейчас работает не как static hosting, а как входной слой:

- `firebase.json` переписывает все запросы на Cloud Run service `maag-frontend` в регионе `europe-west9`.
- Это хорошая база для HttpOnly cookies, потому что запросы проходят через Astro server runtime, а значит `src/middleware.ts` может проверять cookie до рендера dashboard-страниц.
- Важный Firebase Hosting нюанс: при rewrites на Cloud Run / Functions обычные cookies обычно не прокидываются до приложения. Firebase Hosting пропускает специальную cookie с именем `__session`. Поэтому session cookie для Astro SSR через Firebase Hosting должна называться `__session`, а не произвольное `session`.

Firebase всё ещё используется для:

- client-side login/signup через Firebase Auth;
- Firestore / Storage;
- Firebase Admin SDK на backend;
- создания и проверки Firebase session cookies.

Важная специфика текущего риска: на сайте нет намеренно публичных write/input entrypoints, кроме login/signup/profile-like flows. Основная write-поверхность — dashboard/editorial API. Поэтому главный риск сейчас не сам `npm audit`, а то, чтобы dashboard и editorial backend routes были закрыты server-side auth.

## Текущая архитектура

### Frontend

- `astro.config.mjs` использует `output: "server"`.
- Astro adapter: `@astrojs/node`, `mode: "middleware"`.
- Frontend Dockerfile:
  - ставит зависимости через `npm ci`;
  - собирает Astro через `npm run build`;
  - выполняет `npm prune --omit=dev`;
  - копирует `dist`, `node_modules`, `package.json`, `server.mjs` в runtime image.
- `cloudbuild.yaml` собирает image `gcr.io/maag-60419/maag-frontend:latest`.
- `deploy.sh` деплоит `maag-frontend` в Cloud Run с `--allow-unauthenticated`.

### Frontend auth / Astro middleware

- `src/pages/api/session.ts` принимает Firebase ID token, вызывает backend auth bridge и ставит cookie `session`.
- Текущее имя cookie — `session`. Для работы через Firebase Hosting rewrite его нужно заменить на `__session`, иначе Firebase Hosting может не передать cookie до Cloud Run/Astro.
- Cookie уже настроена правильно по базовым флагам:
  - `httpOnly: true`
  - `secure: true`
  - `sameSite: "lax"`
  - `path: "/"`
- `src/middleware.ts` читает cookie `session` и вызывает `authSessionApi.verify`.
- После перехода на Firebase Hosting-compatible cookie middleware должен читать `__session`.
- Если session валидна, middleware кладёт в `context.locals.user` объект `{ uid, email, role }`.
- Dashboard guard в middleware уже есть концептуально, но сейчас закомментирован.

### Backend

- Backend Dockerfile:
  - ставит зависимости через `npm ci`;
  - компилирует TypeScript через `npm run build`;
  - выполняет `npm prune --omit=dev`;
  - запускает приложение через `npm start`.
- `server/deploy.sh` деплоит `maag-api` в Cloud Run с `--allow-unauthenticated`.
- Secrets передаются через Secret Manager:
  - `FIREBASE_CONFIG_JSON`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- `server/src/index.ts` монтирует public, editorial, auth, dashboard, user и Stripe routes.
- Сейчас `cors()` открыт без allowlist.

### Backend auth

- `server/src/controllers/authController.ts` создаёт Firebase Admin session cookie из Firebase ID token.
- `verifySession` проверяет session cookie через `getAuth().verifySessionCookie(sessionCookie, true)` и возвращает роль из Firestore `users/{uid}`.
- `server/src/middleware/auth.ts` проверяет Firebase ID token из `Authorization: Bearer ...`.
- ~~Большинство editorial CRUD routes сейчас не закрыты backend auth middleware.~~
  **Обновление 2026-09-01:** добавлен `requireAdmin` (Bearer token + роль `admin` из Firestore),
  повешен на `POST/PUT/PATCH/DELETE` всех editorial route-групп. `requireAuth` по-прежнему на `userRoutes`.

## Review деплоя

Моя оценка: направление деплоя хорошее, но это ещё стадия before production hardening.

Что уже сделано хорошо:

- Firebase Hosting rewrite на Cloud Run frontend — правильная база для HttpOnly cookies.
- Astro server output даёт возможность защищать dashboard на уровне SSR/middleware.
- Backend secrets лежат в Secret Manager, а не в Docker image.
- Multi-stage Docker build используется и на FE, и на BE.
- `npm prune --omit=dev` после build уменьшает runtime dependency surface.

### Hosting / performance conclusion

Текущий вывод: не стоит мигрировать с Firebase Hosting на direct Cloud Run только ради скорости.

Проверка `curl` показала:

- `maagfrance.fr` идёт на Firebase Hosting / Google Frontend;
- `www.maagfrance.fr` идёт через `maag-60419.web.app`;
- direct Cloud Run frontend URL не быстрее custom domain через Firebase Hosting;
- первый hit был медленный на обоих путях, около 5-6 секунд TTFB;
- повторные warm hits были около 0.65-0.75 секунды TTFB.

Интерпретация:

- проблема больше похожа на Cloud Run cold start или медленный Astro SSR/data fetching;
- Firebase Hosting rewrite сам по себе не выглядит главным bottleneck;
- Firebase Hosting остаётся полезным edge/TLS/custom-domain слоем;
- для HttpOnly cookies через Firebase Hosting нужно использовать `__session`.

Рекомендованное направление:

- оставить схему `maagfrance.fr -> Firebase Hosting -> Cloud Run frontend`;
- не делать direct Cloud Run migration как performance fix;
- включить Cloud Run `min instances = 1` для frontend, если нужно убрать холодные старты;
- после этого профилировать landing SSR и backend/public API queries;
- рассмотреть cache headers для public landing/API responses, но не кешировать authenticated/dashboard responses.

Что нужно улучшить:

### `--allow-unauthenticated`

Сейчас оба сервиса деплоятся с `--allow-unauthenticated`.

Это нормально для public frontend. Для backend это тоже допустимо, если приложение само строго защищает приватные routes.

Текущий риск:

- Cloud Run пропускает внешний запрос до Express.
- Express обязан отклонять приватные dashboard/editorial writes.
- Сейчас editorial CRUD routes в основном смонтированы без `requireAuth` / `requireAdmin`.

Решение:

- Оставить public read endpoints публичными.
- Закрыть editorial CRUD routes backend middleware.
- Позже можно рассмотреть private backend + service-to-service auth от frontend server, но это уже более сложная архитектура.

### CORS

Сейчас в `server/src/index.ts` стоит:

```ts
app.use(cors());
```

Это слишком открыто для production.

Целевое состояние:

- allowlist origin:
  - `https://maagfrance.fr`
  - Firebase Hosting домен, если он нужен;
  - Cloud Run frontend URL, если он остаётся user-facing;
  - локальные dev origins.
- Если backend будет принимать cookies cross-origin, включить `credentials: true`.
- Не использовать wildcard origin вместе с credentials.

### Image tags

Frontend сейчас собирается как:

```text
gcr.io/maag-60419/maag-frontend:latest
```

`latest` удобен, но плох для rollback/debug.

Лучше:

- тегать image commit SHA;
- деплоить конкретный immutable tag;
- `latest` можно оставить как дополнительный tag, но не как единственный источник истины.

Пример целевого направления:

```text
gcr.io/maag-60419/maag-frontend:$COMMIT_SHA
gcr.io/maag-60419/maag-api:$COMMIT_SHA
```

### Cloud Build args

В `cloudbuild.yaml` есть публичные Firebase build args. Это не secrets, потому что Firebase web config публичен по природе.

Но операционно лучше:

- вынести env-specific значения в Cloud Build substitutions;
- явно различать staging/prod config;
- не править YAML каждый раз при смене окружения.

Отдельный найденный момент:

- `cloudbuild.yaml` передаёт `--build-arg=STRIPE_PUBLISHABLE_KEY=...`;
- в frontend `Dockerfile` нет `ARG STRIPE_PUBLISHABLE_KEY`;
- по коду не найдено использование `STRIPE_PUBLISHABLE_KEY` / `PUBLIC_STRIPE_*`.

Вывод:

- это похоже на мёртвый build arg;
- ключ publishable, не secret, но он путает конфиг;
- его стоит удалить или правильно подключить как `PUBLIC_STRIPE_PUBLISHABLE_KEY`, если frontend реально должен его использовать.

### Node Alpine и native dependencies

Оба Dockerfile используют `node:24-alpine`.

Это работает сейчас, поэтому срочно менять не надо.

Но с native packages вроде:

- `sharp`
- `re2`
- `esbuild`

Alpine иногда может быть капризнее из-за musl libc и native binary/build нюансов.

Если появятся странные runtime/build проблемы после dependency upgrades, первый кандидат для проверки — переход на `node:24-slim`.

### Public debug endpoint — ✅ сделано (2026-09-01)

Был `GET /api/test-firebase` в `server/src/index.ts`, вызывал `auth.listUsers(5)` и отдавал
email'ы юзеров без auth. Удалён вместе со скриптом `server/src/test-firebase-direct.ts`,
npm-скриптом `test:firebase` и ставшим лишним импортом `getAuth` в `index.ts`.
Проверено на проде: `GET /api/test-firebase` → 404.

## Dependency audit summary

Аудит выполнялся read-only. Файлы не менялись.

Команды, которые использовались:

- `npm audit --json` в корне frontend;
- `npm audit --omit=dev --json` в корне frontend;
- `npm audit --json` в `server/`;
- `npm audit --omit=dev --json` в `server/`;
- `npm ls ... --depth=4`, чтобы понять, какие direct dependencies тянут vulnerable transitive packages.

### Frontend audit

Full audit:

- Total: 37
- Low: 2
- Moderate: 17
- High: 13
- Critical: 5

Production-style audit через `--omit=dev`:

- Total: 35
- Low: 2
- Moderate: 17
- High: 13
- Critical: 3

Главные источники:

- `firebase-tools@15.16.0`
- `firebase@12.3.0`
- `concurrently@9.2.1`
- `quill@2.0.3`
- Astro/build tooling transitive dependencies

Важная интерпретация:

- Значительная часть страшного FE audit output приходит из build/deploy/dev tooling, а не из browser runtime.
- Некоторые tooling-пакеты сейчас лежат в `dependencies`, поэтому `npm audit --omit=dev` всё равно считает их production surface.
- `firebase-tools` лежит в root `dependencies`; если он нужен только для deploy, его стоит убрать из runtime dependency surface.

### Backend audit

Full audit:

- Total: 25
- Low: 2
- Moderate: 11
- High: 9
- Critical: 3

Production audit через `--omit=dev`:

- Total: 21
- Low: 1
- Moderate: 11
- High: 6
- Critical: 3

Главные источники:

- `firebase-admin@13.5.0`
- `sharp@0.34.5`

Важная интерпретация:

- Backend findings важнее FE tooling findings, потому что backend реально принимает API traffic.
- Риск снижен тем, что сейчас нет публичных произвольных upload/schema/XML/protobuf entrypoints.
- Но backend route auth важнее dependency cleanup, потому что Cloud Run API публично достижим.

## Install script warnings

Deploy logs показывают предупреждения по install scripts:

- `@firebase/util`
- `protobufjs`
- `sharp`
- `esbuild`
- `re2`

Это npm supply-chain предупреждения: у пакетов есть `postinstall` / `install` scripts, но они ещё не покрыты явным `allowScripts`.

Текущая оценка:

- это не ошибка деплоя;
- пакеты ожидаемые для этого стека;
- предупреждения стоит привести к явной allow/deny policy после auth hardening.

## Практическая severity оценка

Общая оценка: medium.

Почему не emergency:

- нет широкой публичной write/input поверхности;
- public pages в основном читают published data;
- dashboard — основная write surface;
- многие FE vulnerabilities относятся к build/deploy tooling;
- Firebase web config и Stripe publishable key не являются private secrets.

Почему всё равно важно:

- dashboard guard в Astro пока выключен;
- editorial CRUD routes на backend пока не закрыты route-level auth;
- backend Cloud Run публично достижим;
- `cors()` слишком широкий;
- `firebase-admin`, `sharp`, `protobufjs`, Google Cloud packages — реальные backend runtime dependencies;
- rich text / Quill HTML требует аккуратной модели доверия.

## Roadmap

### Минимальный safe patch вместо большого рефакторинга

Это не нужно делать как complete API refactoring.

Самый безопасный первый шаг:

- оставить публичное чтение контента как есть;
- не менять структуру URL;
- не переносить сразу всё в `/api/public/**`;
- не менять deploy в этом же коммите;
- не обновлять зависимости в этом же коммите;
- закрыть только dangerous write methods на существующих editorial routes.

Практическая модель:

```ts
router.get('/', getArticles);
router.post('/', requireAdmin, createArticle);
router.get('/:id', getArticleById);
router.put('/:id', requireAdmin, updateArticle);
router.delete('/:id', requireAdmin, deleteArticle);
```

То есть:

- `GET` может остаться public, если он отдаёт только безопасные данные;
- `POST` должен требовать admin;
- `PUT` / `PATCH` должны требовать admin;
- `DELETE` должен требовать admin.

Это даёт большую часть security value маленьким diff. Большое разделение `public API` / `editorial API`, proxy через Astro, private backend и dependency cleanup можно делать позже отдельными шагами.

### Phase 0: ничего не ломать

Цель: не смешивать auth hardening, dependency upgrades и deploy refactors в один большой рискованный коммит.

Правила:

- Не запускать `npm audit fix --force` вслепую.
- Не смешивать auth changes и major dependency upgrades.
- Делать маленькие ветки/коммиты.
- После backend changes запускать:
  - `npm run build` в `server/`;
  - auth/session/dashboard smoke tests;
  - deploy smoke check.
- После frontend middleware changes запускать:
  - `npm run build`;
  - login/logout/dashboard navigation smoke check;
  - public pages smoke check.

### Phase 1: закрыть auth boundary

Priority: highest.

Цель: dashboard и editorial writes должны быть защищены server-side, а не только UI/Alpine state.

#### 1.1 Включить Astro dashboard guard

Файл: `src/middleware.ts`

Сейчас:

- cookie проверяется;
- `locals.user` заполняется;
- dashboard redirect logic закомментирован.

Нужно:

- `/dashboard/**` требует `locals.user.role === "admin"` или явно разрешённую роль;
- invalid/expired cookie удаляется;
- unauthenticated dashboard request уходит на `/` или login route.

#### 1.2 Добавить backend auth middleware — ✅ сделано (2026-09-01)

Сделано в варианте Bearer ID token, а не session-cookie: `requireAdmin` в
`server/src/middleware/auth.ts` (`verifyIdToken` → роль из `users/{uid}` → `admin`?).
`requireSession` / `requireRole` не добавлялись — пока не нужны.

Файлы:

- `server/src/middleware/auth.ts`
- `server/src/controllers/authController.ts`
- `server/src/routes/*`

Нужно:

- добавить middleware, который читает `session` из `Cookie` header;
- проверяет через `getAuth().verifySessionCookie(sessionCookie, true)`;
- грузит роль из `users/{uid}`;
- кладёт user object в request;
- даёт middleware `requireSession`, `requireAdmin`, возможно `requireRole`.

#### 1.3 Закрыть editorial CRUD routes — ✅ сделано (2026-09-01)

`requireAdmin` повешен на `POST/PUT/PATCH/DELETE` всех групп ниже. `GET` оставлен публичным
(short-term вариант из рекомендации ниже). Фронт: `setAuthTokenProvider` в `src/lib/api/api.ts`
+ ручной заголовок в списках с `fetch`-удалением.

Закрыто:

- `/api/articles`
- `/api/news`
- `/api/events`
- `/api/flippers`
- `/api/interviews`
- `/api/authors`
- `/api/addresses`
- `/api/guides`
- `/api/visual-stories`
- `/api/editorial-placements`
- `/api/content-collections`
- `/api/photos-of-the-day`
- `/api/dashboard`

Оставить public:

- `/api/public/**`
- `/api/auth/session`
- `/api/auth/verify-session`
- Stripe webhook
- health endpoint

Отдельно решить:

- должны ли raw GET editorial endpoints быть admin-only, если public read model уже существует под `/api/public/**`.

Моя рекомендация:

- short-term: оставить существующие public `GET` routes, если они не отдают drafts/internal fields;
- обязательно закрыть все `POST` / `PUT` / `PATCH` / `DELETE` через `requireAdmin`;
- long-term: public pages читают только `/api/public/**`;
- long-term: editorial route groups становятся admin-only целиком или минимум по write methods.

#### 1.4 Решить cookie/API routing модель

Важный момент:

- Если запрос проходит через Firebase Hosting rewrite на Cloud Run frontend, cookie должна называться `__session`.
- Обычная cookie `session` может быть вырезана Firebase Hosting до того, как запрос попадёт в Astro middleware.
- cookie, поставленная frontend domain, не будет автоматически отправляться на другой Cloud Run hostname backend API.

Если frontend живёт на `maagfrance.fr`, а backend на `maag-api-...run.app`, то это разные origins/domains.

Нужно сделать в short-term:

- заменить `SESSION_COOKIE_NAME = "session"` на `SESSION_COOKIE_NAME = "__session"` в `src/pages/api/session.ts`;
- заменить чтение `session` на `__session` в `src/middleware.ts`;
- убедиться через `curl` или browser devtools, что request на `/dashboard` через Firebase Hosting/custom domain доходит до Astro с cookie;
- оставить имя `__session` задокументированным как инфраструктурное требование Firebase Hosting.

Варианты:

- проксировать protected API calls через Astro same-origin endpoints;
- завести stable same-site API domain;
- оставить direct backend calls с Firebase ID token для API, а HttpOnly cookie использовать только для SSR dashboard;
- сделать backend private и вызывать его из frontend server service-to-service.

Рекомендованное near-term направление:

- HttpOnly cookie для SSR dashboard/session;
- public browser calls продолжают ходить в `/api/public/**`;
- protected editorial writes либо идут через same-origin Astro proxy, либо остаются на Bearer ID token до полного перехода.

### Phase 2: Cloud Run / CORS hardening

Priority: high.

Сделать:

- заменить `app.use(cors())` на allowlist;
- удалить или закрыть `/api/test-firebase`;
- явно зафиксировать production/frontend origins;
- проверить Stripe webhook, чтобы raw body middleware не сломался;
- оставить Cloud Run `--allow-unauthenticated` только при условии route-level auth.

### Phase 3: dependency cleanup без force

Priority: medium после auth boundary.

#### 3.1 Backend `sharp`

Сейчас:

- `sharp@0.34.5`

Audit предлагает:

- `sharp@0.35.4`

План:

- обновить только `sharp` отдельной веткой;
- запустить backend build;
- прогнать image compression dry-run, если применимо;
- smoke test image flows.

#### 3.2 Backend `firebase-admin`

Сейчас:

- `firebase-admin@13.5.0`

Audit предлагает:

- `firebase-admin@14.3.0`

План:

- читать migration notes/changelog;
- обновлять отдельно;
- тестировать:
  - Firebase Admin init из `FIREBASE_CONFIG_JSON`;
  - `createSession`;
  - `verifySession`;
  - Firestore reads/writes;
  - Storage/image flows;
  - user profile/bookmarks.

#### 3.3 Frontend dependency placement

Кандидаты на перенос из `dependencies` в `devDependencies`:

- `firebase-tools`
- `@astrojs/check`
- `typescript`
- возможно `tailwindcss` / `@tailwindcss/vite`, если runtime их не требует.

Цель:

- уменьшить runtime image;
- уменьшить production audit noise;
- сделать `npm audit --omit=dev` честнее.

#### 3.4 Quill / rich text

Проверить:

- где Quill HTML сохраняется;
- где HTML потом рендерится публично;
- есть ли sanitization или строгая trust model;
- что будет при компрометации dashboard account.

### Phase 4: supply-chain hygiene

Сделать:

- `npm install-scripts ls` в root и `server/`;
- явно approve ожидаемые install scripts;
- не approve неожиданные scripts без review;
- держать FE и BE policy отдельно.

Ожидаемые scripts:

- `sharp`
- `esbuild`
- `protobufjs`
- `@firebase/util`
- `re2`

### Phase 5: deploy hygiene

Сделать после auth hardening:

- перейти от `latest` к immutable image tags;
- оставить Firebase Hosting -> Cloud Run frontend как основную hosting-схему, если нет отдельной причины убирать Firebase Hosting;
- рассмотреть `min instances = 1` для `maag-frontend`, чтобы убрать cold start на landing;
- профилировать Astro SSR/public landing API перед архитектурной миграцией;
- убрать мёртвый `STRIPE_PUBLISHABLE_KEY` build arg или правильно подключить его как public env;
- вынести env-specific build args в Cloud Build substitutions;
- решить, нужен ли backend как public Cloud Run service или лучше private backend + frontend server proxy;
- задокументировать staging/prod deployment flow.

### Phase 6: role model / Firestore hardening

Решить:

- какие роли реально существуют: `reader`, `author`, `admin`;
- может ли `author` редактировать только свои материалы;
- кто может publish/unpublish;
- кто может менять landing/culture/paris/calendar placements.

Правила:

- не доверять роли с клиента;
- роль грузить server-side из Firestore или custom claims;
- пользователь не должен иметь возможность обновить собственную роль;
- profile update должен проверять `req.user.uid === params.uid`, кроме admin case.

## Verification checklist

Auth:

- unauthenticated `/dashboard` redirect;
- reader не попадает в `/dashboard`;
- admin попадает в `/dashboard`;
- invalid session cookie удаляется;
- logout удаляет cookie;
- direct unauthenticated `POST /api/articles` rejected;
- direct unauthenticated `PUT /api/editorial-placements/landing` rejected;
- admin editorial write работает;
- `/api/public/**` работает без auth.

Deploy:

- frontend Cloud Run URL отвечает;
- Firebase Hosting custom domain отвечает;
- backend health/API root отвечает;
- login создаёт HttpOnly session cookie;
- Astro SSR видит `locals.user`;
- CORS пропускает только нужные origins;
- Stripe webhook сохраняет raw body поведение.

Dependencies:

- `npm run build` в root;
- `npm run build` в `server/`;
- Docker build frontend;
- Docker build backend;
- `npm audit --omit=dev` в root;
- `npm audit --omit=dev` в `server/`.

## Рекомендуемый порядок работ

1. ⬜ Включить Astro dashboard guard (`src/middleware.ts`).
2. ✅ Backend auth middleware — сделано через Bearer ID token (`requireAdmin`), а не session-cookie.
3. ✅ Закрыть editorial CRUD routes — сделано для всех групп (write methods).
4. ⬜ Ограничить CORS.
5. ✅ Удалить `/api/test-firebase` — удалён вместе со скриптом.
6. ✅ Прогнать auth smoke tests — curl на локали и на проде, зелёные.
7. ⬜ Закрыть Stripe `create-portal-session` / `create-checkout-session` (IDOR по `customerId` / `userId` из тела).
8. ⬜ Закрыть `GET /api/dashboard/overview` (`requireAdmin`).
9. ⬜ Вытащить Firestore/Storage rules в репо; проверить, что запись в Storage не `auth != null`, а admin-only; решить по открытому листингу.
10. ⬜ Переименовать cookie `session` → `__session` (`src/pages/api/session.ts`, `src/middleware.ts`).
11. ⬜ Починить `articlesApi.del` → `delete` в `src/components/article/creatorLogic.ts`.
12. ⬜ Обновить backend `sharp`.
13. ⬜ Отдельно проверить `firebase-admin@14.x`.
14. ⬜ Перенести frontend build/deploy-only tooling из production dependencies.
15. ⬜ Проверить Quill/rich-text sanitization.
16. ⬜ Настроить npm install scripts allow policy.
17. ⬜ Перейти на immutable image tags.
18. ⬜ Рассмотреть `min instances = 1` для frontend Cloud Run.
19. ⬜ Профилировать landing SSR/public API/cache headers.
20. ⬜ Повторить audit и обновить этот документ.

## Итоговая оценка

Обновление 2026-09-01: **backend auth boundary закрыт и задеплоен.** Все editorial write-роуты
требуют `requireAdmin`, публичный дамп юзеров (`/api/test-firebase`) удалён. Фронт шлёт токен.
Основной риск (аноним пишет/удаляет контент через публичный Cloud Run API, аноним читает
список юзеров) — снят.

Осталось: Astro dashboard guard, CORS allowlist, Stripe IDOR, `GET /api/dashboard/overview`,
Storage rules в репо + проверка их строгости, `__session`, и dependency-гигиена. Ничего из
этого не stop-the-line; это нормальная последовательная работа по списку выше.

После закрытия auth boundary dependency audit превращается из тревожного шума в обычную
maintenance-задачу.
