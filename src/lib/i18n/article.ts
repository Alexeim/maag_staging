import type { Locale } from "./locales";

// Article page UI (ArticleDate, RelatedMaterialsMarquee, …). Bookmark labels
// on the article page are NOT here: they are stored with the bookmark and
// shown on the (Russian) profile page.
export interface ArticleText {
  draft: string;
  invalidDate: string;
  relatedMaterials: string;
  material: string;
  showPage: (n: number) => string;
  // Article body blocks (ArticleBody and its deliberate copy FirstPersonBody).
  tweetLoading: string;
  slide: string;
  slideN: (n: number) => string;
  previousSlide: string;
  nextSlide: string;
  showCaption: string;
  videoUnavailable: string;
}

export const ARTICLE_TEXT: Record<Locale, ArticleText> = {
  ru: {
    draft: "Черновик",
    invalidDate: "Некорректная дата",
    relatedMaterials: "Похожие материалы",
    material: "Материал",
    showPage: (n) => `Показать страницу ${n}`,
    tweetLoading: "Загрузка твита…",
    slide: "Слайд",
    slideN: (n) => `Слайд ${n}`,
    previousSlide: "Предыдущий слайд",
    nextSlide: "Следующий слайд",
    showCaption: "Показать подпись к изображению",
    videoUnavailable: "Видео недоступно или ссылка не поддерживается.",
  },
  fr: {
    draft: "Brouillon",
    invalidDate: "Date invalide",
    relatedMaterials: "À lire aussi",
    material: "Contenu",
    showPage: (n) => `Afficher la page ${n}`,
    tweetLoading: "Chargement du tweet…",
    slide: "Diapositive",
    slideN: (n) => `Diapositive ${n}`,
    previousSlide: "Diapositive précédente",
    nextSlide: "Diapositive suivante",
    showCaption: "Afficher la légende de l'image",
    videoUnavailable: "Vidéo indisponible ou lien non pris en charge.",
  },
};

// Registration gate over paid materials (MaterialRegistrationGate).
export const REGISTRATION_GATE_TEXT: Record<
  Locale,
  { region: string; title: string; text: string; cta: string; haveAccount: string; signIn: string }
> = {
  ru: {
    region: "Доступ к материалу",
    title: "Продолжить чтение",
    text: "Создайте бесплатный аккаунт, чтобы прочитать материал целиком.",
    cta: "Читать дальше",
    haveAccount: "Уже есть аккаунт?",
    signIn: "Войти",
  },
  fr: {
    region: "Accès à l'article",
    title: "Continuer la lecture",
    text: "Créez un compte gratuit pour lire l'article en entier.",
    cta: "Lire la suite",
    haveAccount: "Vous avez déjà un compte ?",
    signIn: "Se connecter",
  },
};

// Share / bookmark buttons (ContentActions + contentActionsLogic, and their
// skeleton defaults in lazyLoadPlugin). Browser side: documentLocale().
export interface ContentActionsText {
  share: string;
  sharing: string;
  bookmark: string;
  bookmarked: string;
  saving: string;
  linkCopied: string;
  shareFailed: string;
  signInToSave: string;
  bookmarkRemoved: string;
  bookmarkSaved: string;
  bookmarkFailed: string;
}

export const CONTENT_ACTIONS_TEXT: Record<Locale, ContentActionsText> = {
  ru: {
    share: "Поделиться",
    sharing: "Копируем...",
    bookmark: "В закладки",
    bookmarked: "В закладках",
    saving: "Сохраняем...",
    linkCopied: "Ссылка скопирована",
    shareFailed: "Не удалось поделиться ссылкой",
    signInToSave: "Войдите, чтобы сохранять материалы",
    bookmarkRemoved: "Материал удален из закладок",
    bookmarkSaved: "Материал сохранен",
    bookmarkFailed: "Не удалось обновить закладку",
  },
  fr: {
    share: "Partager",
    sharing: "Copie...",
    bookmark: "Enregistrer",
    bookmarked: "Enregistré",
    saving: "Enregistrement...",
    linkCopied: "Lien copié",
    shareFailed: "Impossible de partager le lien",
    signInToSave: "Connectez-vous pour enregistrer des articles",
    bookmarkRemoved: "Article retiré de vos favoris",
    bookmarkSaved: "Article enregistré",
    bookmarkFailed: "Impossible de mettre à jour le favori",
  },
};
