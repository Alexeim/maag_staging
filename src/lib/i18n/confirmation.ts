import type { Locale } from "./locales";

// ConfirmationModal: its title, and the default button labels uiStore uses
// when a caller passes none.
export const CONFIRMATION_TEXT: Record<Locale, { title: string; confirm: string; cancel: string }> = {
  ru: { title: "Подтверждение", confirm: "Подтвердить", cancel: "Отмена" },
  fr: { title: "Confirmation", confirm: "Confirmer", cancel: "Annuler" },
};
