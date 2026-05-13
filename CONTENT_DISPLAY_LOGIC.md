# Логика Отображения Контента

Этот документ описывает, как контент распределяется между главной страницей, категорийными блоками на главной и отдельными страницами `culture` / `paris`.

Документ описывает только display logic:
- `isOnLanding`
- `isMainInCategory`
- `isHotContent`
- тип контента
- категория
- сортировка по дате

Документ не описывает transitions, routing или анимации.

## Основные Флаги

| Флаг | Где влияет | Что означает |
|---|---|---|
| `isOnLanding` | Главный hero на главной и исключение из категорийных блоков на главной | Даёт материалу приоритет в главной landing-зоне; материалы с этим флагом исключаются из блоков `culture` / `paris` на главной |
| `isMainInCategory` | Выбор hero внутри категории на главной и на отдельных страницах категорий | Делает материал главным внутри своей категории |
| `isHotContent` | Боковые hot-content подборки и списки hot content | Уводит материал в hot-content пулы вместо обычного категорийного пула |

## Главный Hero На Главной

Источник: [src/components/common/MainLandingBlock.astro](/Users/dimitrimakarov/Dev/maag_staging/src/components/common/MainLandingBlock.astro:108)

### Какой контент вообще может сюда попасть

Только:
- `article`
- `guide`

Сюда не попадают:
- `flipper`
- `interview`
- `visual-story`

### Логика выбора

Hero выбирается так:

1. Первый материал с `isOnLanding`
2. Если такого нет, первый fallback-материал, который:
   - не `news`
   - не `hotContent`
   - не из категории `culture`
   - не из категории `paris`

Ссылка: [src/components/common/MainLandingBlock.astro](/Users/dimitrimakarov/Dev/maag_staging/src/components/common/MainLandingBlock.astro:133)

### Важный нюанс

Fallback-логика использует `.find(...)` без явной сортировки прямо перед выбором.

Это значит, что fallback-поведение не равно "спуститься на следующий визуальный слот ниже".
Это значит "вернуться в общий подходящий пул и взять первый материал, который сейчас первым подходит в исходных массивах".

## Категорийные Блоки На Главной

Источник: [src/components/common/LandingBody.astro](/Users/dimitrimakarov/Dev/maag_staging/src/components/common/LandingBody.astro:253)

### Общая подготовка данных

`LandingBody` собирает единый список контента и сортирует его по `createdAt` по убыванию.

Это значит, что категорийные блоки на главной чувствительны к дате публикации.

Ссылка: [src/components/common/LandingBody.astro](/Users/dimitrimakarov/Dev/maag_staging/src/components/common/LandingBody.astro:244)

### Блок `culture` на главной

В `cultureItems` попадают материалы, у которых:
- категория `culture`
- не `isHotContent`
- не `isNews`
- не `isOnLanding`

Ссылка: [src/components/common/LandingBody.astro](/Users/dimitrimakarov/Dev/maag_staging/src/components/common/LandingBody.astro:253)

Выбор hero:
- первый материал с `isMainInCategory`
- иначе первый материал из `cultureItems`

Ссылка: [src/components/common/LandingBody.astro](/Users/dimitrimakarov/Dev/maag_staging/src/components/common/LandingBody.astro:313)

Что идёт дальше:
- следующие 3 материала попадают в карточки под hero

Ссылка: [src/components/common/LandingBody.astro](/Users/dimitrimakarov/Dev/maag_staging/src/components/common/LandingBody.astro:318)

### Блок `paris` на главной

В `parisItems` попадают материалы, у которых:
- категория `paris`
- не `isHotContent`
- не `isNews`
- не `isOnLanding`

Ссылка: [src/components/common/LandingBody.astro](/Users/dimitrimakarov/Dev/maag_staging/src/components/common/LandingBody.astro:261)

Выбор hero:
- первый материал с `isMainInCategory`
- иначе первый материал из `parisItems`

