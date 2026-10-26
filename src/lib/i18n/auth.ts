import type { Locale } from "./locales";

// AuthModal template strings. Error messages come from authLogic.ts and are
// not localized yet.
export interface AuthText {
  loginTitle: string;
  email: string;
  password: string;
  loginSubmit: string;
  loading: string;
  noAccount: string;
  toSignup: string;
  forgotPassword: string;
  signupTitle: string;
  firstName: string;
  lastName: string;
  confirmPassword: string;
  signupSubmit: string;
  haveAccount: string;
  toLogin: string;
}

export const AUTH_TEXT: Record<Locale, AuthText> = {
  ru: {
    loginTitle: "Войти",
    email: "Почта",
    password: "Пароль",
    loginSubmit: "Войти",
    loading: "Загрузка...",
    noAccount: "Не зарегистрирован?",
    toSignup: "Тебе сюда",
    forgotPassword: "Забыл пароль?",
    signupTitle: "Зарегистрируйся",
    firstName: "Имя",
    lastName: "Фамилия",
    confirmPassword: "Подтвердить пароль",
    signupSubmit: "Регистрация",
    haveAccount: "Уже как дома?",
    toLogin: "Заходи",
  },
  fr: {
    loginTitle: "Se connecter",
    email: "E-mail",
    password: "Mot de passe",
    loginSubmit: "Se connecter",
    loading: "Chargement...",
    noAccount: "Pas encore inscrit ?",
    toSignup: "C'est par ici",
    forgotPassword: "Mot de passe oublié ?",
    signupTitle: "Créez votre compte",
    firstName: "Prénom",
    lastName: "Nom",
    confirmPassword: "Confirmer le mot de passe",
    signupSubmit: "S'inscrire",
    haveAccount: "Déjà des nôtres ?",
    toLogin: "Entrez",
  },
};
