import type { Locale } from "./locales";

// Footer strings. Section names (culture, paris, …) come from NAVBAR_TEXT so
// they are defined once.
export interface FooterText {
  taglineLines: [string, string];
  myAccount: string;
  signInToAccount: string;
  sections: string;
  contacts: string;
  writeToUs: string;
  allRightsReserved: string;
  privacyPolicy: string;
  termsOfUse: string;
  cookieUsage: string;
  cookieSettings: string;
}

export const FOOTER_TEXT: Record<Locale, FooterText> = {
  ru: {
    taglineLines: ["Независимое издание", "о культуре и Париже"],
    myAccount: "Личный кабинет",
    signInToAccount: "Войти в личный кабинет",
    sections: "Рубрики",
    contacts: "Контакты",
    writeToUs: "Написать нам",
    allRightsReserved: "Все права защищены.",
    privacyPolicy: "Политика конфиденциальности",
    termsOfUse: "Пользовательское соглашение",
    cookieUsage: "Использование файлов cookie",
    cookieSettings: "Настройки cookie",
  },
  fr: {
    taglineLines: ["Un média indépendant", "sur la culture et Paris"],
    myAccount: "Mon compte",
    signInToAccount: "Se connecter à mon compte",
    sections: "Rubriques",
    contacts: "Contacts",
    writeToUs: "Nous écrire",
    allRightsReserved: "Tous droits réservés.",
    privacyPolicy: "Politique de confidentialité",
    termsOfUse: "Conditions d'utilisation",
    cookieUsage: "Utilisation des cookies",
    cookieSettings: "Paramètres des cookies",
  },
};
