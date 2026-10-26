import type { Locale } from "./locales";

// Calendar page (calendar.astro, CalendarWidget, EventList, FilterButtons)
// and its client logic (components/calendar/logic.ts). The filter value
// "все" is an internal marker, not a label — it is not translated.
export interface CalendarText {
  event: string;
  eventOfMonth: string;
  dateTbd: string;
  place: string;
  gateTitle: string;
  gateText: string;
  featured: string;
  previous: string;
  next: string;
  mustSee: string;
  lastChance: string;
  // Between two dates on a card ("12 … до 14 …").
  rangeTo: string;
  // "Runs until <date>", followed by a space and the date.
  until: string;
  poster: string;
  loading: string;
  previousMonth: string;
  nextMonth: string;
  weekdays: [string, string, string, string, string, string, string];
  loadingEvents: string;
  noEventsForDates: string;
  onlyTheseDates: string;
  anyDay: string;
  noneThatDayOngoing: string;
  noneThatDay: string;
  alsoThatDay: string;
  // "<n> событий" / "<n> из <m>": the words around the counters.
  eventsWord: string;
  outOf: string;
  // Client logic.
  startsAt: string;
  timeTbd: string;
  descriptionSoon: string;
  placeTbd: string;
}

export const CALENDAR_TEXT: Record<Locale, CalendarText> = {
  ru: {
    event: "Событие",
    eventOfMonth: "Событие месяца",
    dateTbd: "Дата уточняется",
    place: "Место",
    gateTitle: "Только для авторизованных",
    gateText: "Войдите в аккаунт, чтобы получить доступ к афише.",
    featured: "Главные события",
    previous: "Предыдущее",
    next: "Следующее",
    mustSee: "Обязательная программа",
    lastChance: "Последний шанс",
    rangeTo: "до",
    until: "до",
    poster: "Афиша",
    loading: "Загрузка...",
    previousMonth: "Предыдущий месяц",
    nextMonth: "Следующий месяц",
    weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    loadingEvents: "Загрузка событий...",
    noEventsForDates: "На эти даты событий не найдено.",
    onlyTheseDates: "Только в эти даты",
    anyDay: "Можно в любой день",
    noneThatDayOngoing:
      "На выбранный день отдельных событий не найдено. Ниже показаны события, которые продолжаются в эту дату. Можно также изменить дату или фильтры.",
    noneThatDay:
      "На выбранный день событий не найдено. Попробуйте выбрать другую дату или изменить фильтры.",
    alsoThatDay: "Ещё в этот день",
    eventsWord: "событий",
    outOf: "из",
    startsAt: "Начало в",
    timeTbd: "Время уточняется",
    descriptionSoon: "Описание появится позже.",
    placeTbd: "Место уточняется",
  },
  fr: {
    event: "Événement",
    eventOfMonth: "L'événement du mois",
    dateTbd: "Date à préciser",
    place: "Lieu",
    gateTitle: "Réservé aux membres",
    gateText: "Connectez-vous pour accéder à l'agenda.",
    featured: "Les événements phares",
    previous: "Précédent",
    next: "Suivant",
    mustSee: "Les incontournables",
    lastChance: "Dernière chance",
    rangeTo: "au",
    until: "jusqu'au",
    poster: "Agenda",
    loading: "Chargement...",
    previousMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    weekdays: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    loadingEvents: "Chargement des événements...",
    noEventsForDates: "Aucun événement à ces dates.",
    onlyTheseDates: "Uniquement à ces dates",
    anyDay: "Tous les jours",
    noneThatDayOngoing:
      "Aucun événement ponctuel ce jour-là. Voici les événements qui ont lieu à cette date. Vous pouvez aussi changer de date ou de filtres.",
    noneThatDay:
      "Aucun événement ce jour-là. Essayez une autre date ou modifiez les filtres.",
    alsoThatDay: "Aussi ce jour-là",
    eventsWord: "événements",
    outOf: "sur",
    startsAt: "Début à",
    timeTbd: "Horaire à préciser",
    descriptionSoon: "Description à venir.",
    placeTbd: "Lieu à préciser",
  },
};
