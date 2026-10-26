import type { Locale } from "./locales";

// Navbar strings, shared by the desktop menu (Navbar.astro) and the mobile
// menu (Layout.astro) so the two can't drift apart.
export interface NavbarText {
  culture: string;
  paris: string;
  calendar: string;
  about: string;
  signIn: string;
  signOut: string;
  openMenu: string;
}

export const NAVBAR_TEXT: Record<Locale, NavbarText> = {
  ru: {
    culture: "Культура",
    paris: "Париж",
    calendar: "Календарь",
    about: "О проекте",
    signIn: "Войти",
    signOut: "Выйти",
    openMenu: "Открыть меню",
  },
  fr: {
    culture: "Culture",
    paris: "Paris",
    calendar: "Calendrier",
    about: "À propos",
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    openMenu: "Ouvrir le menu",
  },
};
