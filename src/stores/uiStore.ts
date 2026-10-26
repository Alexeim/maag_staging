import { CONFIRMATION_TEXT } from '@/lib/i18n/confirmation';
import { documentLocale } from '@/lib/i18n/document';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  message: string;
  type: ToastType;
  show: boolean;
}

interface ConfirmationModal {
  message: string;
  show: boolean;
  onConfirm: () => void;
  confirmLabel: string;
  cancelLabel: string;
}

interface ConfirmationLabels {
  confirmLabel?: string;
  cancelLabel?: string;
}

// In the page's language, read on every call (the dashboard and profile pages
// are always Russian).
const defaultLabels = () => CONFIRMATION_TEXT[documentLocale()];

export interface UiStore {
  toast: Toast;
  confirmation: ConfirmationModal;
  showToast(message: string, type?: ToastType): void;
  showConfirmation(
    message: string,
    onConfirm: () => void,
    labels?: ConfirmationLabels,
  ): void;
  hideConfirmation(): void;
}

export function createUiStore(): UiStore {
  return {
    toast: {
      message: '',
      type: 'success',
      show: false,
    },
    confirmation: {
      message: '',
      show: false,
      onConfirm: () => {},
      confirmLabel: defaultLabels().confirm,
      cancelLabel: defaultLabels().cancel,
    },

    showToast(message, type = 'success') {
      this.toast.message = message;
      this.toast.type = type;
      this.toast.show = true;
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    },

    showConfirmation(message, onConfirm, labels = {}) {
      this.confirmation.message = message;
      this.confirmation.onConfirm = onConfirm;
      this.confirmation.confirmLabel = labels.confirmLabel ?? defaultLabels().confirm;
      this.confirmation.cancelLabel = labels.cancelLabel ?? defaultLabels().cancel;
      this.confirmation.show = true;
    },

    hideConfirmation() {
      this.confirmation.show = false;
      this.confirmation.message = '';
      this.confirmation.onConfirm = () => {};
      this.confirmation.confirmLabel = defaultLabels().confirm;
      this.confirmation.cancelLabel = defaultLabels().cancel;
    },
  };
}