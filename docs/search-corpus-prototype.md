# Поиск MAAG: подготовка поисковых записей

Статус на 24.11.2026: шаг 1 интеграции Algolia. Всё работает локально.
Algolia не подключена, в Firestore ничего не пишется.

## Файлы

Пути от корня репозитория `/Users/dimitrimakarov/Dev/maag_staging`.

| Файл | Назначение |
| --- | --- |
| `server/src/utils/searchCorpus.ts` | Извлекает текст из материала: блоки редактора, вложенные колонки, QA, советы, слайды, подписи. Таблица `SEARCH_SOURCES`: endpoint → коллекция Firestore → тип → маршрут. |
| `server/src/utils/searchRecords.ts` | `buildSearchRecords({ collection, id, data })`: документ → записи Algolia. Её используют и будущий обработчик изменений, и первичная загрузка. |
| `server/src/scripts/inspectSearchCorpus.ts` | Диагностика: прогоняет снимок через обе функции и печатает сводку. Ничего не пишет ни в Firestore, ни в Algolia. |
| `server/tests/searchCorpus.test.ts`, `server/tests/searchRecords.test.ts` | Тесты. |

## Правила записей

- `publicationId` = `коллекция/id документа`, например `interviews/isIJcFFd1KvEFrrBk5QC`.
  Для черновика или удалённого документа функция тоже возвращает `publicationId`,
  но не возвращает записей.
- `objectID` = `publicationId#номер фрагмента`. Одна и та же версия документа
  всегда даёт одинаковые записи.
- Размер записи — байты UTF-8 от `JSON.stringify(запись)`, не больше 10 000.
  Лимит бесплатного плана Algolia — «10 KB»; что такое KB, документация не
  уточняет, поэтому взят строгий вариант. Если не помещаются даже метаданные,
  функция бросает `SearchRecordTooLargeError`.
- Открытый материал: `title`, `tags`, `href`, `type`, технические поля,
  `introduction` (только во фрагменте 0) и `content`. Текст режется по абзацам,
  затем по словам, затем по символам.
- Закрытый материал: одна запись — `title`, `tags`, `href`, `type`, технические
  поля, у интервью ещё `interviewee` (имя стоит в шапке страницы, вне гейта).
  Лида, цитат, подписей и текста нет.

### Контракт поля `paid`

| Коллекции | Значение | Результат |
| --- | --- | --- |
| `articles`, `guides`, `interviews`, `flippers`, `visual-stories` | `true` | закрытая запись |
| те же | `false` или поля нет (старые документы) | открытая запись |
| `news`, `events`, `firstPerson`, `photosOfTheDay` | `false` или поля нет | открытая запись |
| любые | любое другое значение (`"true"`, `1`, `null`, …) или `true` в коллекции без гейта | закрытая запись + предупреждение |

## Переменные окружения сервера

Нужны для синхронизации индекса (`server/src/services/algoliaClient.ts`).
Локально лежат в `server/.env`, на Cloud Run — в Secret Manager. В git не
попадают ни сами значения, ни файлы `.env*`.

| Переменная | Что это |
| --- | --- |
| `ALGOLIA_APP_ID` | ID приложения Algolia |
| `ALGOLIA_WRITE_API_KEY` | Ключ записи, только на сервере, в браузер не отдаётся. Права: `addObject`, `deleteObject`, `browse`, `settings`, `editSettings`, ограничен одним индексом |
| `ALGOLIA_INDEX_NAME` | `maag_materials_dev` или `maag_materials_prod`; любое другое имя, включая `maag_pilot`, код отвергает |

## Как проверить

```sh
cd /Users/dimitrimakarov/Dev/maag_staging/server
npx vitest run tests/searchRecords.test.ts tests/searchCorpus.test.ts
npx tsc --noEmit && npx tsc --noEmit -p tsconfig.test.json
```

Прогон снимка ответов API (локальные файлы, без сети):

```sh
cd /Users/dimitrimakarov/Dev/maag_staging/server
npm run search:inspect -- \
  --input-dir /tmp/maag-search-prototype-input \
  --output ~/maag-search-check.json \
  --query 'Антония'
```

Новые колонки таблицы: `indexed` — материалы, давшие записи; `restricted` —
из них закрытые; `records` — число записей; `maxRecordBytes` — самая большая
запись; `recordErrors` — документы, для которых записи не построились (их
список — в поле `recordErrors` вывода). При ошибках файл всё равно пишется,
а команда завершается с кодом 1.

`/tmp` очищается системой. Если снимка там нет, вместо `--input-dir` укажи
`--api-base-url https://maag-api-953634001415.europe-west9.run.app`: скрипт
сделает девять GET-запросов к боевому API. Списки API сортируются по
`createdAt`, поэтому документы без этого поля в выборку не попадают. Первичная
загрузка (шаг 4) будет читать Firestore напрямую.

## Результат на снимке от 24.11.2026

320 опубликованных материалов → 320 проиндексированы, из них 8 закрытых,
406 записей, самая большая — 9 985 байт, ошибок и предупреждений нет.
В пилоте было 442 записи; закрытые там тоже занимали по одной записи,
поэтому разница объясняется не ими. Её причина не проверялась.

| Источник | Материалы | Закрытые | Записи | Макс. байт |
| --- | ---: | ---: | ---: | ---: |
| articles | 125 | 3 | 187 | 9 985 |
| news | 39 | 0 | 39 | 6 632 |
| events | 110 | 0 | 110 | 4 148 |
| guides | 4 | 1 | 5 | 8 772 |
| interviews | 12 | 2 | 29 | 9 939 |
| flippers | 7 | 1 | 8 | 9 887 |
| first-person | 5 | 0 | 8 | 9 871 |
| visual-stories | 5 | 1 | 7 | 9 963 |
| photos-of-the-day | 13 | 0 | 13 | 1 360 |

Запрос `--query` ищет буквальное вхождение строки в извлечённом тексте,
включая полный текст закрытых материалов. Это проверка извлечения, а не
поиск Algolia.
