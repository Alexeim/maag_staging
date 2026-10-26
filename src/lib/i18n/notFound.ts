import type { Locale } from "./locales";

// 404 page.
export const NOT_FOUND_TEXT: Record<Locale, { notFound: string; wip: string; home: string }> = {
  ru: {
    notFound: "Страница не найдена",
    wip: "... этой страницы пока нет, но мы усердно работаем над ней ...",
    home: "На главную",
  },
  fr: {
    notFound: "Page introuvable",
    wip: "... cette page n'existe pas encore, mais nous y travaillons ...",
    home: "Retour à l'accueil",
  },
};
