import type { Locale } from "./locales";

// AuthModal template strings. The messages authLogic.ts / navbarLogic.ts show
// in the browser are AUTH_MESSAGES below.
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

// Errors and toasts of the sign-in / sign-up / sign-out flows (browser side,
// language from documentLocale()).
export interface AuthMessages {
  enterEmailToReset: string;
  resetEmailSentTo: string;
  resetEmailFailed: string;
  googleSignInFailed: string;
  wrongCredentials: string;
  unexpectedError: string;
  passwordsMismatch: string;
  signupSucceeded: string;
  emailAlreadyUsed: string;
  weakPassword: string;
  unexpectedSignupError: string;
  signOutFailed: string;
}

export const AUTH_MESSAGES: Record<Locale, AuthMessages> = {
  ru: {
    enterEmailToReset: "Введите email чтобы сбросить пароль.",
    resetEmailSentTo: "Письмо отправлено на ",
    resetEmailFailed: "Не удалось отправить письмо. Проверьте email.",
    googleSignInFailed: "Не удалось войти через Google. Попробуйте ещё раз.",
    wrongCredentials: "Неверный email или пароль.",
    unexpectedError: "Произошла непредвиденная ошибка.",
    passwordsMismatch: "Пароли не совпадают",
    signupSucceeded: "Регистрация прошла успешно!",
    emailAlreadyUsed: "Этот email уже зарегистрирован.",
    weakPassword: "Пароль должен содержать минимум 6 символов",
    unexpectedSignupError: "Произошла непредвиденная ошибка при регистрации.",
    signOutFailed: "Не удалось выйти. Пожалуйста, попробуйте еще раз.",
  },
  fr: {
    enterEmailToReset: "Saisissez votre e-mail pour réinitialiser le mot de passe.",
    resetEmailSentTo: "E-mail envoyé à ",
    resetEmailFailed: "Impossible d'envoyer l'e-mail. Vérifiez l'adresse.",
    googleSignInFailed: "Échec de la connexion avec Google. Veuillez réessayer.",
    wrongCredentials: "E-mail ou mot de passe incorrect.",
    unexpectedError: "Une erreur inattendue s'est produite.",
    passwordsMismatch: "Les mots de passe ne correspondent pas",
    signupSucceeded: "Inscription réussie !",
    emailAlreadyUsed: "Cet e-mail est déjà utilisé.",
    weakPassword: "Le mot de passe doit contenir au moins 6 caractères",
    unexpectedSignupError: "Une erreur inattendue s'est produite lors de l'inscription.",
    signOutFailed: "Impossible de se déconnecter. Veuillez réessayer.",
  },
};