Ссылка: [src/components/common/LandingBody.astro](/Users/dimitrimakarov/Dev/maag_staging/src/components/common/LandingBody.astro:322)

Что идёт дальше:
- следующие 3 материала попадают в карточки под hero

Ссылка: [src/components/common/LandingBody.astro](/Users/dimitrimakarov/Dev/maag_staging/src/components/common/LandingBody.astro:327)

## Hot Content На Главной

Источник: [src/components/common/LandingBody.astro](/Users/dimitrimakarov/Dev/maag_staging/src/components/common/LandingBody.astro:273)

Боковая hot-content подборка на главной строится из материалов, которые считаются landing hot content.

Это отдельный пул относительно обычного категорийного контента.

Следствие:
- если материал помечен как `isHotContent`, он не участвует в обычном hero/карточках `culture` / `paris` на главной
- вместо этого он конкурирует за место в hot-content подборке

## Логика Страницы `culture`

Источник: [src/pages/culture.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/culture.astro:210)

### Общая подготовка данных

Страница:
1. собирает полный смешанный список контента
2. сортирует его по `createdAt` по убыванию
3. фильтрует по категории `culture`

Ссылка: [src/pages/culture.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/culture.astro:241)

### Верхний пул `topItems`

В `topItems` попадают:
- материалы категории `culture`
- не `isHotContent`
- не `interview`

Ссылка: [src/pages/culture.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/culture.astro:255)

Выбор hero:
- первый материал с `isMainInCategory`
- иначе первый материал из `topItems`

Ссылка: [src/pages/culture.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/culture.astro:259)

Верхний второй ряд:
- следующие 4 материала после hero

Ссылка: [src/pages/culture.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/culture.astro:266)

### Featured interview

После этого страница выбирает одно интервью вне уже занятых верхних слотов.

Ссылка: [src/pages/culture.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/culture.astro:272)

### Боковая hot-content колонка

После исключения hero, secondary stories и featured interview, `cultureHotContentItems` строится из материалов, которые:
- относятся к категории `culture`
- ещё не использованы
- имеют `isHotContent`

Ссылка: [src/pages/culture.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/culture.astro:283)

### Основной feed

В `cultureFeed` попадает всё остальное обычное:
- не занято hero / secondary / interview
- не занято sidebar
- не `isHotContent`

Ссылка: [src/pages/culture.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/culture.astro:294)

### Важный нюанс

Страница `culture` не использует `isOnLanding` для принятия решения о размещении.

Это значит, что снятие `isOnLanding` само по себе напрямую не меняет позицию материала на отдельной странице `culture`.

## Логика Страницы `paris`

Источник: [src/pages/paris.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/paris.astro:190)

### Общая подготовка данных

Страница:
1. собирает полный смешанный список контента
2. сортирует его по `createdAt` по убыванию
3. фильтрует по категории `paris`

Ссылка: [src/pages/paris.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/paris.astro:210)

### Верхний пул `topItems`

В `topItems` попадают:
- материалы категории `paris`
- не `isHotContent`

Ссылка: [src/pages/paris.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/paris.astro:224)

Выбор hero:
- первый материал с `isMainInCategory`
- иначе первый материал из `topItems`

Ссылка: [src/pages/paris.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/paris.astro:226)

Верхний второй ряд:
- следующие 4 материала после hero

Ссылка: [src/pages/paris.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/paris.astro:233)

### Боковая hot-content колонка

После исключения hero и secondary stories, `parisHotContentItems` строится из материалов, которые:
- ещё не использованы
- имеют `isHotContent`

Ссылка: [src/pages/paris.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/paris.astro:239)

### Основной feed

В `parisFeed` попадает всё остальное обычное:
- не занято hero / secondary
- не занято sidebar
- не `isHotContent`

Ссылка: [src/pages/paris.astro](/Users/dimitrimakarov/Dev/maag_staging/src/pages/paris.astro:247)

### Важный нюанс

