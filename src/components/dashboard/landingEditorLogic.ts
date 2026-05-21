import { editorialPlacementsApi } from "@/lib/api/api";
import type { UiStore } from "@/stores/uiStore";

declare const Alpine: any;

interface ContentOption {
  id: string;
  title: string;
}

interface LandingEditorInitialState {
  apiBaseUrl: string;
  newsOptions: ContentOption[];
  initialNewsRail: {
    mode: "empty" | "auto-latest" | "manual";
    limit: number;
    ids: string[];
  };
  eventOptions: ContentOption[];
  initialEventCard: {
    mode: "empty" | "auto-nearest" | "manual";
    id: string;
  };
  interviewOptions: ContentOption[];
  initialCultureInterview: {
    mode: "empty" | "auto-latest" | "manual";
    id: string;
  };
}

export default (initialState: LandingEditorInitialState) => ({
  newsOptions: initialState.newsOptions ?? [],
  newsRailMode: initialState.initialNewsRail?.mode ?? "auto-latest",
  newsRailLimit: initialState.initialNewsRail?.limit ?? 4,
  selectedNewsIds: [...(initialState.initialNewsRail?.ids ?? [])],
  newsSaving: false,
  newsError: "",

  eventOptions: initialState.eventOptions ?? [],
  eventCardMode: initialState.initialEventCard?.mode ?? "auto-nearest",
  selectedEventId: initialState.initialEventCard?.id ?? "",
  eventSaving: false,
  eventError: "",

  interviewOptions: initialState.interviewOptions ?? [],
  cultureInterviewMode: initialState.initialCultureInterview?.mode ?? "auto-latest",
  selectedInterviewId: initialState.initialCultureInterview?.id ?? "",
  cultureInterviewSaving: false,
  cultureInterviewError: "",

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

  async saveEventCard() {
    this.eventSaving = true;
    this.eventError = "";

    try {
      let eventCard: unknown = null;

      if (this.eventCardMode === "auto-nearest") {
        eventCard = { mode: "auto-nearest" };
      }

      if (this.eventCardMode === "manual") {
        if (!this.selectedEventId) {
          throw new Error("Для ручного режима выбери событие.");
        }
        eventCard = { mode: "manual", id: this.selectedEventId };
      }

      await editorialPlacementsApi.updateLanding({ eventCard });

      this.notify("Event card landing обновлён.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save event card", error);
      this.eventError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить event card.";
      this.notify(this.eventError, "error");
    } finally {
      this.eventSaving = false;
    }
  },

  async saveCultureInterview() {
    this.cultureInterviewSaving = true;
    this.cultureInterviewError = "";

    try {
      let cultureInterviewBlock: unknown = null;

      if (this.cultureInterviewMode === "auto-latest") {
        cultureInterviewBlock = { mode: "auto-latest" };
      }

      if (this.cultureInterviewMode === "manual") {
        if (!this.selectedInterviewId) {
          throw new Error("Для ручного режима выбери интервью.");
        }
        cultureInterviewBlock = { mode: "manual", id: this.selectedInterviewId };
      }

      await editorialPlacementsApi.updateLanding({ cultureInterviewBlock });

      this.notify("Culture interview block landing обновлён.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save culture interview", error);
      this.cultureInterviewError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить culture interview block.";
      this.notify(this.cultureInterviewError, "error");
    } finally {
      this.cultureInterviewSaving = false;
    }
  },
});
