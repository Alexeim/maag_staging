import {
  editorialPlacementsApi,
  type CalendarPagePlacementsResponse,
} from "@/lib/api/api";
import type { UiStore } from "@/stores/uiStore";

declare const Alpine: any;

interface EventOption {
  id: string;
  title: string;
  dateLabel: string;
}

interface CalendarEditorInitialState {
  placements: CalendarPagePlacementsResponse;
  eventOptions: EventOption[];
}

const MANUAL_LIMIT = 4;

export default (initialState: CalendarEditorInitialState) => ({
  placements: initialState.placements,
  eventOptions: initialState.eventOptions ?? [],

  mainCardsMode: initialState.placements?.mainCards ? "manual" : "empty",
  selectedMainCardIds:
    initialState.placements?.mainCards?.mode === "manual"
      ? [...initialState.placements.mainCards.ids]
      : [],
  selectedMainCardIdToAdd: "",
  mainCardsSaving: false,
  mainCardsError: "",

  secondaryCardsMode: initialState.placements?.secondaryCards
    ? initialState.placements.secondaryCards.mode
    : "empty",
  selectedSecondaryCardIds:
    initialState.placements?.secondaryCards?.mode === "manual"
      ? [...initialState.placements.secondaryCards.ids]
      : [],
  selectedSecondaryCardIdToAdd: "",
  secondaryCardsSaving: false,
  secondaryCardsError: "",

  getUiStore(): UiStore | null {
    return Alpine.store("ui");
  },

  notify(message: string, type: "success" | "error" = "success") {
    const store = this.getUiStore();
    if (store?.showToast) {
      store.showToast(message, type);
      return;
    }

    window.alert(message);
  },

  getEventTitle(id: string) {
    return this.eventOptions.find((item: EventOption) => item.id === id)?.title ?? id;
  },

  getEventDateLabel(id: string) {
    return this.eventOptions.find((item: EventOption) => item.id === id)?.dateLabel ?? "";
  },

  getUnselectedMainEventOptions() {
    return this.eventOptions.filter(
      (item: EventOption) => !this.selectedMainCardIds.includes(item.id),
    );
  },

  getUnselectedSecondaryEventOptions() {
    return this.eventOptions.filter(
      (item: EventOption) => !this.selectedSecondaryCardIds.includes(item.id),
    );
  },

  addMainCard() {
    this.mainCardsError = "";

    if (!this.selectedMainCardIdToAdd) {
      this.mainCardsError = "Выбери событие, которое нужно добавить.";
      return;
    }

    if (this.selectedMainCardIds.includes(this.selectedMainCardIdToAdd)) {
      this.mainCardsError = "Это событие уже выбрано.";
      return;
    }

    if (this.selectedMainCardIds.length >= MANUAL_LIMIT) {
      this.mainCardsError = "Можно выбрать максимум 4 карточки.";
      return;
    }

    this.selectedMainCardIds = [
      ...this.selectedMainCardIds,
      this.selectedMainCardIdToAdd,
    ];
    this.selectedMainCardIdToAdd = "";
  },

  removeMainCard(id: string) {
    this.mainCardsError = "";
    this.selectedMainCardIds = this.selectedMainCardIds.filter(
      (selectedId: string) => selectedId !== id,
    );
  },

  moveMainCard(id: string, direction: -1 | 1) {
    this.mainCardsError = "";
    const currentIndex = this.selectedMainCardIds.indexOf(id);
    if (currentIndex < 0) {
      return;
    }

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= this.selectedMainCardIds.length) {
      return;
    }

    const nextIds = [...this.selectedMainCardIds];
    [nextIds[currentIndex], nextIds[nextIndex]] = [nextIds[nextIndex], nextIds[currentIndex]];
    this.selectedMainCardIds = nextIds;
  },

  addSecondaryCard() {
    this.secondaryCardsError = "";

    if (!this.selectedSecondaryCardIdToAdd) {
      this.secondaryCardsError = "Выбери событие, которое нужно добавить.";
      return;
    }

    if (this.selectedSecondaryCardIds.includes(this.selectedSecondaryCardIdToAdd)) {
      this.secondaryCardsError = "Это событие уже выбрано.";
      return;
    }

    if (this.selectedSecondaryCardIds.length >= MANUAL_LIMIT) {
      this.secondaryCardsError = "Можно выбрать максимум 4 карточки.";
      return;
    }

    this.selectedSecondaryCardIds = [
      ...this.selectedSecondaryCardIds,
      this.selectedSecondaryCardIdToAdd,
    ];
    this.selectedSecondaryCardIdToAdd = "";
  },

  removeSecondaryCard(id: string) {
    this.secondaryCardsError = "";
    this.selectedSecondaryCardIds = this.selectedSecondaryCardIds.filter(
      (selectedId: string) => selectedId !== id,
    );
  },

  moveSecondaryCard(id: string, direction: -1 | 1) {
    this.secondaryCardsError = "";
    const currentIndex = this.selectedSecondaryCardIds.indexOf(id);
    if (currentIndex < 0) {
      return;
    }

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= this.selectedSecondaryCardIds.length) {
      return;
    }

    const nextIds = [...this.selectedSecondaryCardIds];
    [nextIds[currentIndex], nextIds[nextIndex]] = [
      nextIds[nextIndex],
      nextIds[currentIndex],
    ];
    this.selectedSecondaryCardIds = nextIds;
  },

  async saveMainCards() {
    this.mainCardsSaving = true;
    this.mainCardsError = "";

    try {
      let mainCards: unknown = null;

      if (this.mainCardsMode === "manual") {
        if (this.selectedMainCardIds.length === 0) {
          throw new Error("Для ручного режима выбери хотя бы одно событие.");
        }

        mainCards = {
          mode: "manual",
          ids: this.selectedMainCardIds,
        };
      }

      await editorialPlacementsApi.updateCalendarPage({ mainCards });

      this.notify("Верхний блок календаря обновлён.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save main cards", error);
      this.mainCardsError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить верхний блок календаря.";
      this.notify(this.mainCardsError, "error");
    } finally {
      this.mainCardsSaving = false;
    }
  },

  async saveSecondaryCards() {
    this.secondaryCardsSaving = true;
    this.secondaryCardsError = "";

    try {
      let secondaryCards: unknown = null;

      if (this.secondaryCardsMode === "manual") {
        if (this.selectedSecondaryCardIds.length === 0) {
          throw new Error("Для ручного режима выбери хотя бы одно событие.");
        }

        secondaryCards = {
          mode: "manual",
          ids: this.selectedSecondaryCardIds,
        };
      }

      if (this.secondaryCardsMode === "auto-current-week-single-day-priority") {
        secondaryCards = {
          mode: "auto-current-week-single-day-priority",
          limit: MANUAL_LIMIT,
        };
      }

      await editorialPlacementsApi.updateCalendarPage({ secondaryCards });

      this.notify("Нижний блок календаря обновлён.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save secondary cards", error);
      this.secondaryCardsError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить нижний блок календаря.";
      this.notify(this.secondaryCardsError, "error");
    } finally {
      this.secondaryCardsSaving = false;
    }
  },
});