Страница `paris` тоже не использует `isOnLanding` для принятия решения о размещении.

## Матрица По Типу Контента И Флагам

Предположения для таблицы ниже:
- категория материала `culture` или `paris`
- материал не `news`
- материал не `isHotContent`

| Тип | `isOnLanding` | `isMainInCategory` | Главный hero на главной | Категорийный блок на главной | Отдельная страница категории |
|---|---:|---:|---|---|---|
| `article` | `true` | `true` | Может стать главным landing hero | Исключается из категорийного блока на главной | Становится hero категории |
| `article` | `true` | `false` | Может стать главным landing hero | Исключается из категорийного блока на главной | Уходит в secondary или feed в зависимости от даты |
| `article` | `false` | `true` | Не участвует в fallback hero на главной, если категория `culture` / `paris` | Становится hero категории на главной | Становится hero категории |
| `article` | `false` | `false` | Не участвует в fallback hero на главной, если категория `culture` / `paris` | Либо становится hero по дате, либо попадает в первые 3 карточки | Уходит в secondary или feed в зависимости от даты |
| `guide` | `true` | `true/false` | Может стать главным landing hero | Исключается из категорийного блока на главной | Ведёт себя как обычный категорийный материал |
| `guide` | `false` | `true` | Не участвует в fallback hero на главной, если категория `culture` / `paris` | Становится hero категории на главной | Становится hero категории |
| `guide` | `false` | `false` | Не участвует в fallback hero на главной, если категория `culture` / `paris` | Либо становится hero по дате, либо попадает в первые 3 карточки | Уходит в secondary или feed в зависимости от даты |
| `flipper` | `true` | `true/false` | Никогда не попадает в главный landing hero | Исключается из категорийного блока на главной | Ведёт себя как обычный категорийный материал |
| `flipper` | `false` | `true` | Никогда не попадает в главный landing hero | Становится hero категории на главной | Становится hero категории |
| `flipper` | `false` | `false` | Никогда не попадает в главный landing hero | Либо становится hero по дате, либо попадает в первые 3 карточки | Уходит в secondary или feed в зависимости от даты |
| `visual-story` | `true` | `true/false` | Никогда не попадает в главный landing hero | Исключается из категорийного блока на главной | Ведёт себя как обычный категорийный материал |
| `visual-story` | `false` | `true` | Никогда не попадает в главный landing hero | Становится hero категории на главной | Становится hero категории |
| `visual-story` | `false` | `false` | Никогда не попадает в главный landing hero | Либо становится hero по дате, либо попадает в первые 3 карточки | Уходит в secondary или feed в зависимости от даты |

## Если `isHotContent = true`

| Тип | `isOnLanding` | `isMainInCategory` | Результат |
|---|---:|---:|---|
| Любой категорийный материал | любое | любое | Исключается из обычных блоков `culture` / `paris` на главной |
| Любой категорийный материал | любое | любое | Конкурирует за место в hot-content подборке на главной |
| Любой категорийный материал | любое | любое | Конкурирует за место в боковой hot-content колонке на страницах `culture` / `paris` |

## Что Реально Происходит При Снятии Флагов

| Действие | Реальный эффект |
|---|---|
| Снять `isOnLanding` | Материал не переезжает в фиксированный слот ниже, а возвращается в обычный подходящий пул своей зоны |
| Снять `isMainInCategory` | Материал перестаёт быть hero категории и снова участвует в категорийной сортировке по дате |
| Снять оба флага | Материал становится обычным категорийным материалом без приоритета на размещение |

## Практическая Формулировка Текущей Логики

Текущая система работает не так:
- "сняли флаг, и материал опустился ровно на один визуальный уровень ниже"

Текущая система работает так:
- "сняли флаг, и материал вернулся в свой подходящий пул, после чего заново распределился по категории, типу, hot-content правилам и дате"

Именно поэтому визуально может казаться, что материал "ушёл куда-то не туда" после снятия флага landing или category-main.
