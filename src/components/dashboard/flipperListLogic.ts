import type { UiStore } from "@/stores/uiStore";
import { deleteFlipper } from "@/lib/api/api";

declare const Alpine: any;

export default () => ({
  flippers: [],

  getUiStore(): UiStore | null {
    return Alpine.store("ui");
  },

  notify(message: string, type: "success" | "error" = "success") {
    const store = this.getUiStore();
    if (store?.showToast) {
      store.showToast(message, type);
    } else {
      window.alert(message);
    }
  },

  async confirmAndDelete(id: string) {
    try {
      await deleteFlipper(id);
      this.notify("Листалка удалена");
      this.flippers = this.flippers.filter(flipper => flipper.id !== id);
    } catch (error) {
      console.error(error);
      this.notify("Не удалось удалить листалку.", "error");
    }
  },

  handleDeleteClick(id: string, title: string) {
    if (!id) return;

    const uiStore = this.getUiStore();
    if (uiStore?.showConfirmation) {
      uiStore.showConfirmation(
        `Удалить «${title}»? Это действие необратимо.`,
        () => this.confirmAndDelete(id),
      );
    } else {
      if (confirm(`Удалить «${title}»? Это действие необратимо.`)) {
        this.confirmAndDelete(id);
      }
    }
  },
});