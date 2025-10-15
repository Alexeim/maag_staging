import type { Alpine } from 'alpinejs';

interface Toast {
  message: string;
  type: 'success' | 'error';
  show: boolean;
}

interface ConfirmationModal {
  message: string;
  show: boolean;
  onConfirm: () => void;
}

export interface UiStore {
  toast: Toast;
  confirmation: ConfirmationModal;
  showToast(message: string, type?: 'success' | 'error'): void;
  showConfirmation(message: string, onConfirm: () => void): void;
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
    },

    showToast(message, type = 'success') {
      this.toast.message = message;
      this.toast.type = type;
      this.toast.show = true;
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    },

    showConfirmation(message, onConfirm) {
      this.confirmation.message = message;
      this.confirmation.onConfirm = onConfirm;
      this.confirmation.show = true;
    },

    hideConfirmation() {
      this.confirmation.show = false;
      this.confirmation.message = '';
      this.confirmation.onConfirm = () => {};
    },
  };
}