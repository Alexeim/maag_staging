import type { Locale } from "./locales";

// "About" page (AboutProjectContent.astro). Editorial text, translated close
// to the Russian original; it still describes the Russian-language edition
// and needs editorial adaptation for the French one. The hidden "word of the
// editor" section is the editor's personal statement and is not translated.
export interface AboutText {
  title: string;
  projectLabel: string;
  artworkAlt: string;
  lead: string;
  intro: [string, string];
  questionsLead: string;
  questions: string;
  closing: string;
  teamLabel: string;
  team: { role: string; name: string }[];
}

export const ABOUT_TEXT: Record<Locale, AboutText> = {
  ru: {
    title: "О нас",
    projectLabel: "О проекте",
    artworkAlt: "Логотип Maag на фоне рисунка Гранд-Опера",
    lead: "Maag France - ключ к Парижу, к истории и культуре великого, вечного, свободного, веселого и вкусного города.",
    intro: [
      "В Maag France о Париже говорят те, кто в нем живет и те, кто его любит. Лучшие из лучших, знатоки и профессионалы. У каждого — своя экспертиза, свой взгляд и свой Париж.",
      "В Maag France французская культура звучит на русском языке. Новости художественной жизни Парижа, репортажи, рецензии на театральные, балетные и оперные премьеры, интервью с художниками, артистами, режиссёрами, хореографами. Самое интересное в его истории и самое важное в сегодняшней моде и дизайне, ведь парижские магазины — те же музеи и галереи.",
    ],
    questionsLead: "В Maag France — есть ответы на любые вопросы о Париже.",
    questions:
      "Что смотреть прямо сейчас? На какую выставку идти, а какую можно смело пропустить — и почему? На какой спектакль нужно попасть любой ценой, кого увидеть на сцене и где поймать билет даже в последний момент? Что с наслаждением съесть и где с радостью купить. Как не потеряться с детьми и как составить маршрут так, чтобы не упустить ничего интересного — вне зависимости от того, есть ли у вас на Париж два дня или целая жизнь.",
    closing:
      "Всё главное, что происходит в парижской культуре, коротко или подробно, но так, чтобы у вас всегда был выбор. Всё самое важное и интересное. И всё из первых рук.",
    teamLabel: "Команда",
    team: [
      { role: "Редакция", name: "Мария Сидельникова" },
      { role: "CEO", name: "Алексей Макаров" },
      { role: "Дизайн", name: "Денис Ландин" },
      { role: "CTO", name: "Дмитрий Макаров" },
    ],
  },
  fr: {
    title: "Qui sommes-nous",
    projectLabel: "Le projet",
    artworkAlt: "Le logo Maag sur un dessin du Palais Garnier",
    lead: "Maag France, la clé de Paris, de l'histoire et de la culture d'une ville grande, éternelle, libre, joyeuse et gourmande.",
    intro: [
      "Chez Maag France, ce sont ceux qui vivent à Paris et ceux qui l'aiment qui en parlent. Les meilleurs, des connaisseurs et des professionnels. Chacun avec son expertise, son regard et son Paris.",
      "Chez Maag France, la culture française se raconte en russe. L'actualité de la vie artistique parisienne, des reportages, des critiques des premières de théâtre, de ballet et d'opéra, des interviews d'artistes, de comédiens, de metteurs en scène et de chorégraphes. Le plus passionnant de son histoire et l'essentiel de la mode et du design d'aujourd'hui, car les boutiques parisiennes sont aussi des musées et des galeries.",
    ],
    questionsLead: "Maag France a des réponses à toutes les questions sur Paris.",
    questions:
      "Que voir en ce moment ? Quelle exposition visiter, laquelle manquer sans regret — et pourquoi ? Quel spectacle voir à tout prix, qui applaudir sur scène et où trouver une place même à la dernière minute ? Que savourer et où faire ses achats avec plaisir. Comment ne pas se perdre avec des enfants et composer un itinéraire sans rien manquer — que vous ayez deux jours à Paris ou toute une vie.",
    closing:
      "Tout l'essentiel de la vie culturelle parisienne, en bref ou en détail, pour que vous ayez toujours le choix. Tout ce qui compte et tout ce qui passionne. Et tout de première main.",
    teamLabel: "L'équipe",
    // Latin spellings to be confirmed by the people themselves.
    team: [
      { role: "Rédaction", name: "Maria Sidelnikova" },
      { role: "CEO", name: "Alexey Makarov" },
      { role: "Design", name: "Denis Landin" },
      { role: "CTO", name: "Dmitry Makarov" },
    ],
  },
};
