import type { UiStore } from "@/stores/uiStore";

declare const Alpine: any;

export default (initialState: { apiBaseUrl: string }) => ({
  apiBase: initialState.apiBaseUrl,

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

  buildApiUrl(path: string) {
    const combined = `${this.apiBase.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    return new URL(combined).toString();
  },

  async confirmAndDelete(id: string) {
    try {
      const response = await fetch(this.buildApiUrl(`/api/photos-of-the-day/${id}`), {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(`Deletion failed with status: ${response.status}`);
      }
      this.notify("Фото дня удалено");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error(error);
      this.notify("Не удалось удалить. Попробуй ещё раз.", "error");
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
      this.confirmAndDelete(id);
    }
  },
});
