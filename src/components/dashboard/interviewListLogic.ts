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
    try {
      const combined = `${this.apiBase.replace(/\/$/, "")}/${path.replace(
        /^\//,
        "",
      )}`;
      return new URL(combined).toString();
    } catch (error) {
      console.error("Invalid API base URL", error);
      return path;
    }
  },

  async confirmAndDelete(id: string) {
    try {
      const response = await fetch(this.buildApiUrl(`/api/interviews/${id}`), {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) { // 204 No Content is a success
        throw new Error(`Deletion failed with status: ${response.status}`);
      }
      this.notify("Интервью удалено");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error(error);
      this.notify("Не удалось удалить интервью. Попробуй ещё раз.", "error");
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
      console.warn("UI store is not available, deleting without confirmation.");
      this.confirmAndDelete(id);
    }
  },
});
