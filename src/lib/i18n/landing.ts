import type { Locale } from "./locales";

// Landing page strings (MainLandingBlock + LandingBody). Section names
// (culture, paris, calendar) come from NAVBAR_TEXT.
export interface LandingText {
  news: string;
  main: string;
  noMainArticles: string;
  eventBlockEmpty: string;
  eventImageAlt: string;
  noArticlesInCategory: string;
  cultureEmptyBadge: string;
  maagChoice: string;
  maagChoiceBadge: string;
  comingSoon: string;
  showCard: (n: number) => string;
  noMoreParis: string;
}

export const LANDING_TEXT: Record<Locale, LandingText> = {
  ru: {
    news: "Новости",
    main: "Главное",
    noMainArticles: "Главных статей для отображения нет.",
    eventBlockEmpty: "Блок события сейчас пуст.",
    eventImageAlt: "Событие",
    noArticlesInCategory: "Нет статей в категории",
    cultureEmptyBadge: "Балет",
    maagChoice: "Выбор Maag",
    maagChoiceBadge: "Выбор MAAG",
    comingSoon: "Скоро появится материал",
    showCard: (n) => `Показать карточку ${n}`,
    noMoreParis: "Пока нет дополнительных материалов в разделе «Париж».",
  },
  fr: {
    news: "Actualités",
    main: "À la une",
    noMainArticles: "Aucun article à la une pour le moment.",
    eventBlockEmpty: "Aucun événement pour le moment.",
    eventImageAlt: "Événement",
    noArticlesInCategory: "Aucun article dans cette rubrique",
    cultureEmptyBadge: "Ballet",
    maagChoice: "Le choix de Maag",
    maagChoiceBadge: "Le choix de MAAG",
    comingSoon: "Bientôt un nouvel article",
    showCard: (n) => `Afficher la carte ${n}`,
    noMoreParis: "Pas encore d'autres articles dans la rubrique « Paris ».",
  },
};
