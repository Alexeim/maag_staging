
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

const DEFAULT_CONFIRM_LABEL = 'Подтвердить';
const DEFAULT_CANCEL_LABEL = 'Отмена';

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
      confirmLabel: DEFAULT_CONFIRM_LABEL,
      cancelLabel: DEFAULT_CANCEL_LABEL,
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
      this.confirmation.confirmLabel = labels.confirmLabel ?? DEFAULT_CONFIRM_LABEL;
      this.confirmation.cancelLabel = labels.cancelLabel ?? DEFAULT_CANCEL_LABEL;
      this.confirmation.show = true;
    },

    hideConfirmation() {
      this.confirmation.show = false;
      this.confirmation.message = '';
      this.confirmation.onConfirm = () => {};
      this.confirmation.confirmLabel = DEFAULT_CONFIRM_LABEL;
      this.confirmation.cancelLabel = DEFAULT_CANCEL_LABEL;
    },
  };
}