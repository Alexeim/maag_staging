import type { Locale } from "./locales";

// Fallback strings of the shared card components (used when a card gets no
// title/category) and the interview teaser.
export interface CardText {
  untitled: string;
  mostRead: string;
  notebook: string;
  firstPerson: string;
  interview: string;
  intervieweeSoon: string;
  quoteSoon: string;
  photoOf: (name: string) => string;
}

export const CARD_TEXT: Record<Locale, CardText> = {
  ru: {
    untitled: "Без названия",
    mostRead: "Самое Читаемое",
    notebook: "Записная Книжка",
    firstPerson: "от первого лица",
    interview: "Интервью",
    intervieweeSoon: "Скоро здесь будет имя",
    quoteSoon: "Скоро здесь будет интересная цитата...",
    photoOf: (name) => `Фотография ${name}`,
  },
  fr: {
    untitled: "Sans titre",
    mostRead: "Les plus lus",
    notebook: "Carnet",
    firstPerson: "à la première personne",
    interview: "Interview",
    intervieweeSoon: "Bientôt un nom ici",
    quoteSoon: "Bientôt une citation inspirante...",
    photoOf: (name) => `Photo de ${name}`,
  },
};
