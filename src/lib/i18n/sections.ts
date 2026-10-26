import type { Locale } from "./locales";

// Culture and Paris section pages. Page titles (h1) come from NAVBAR_TEXT,
// "Interview" from CARD_TEXT.
export interface SectionText {
  noCultureMaterials: string;
  noParisMaterials: string;
  mostRead: string;
  noSidebarMaterials: string;
  noMoreMaterials: string;
  showCard: (n: number) => string;
  readMore: string;
  notebook: string;
  photoOfTheDay: string;
}

export const SECTION_TEXT: Record<Locale, SectionText> = {
  ru: {
    noCultureMaterials: "Пока нет материалов категории «Культура».",
    noParisMaterials: "Пока нет материалов категории «Париж».",
    mostRead: "самое читаемое",
    noSidebarMaterials: "Пока нет материалов для боковой колонки.",
    noMoreMaterials: "Больше материалов пока нет.",
    showCard: (n) => `Показать карточку ${n}`,
    readMore: "Читать дальше",
    notebook: "записная книжка",
    photoOfTheDay: "Фото дня",
  },
  fr: {
    noCultureMaterials: "Pas encore d'articles dans la rubrique « Culture ».",
    noParisMaterials: "Pas encore d'articles dans la rubrique « Paris ».",
    mostRead: "les plus lus",
    noSidebarMaterials: "Pas encore d'articles pour cette colonne.",
    noMoreMaterials: "Pas d'autres articles pour le moment.",
    showCard: (n) => `Afficher la carte ${n}`,
    readMore: "Lire la suite",
    notebook: "carnet",
    photoOfTheDay: "Photo du jour",
  },
};
