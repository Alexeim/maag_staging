# Дубли со слэшем и без — Search Console, 2026-09-29

Всё ниже проверено в этот день: на проде (`curl` по https://maagfrance.fr)
или на локальной прод-сборке. Номера строк — на момент коммита `d005f8a1`.

Статусы: ✅ проверено / сделано · ❌ открыто · ⚠️ не проверено.

---

## 1. Что пишет Google

Search Console → Page indexing → **«Duplicate, Google chose different
canonical than user»**. Валидация фикса не прошла.

- **Failed:** `https://maagfrance.fr/paris/`, `https://maagfrance.fr/news/`
- **Pending:** `/culture/`, `/interviews/`, `/guide/AurYg5f9heaj34wfrfF2`, `/cookies/`

Что это значит: Google нашёл две страницы с одинаковым содержимым, и каждая
объявляет каноническим **свой** адрес. Индексировать обе Google не будет,
поэтому одну выбрал сам, и не ту, что указали мы.

`/guide/AurYg5f9heaj34wfrfF2` сейчас отдаёт 404 в обоих вариантах (материал
удалён или снят с публикации). Из отчёта он уйдёт сам, делать с ним ничего
не нужно.

## 2. Причина

Сайт отвечает `200` по обоим вариантам адреса, и canonical каждый раз
повторяет запрошенный URL:

| URL | Статус | canonical |
|---|---|---|
| `/paris/` | 200 | `https://maagfrance.fr/paris/` |
| `/paris` | 200 | `https://maagfrance.fr/paris` |
| `/news/` | 200 | `https://maagfrance.fr/news/` |
| `/news` | 200 | `https://maagfrance.fr/news` |

- canonical берётся из пути запроса:
  [Layout.astro:50](../src/Layouts/Layout.astro#L50) —
  `canonicalPath = Astro.url.pathname`. Так же сделано в
  [VisualStoryLayout.astro:44](../src/Layouts/VisualStoryLayout.astro#L44).
- Редиректа с одной формы на другую нет нигде: ни в
  [server.mjs](../server.mjs), ни в [middleware.ts](../src/middleware.ts),
  ни в [firebase.json](../firebase.json).

Сигналы для Google противоречат друг другу:

| Источник (прод, 2026-09-29) | Адресов | Со слэшем |
|---|---|---|
| `sitemap-content.xml` (все материалы) | 274 | 0 |
| `sitemap-0.xml` (разделы) | 11 | **11** |
| внутренние ссылки на `/` | 194 | 0 |
| внутренние ссылки на `/paris` | 228 | 0 |
| внутренние ссылки на `/news/` | 61 | 0 |

Во всех ссылках на сайте адреса без слэша. Со слэшем только 11 разделов в
`sitemap-0.xml`, который генерирует `@astrojs/sitemap`. Google поверил
ссылкам и выбрал `/paris`, а `/paris/` из sitemap признал дублем.

**Решение: единая форма — без слэша.** Её уже используют все ссылки и
sitemap материалов, и её же выбрал Google.

## 3. Как устроен прод (важно для фикса)

**Firebase Hosting (CDN)** → **Cloud Run** → [server.mjs](../server.mjs)
(Express: сначала статика `dist/client`, потом Astro) → Astro
(`@astrojs/node`, `mode: "middleware"`).

- Firebase Hosting на проде подтверждается заголовками `x-served-by: cache-par-…`
  и `x-cache: HIT`.
- В `package.json` и `FRONTEND_DEPLOYMENT_GUIDE.md` нет `firebase deploy`,
  там только сборка образа и `gcloud run deploy`. `firebase.json`
  выкладывается отдельно и вручную. Поэтому редирект делаем в `server.mjs`:
  он уедет обычным деплоем.
- `export const prerender` нет ни в одном файле `src/`. Все страницы
  рендерятся по запросу.

## 4. Эксперимент: `trailingSlash: "never"` на прод-сборке

Сборка с `trailingSlash: "never"` в отдельную папку, запуск через копию
`server.mjs`, то есть та же цепочка Express → Astro, что на Cloud Run:

| Запрос | Результат |
|---|---|
| `GET /paris` | 200, canonical `https://maagfrance.fr/paris` ✅ |
| `GET /paris/` | **404** |
| `GET /news/`, `/news/?page=2`, `/about/` | **404** |
| `POST /api/session/` | 404 |

### Ловушка 1: документация обещает 301, на деле 404

Документация Astro 7.2.9
(`node_modules/astro/dist/types/public/config.d.ts:219-221`) говорит, что с
`never` в проде Astro сам отвечает 301 на адреса со слэшем. В нашей схеме
(`@astrojs/node` в режиме `middleware` внутри Express) он этого **не делает**:
адрес со слэшем не совпадает ни с одним роутом, и получается 404.

Если поменять только конфиг, все адреса со слэшем, которые Google уже знает,
начнут отдавать 404, и страницы начнут выпадать из индекса. **Редирект в
Express обязателен и должен стоять до Astro.**

### Ловушка 2: sitemap открыл бы закрытые страницы

С `never` sitemap пишет адреса без слэша. Список исключений
[astro.config.mjs:11-17](../astro.config.mjs#L11-L17) записан со слэшами
(`"/cancel/"`, `"/dashboard/"`, `"/profile/"`, `"/success/"`) и перестаёт
совпадать. В тестовом `sitemap-0.xml` появились `/cancel`, `/dashboard`,
`/profile`, `/success`. Исключения нужно переписать без слэшей.

### Попутно

- `/testpage/` есть в sitemap **сейчас**, на проде. Для не-админа это
  редирект на `/`, в sitemap ему не место.
- Страница 404 отдаёт `<link rel="canonical">` на свой же несуществующий адрес.

### Dev ⚠️

Не проверено. Astro 7 не запускает второй dev-сервер, пока работает первый
(«Dev server already running at 8080»). По документации на `/paris/` будет
страница-предупреждение, но документация уже ошиблась про прод (ловушка 1),
так что на неё не полагаемся. На практике это почти не важно: все ссылки в
коде без слэша.

## 5. План

| # | Что | Где | Статус |
|---|---|---|---|
| 1 | 301 `/путь/` → `/путь` (query сохраняется), только GET/HEAD, **до** статики и Astro. Корень `/` не трогаем. Остальные методы не редиректим: при 301 браузер превращает POST в GET. | [server.mjs](../server.mjs) | ❌ |
| 2 | `trailingSlash: "never"`; исключения sitemap без слэшей; добавить `/testpage` | [astro.config.mjs](../astro.config.mjs) | ❌ |
| 3 | Убрать canonical со страницы 404 (сначала посмотреть, как она устроена) | ⚠️ не смотрели | ❌ |
| 4 | После каждого шага повторять тест раздела 4 на прод-сборке | — | ❌ |
| 5 | После деплоя: Search Console → «Validate fix» | — | ❌ |

canonical менять не нужно: после шага 1 запрос со слэшем до Astro не дойдёт,
и `Astro.url.pathname` всегда будет без слэша.

## 6. Что это меняет

- **Читатели:** старые ссылки и закладки на `/paris/` работают, через один
  редирект.
- **SEO:** 301 передаёт «вес» адреса, дубли склеиваются. Отчёт очистится
  только после повторной валидации в Search Console, это недели.
- **Деплой:** обычный (образ + `gcloud run deploy`). Firebase не трогаем.
- **CDN:** закэшированный `200` для `/paris/` может прожить ещё несколько
  минут (`s-maxage=30, stale-while-revalidate=300` из
  [middleware.ts](../src/middleware.ts)).
- **API:** POST и остальные не-GET методы не редиректятся.

## 7. Как повторить проверку на проде

```sh
for u in /paris /paris/ /news /news/; do
  curl -s -o /dev/null -w "$u status=%{http_code} location=%{redirect_url}\n" "https://maagfrance.fr$u"
  curl -sL "https://maagfrance.fr$u" | grep -oE '<link[^>]*rel="canonical"[^>]*>'
done
curl -s https://maagfrance.fr/sitemap-0.xml | grep -oE '<loc>[^<]*</loc>'
```

Ожидаемо после фикса: адреса со слэшем отвечают `301` на вариант без слэша,
canonical везде без слэша, в `sitemap-0.xml` нет ни слэшей, ни `/testpage`,
`/dashboard`, `/profile`, `/cancel`, `/success`.
