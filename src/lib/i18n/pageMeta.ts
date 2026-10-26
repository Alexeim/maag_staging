import { splitLocalePath } from "./languageSwitch";
import type { Locale } from "./locales";

// <title> and meta description of the section pages, per language. The
// Russian strings are the ones the pages had inline before. The French ones
// describe the future French edition, not the Russian-language one.
type SectionPage = "home" | "culture" | "paris" | "calendar" | "about";
interface PageMeta {
  title: string;
  description: string;
}

const SECTION_META: Record<SectionPage, Record<Locale, PageMeta>> = {
  home: {
    ru: {
      title: "MAAG France — медиа о культуре, искусстве и жизни Парижа",
      description:
        "Авторитетный русскоязычный источник информации о французской культуре и актуальных событиях во Франции. Интервью, рецензии, обзоры выставок, путеводители, афиша и авторские материалы о городе — всё необходимое, чтобы понимать Париж, открывать его новые стороны и чувствовать себя частью его культурной жизни.",
    },
    fr: {
      title: "MAAG France — culture, art et vie à Paris",
      description:
        "Un média indépendant sur la culture française et l'actualité en France. Interviews, critiques, expositions, guides, agenda et articles d'auteur : tout pour comprendre Paris, découvrir ses nouveaux visages et prendre part à sa vie culturelle.",
    },
  },
  culture: {
    ru: {
      title: "Культура в Париже — MAAG France",
      description:
        "Выставки, театр, музыка, книги, кино и культурные события Парижа на русском языке. Редакционные подборки, интервью и гиды MAAG France.",
    },
    fr: {
      title: "Culture à Paris — MAAG France",
      description:
        "Expositions, théâtre, musique, livres, cinéma et événements culturels à Paris. Sélections de la rédaction, interviews et guides MAAG France.",
    },
  },
  paris: {
    ru: {
      title: "Париж — гиды, места и жизнь в городе | MAAG France",
      description:
        "Авторские материалы о Париже: районы, маршруты, места, события, городская жизнь и практические гиды для русскоязычных жителей и гостей Франции.",
    },
    fr: {
      title: "Paris — guides, lieux et vie en ville | MAAG France",
      description:
        "Articles d'auteur sur Paris : quartiers, itinéraires, lieux, événements, vie urbaine et guides pratiques pour les habitants et les visiteurs.",
    },
  },
  calendar: {
    ru: {
      title: "Афиша Парижа — события и календарь | MAAG France",
      description:
        "Календарь событий в Париже: выставки, концерты, спектакли, встречи и культурные мероприятия на русском языке.",
    },
    fr: {
      title: "Agenda de Paris — événements et calendrier | MAAG France",
      description:
        "Le calendrier des événements à Paris : expositions, concerts, spectacles, rencontres et rendez-vous culturels.",
    },
  },
  about: {
    ru: {
      title: "О проекте — MAAG France",
      description:
        "MAAG France — русскоязычное медиа о культуре, Париже и жизни во Франции. Рассказываем о событиях, людях, местах и идеях.",
    },
    fr: {
      title: "À propos — MAAG France",
      description:
        "MAAG France est un média sur la culture, Paris et la vie en France. Nous racontons les événements, les personnes, les lieux et les idées.",
    },
  },
};

// Pass Astro.originPathname: under the French site the page is reached
// through a rewrite, and only the original address carries the language.
export const getSectionMeta = (page: SectionPage, originPathname: string): PageMeta =>
  SECTION_META[page][splitLocalePath(originPathname).locale];
