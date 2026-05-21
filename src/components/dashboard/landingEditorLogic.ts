import { editorialPlacementsApi } from "@/lib/api/api";
import type { UiStore } from "@/stores/uiStore";

declare const Alpine: any;

interface NewsOption {
  id: string;
  title: string;
}

interface LandingEditorInitialState {
  apiBaseUrl: string;
  newsOptions: NewsOption[];
  initialNewsRail: {
    mode: "empty" | "auto-latest" | "manual";
    limit: number;
    ids: string[];
  };
}

export default (initialState: LandingEditorInitialState) => ({
  newsOptions: initialState.newsOptions ?? [],
  newsRailMode: initialState.initialNewsRail?.mode ?? "auto-latest",
  newsRailLimit: initialState.initialNewsRail?.limit ?? 4,
  selectedNewsIds: [...(initialState.initialNewsRail?.ids ?? [])],
  newsSaving: false,
  newsError: "",

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

  isManualNewsSelected(id: string) {
    return this.selectedNewsIds.includes(id);
  },

  toggleNewsItem(id: string) {
    if (this.isManualNewsSelected(id)) {
      this.selectedNewsIds = this.selectedNewsIds.filter(
        (selectedId: string) => selectedId !== id,
      );
      return;
    }

    this.selectedNewsIds = [...this.selectedNewsIds, id];
  },

  async saveNewsRail() {
    this.newsSaving = true;
    this.newsError = "";

    try {
      let newsRail: unknown = null;

      if (this.newsRailMode === "auto-latest") {
        newsRail = {
          mode: "auto-latest",
          limit: Number(this.newsRailLimit) || 4,
        };
      }

      if (this.newsRailMode === "manual") {
        if (this.selectedNewsIds.length === 0) {
          throw new Error("Для ручного режима выбери хотя бы одну новость.");
        }

        newsRail = {
          mode: "manual",
          ids: this.selectedNewsIds,
        };
      }

      await editorialPlacementsApi.updateLanding({ newsRail });

      this.notify("Блок новостей landing обновлён.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save news rail", error);
      this.newsError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить блок новостей.";
      this.notify(this.newsError, "error");
    } finally {
      this.newsSaving = false;
    }
  },
});
