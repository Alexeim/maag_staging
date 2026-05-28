import {
  articlesApi,
  editorialPlacementsApi,
  eventsApi,
  flippersApi,
  guidesApi,
  interviewsApi,
  type LandingMainHeroTarget,
  type LandingMainHeroType,
  type LandingPlacementsResponse,
  type UpdateLandingPlacementsPayload,
  visualStoriesApi,
} from "@/lib/api/api";

interface LandingPlacementManagerOptions {
  getEntityId(this: any): string | null;
  getMainHeroTarget?: ((this: any) => LandingMainHeroTarget | null) | null;
  supportsEventCard?: boolean;
  supportsCultureInterviewBlock?: boolean;
}

const DEFAULT_LANDING_PLACEMENTS: LandingPlacementsResponse = {
  schemaVersion: 4,
  mainHero: null,
  newsRail: {
    mode: "auto-latest",
    limit: 4,
  },
  netlenkaRail: {
    mode: "auto-latest",
    limit: 4,
  },
  cultureHero: null,
  cultureCards: {
    mode: "auto-latest",
    limit: 3,
  },
  parisHero: null,
  parisCards: {
    mode: "auto-latest",
    limit: 3,
  },
  eventCard: {
    mode: "auto-nearest",
  },
  cultureInterviewBlock: {
    mode: "auto-latest",
  },
  updatedAt: null,
  updatedBy: null,
};

const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
  window.Alpine?.store?.("ui")?.showToast?.(message, type);
};

const MAIN_HERO_TYPE_LABELS: Record<LandingMainHeroType, string> = {
  article: "Статья",
  guide: "Путеводитель",
  interview: "Интервью",
  flipper: "Листалка",
  "visual-story": "Визуальная история",
};

const loadMainHeroTitle = async (target: LandingMainHeroTarget): Promise<string | null> => {
  if (target.type === "article") {
    return (await articlesApi.getById(target.id)).title ?? null;
  }

  if (target.type === "guide") {
    return (await guidesApi.getById(target.id)).title ?? null;
  }

  if (target.type === "interview") {
    return (await interviewsApi.getById(target.id)).title ?? null;
  }

  if (target.type === "flipper") {
    return (await flippersApi.getById(target.id)).title ?? null;
  }

  if (target.type === "visual-story") {
    return (await visualStoriesApi.getById(target.id)).title ?? null;
  }

  return null;
};

export const createLandingPlacementManager = (
  options: LandingPlacementManagerOptions,
) => ({
  landingPlacements: { ...DEFAULT_LANDING_PLACEMENTS } as LandingPlacementsResponse,
  currentMainHeroTitle: "",
  currentEventCardTitle: "",
  placementLoading: false,
  placementSaving: false,
  placementError: "",

  getPlacementEntityId() {
    return options.getEntityId.call(this);
  },

  hasPlacementEntityId() {
    return Boolean(this.getPlacementEntityId());
  },

  getPlacementMainHeroType() {
    const target = options.getMainHeroTarget?.call(this);
    return target?.type ?? null;
  },

  canSetAsMainHero() {
    return Boolean(options.getMainHeroTarget && this.getPlacementEntityId());
  },

  canSetAsEventCard() {
    return Boolean(options.supportsEventCard && this.getPlacementEntityId());
  },

  canSetAsCultureInterviewBlock() {
    return Boolean(
      options.supportsCultureInterviewBlock && this.getPlacementEntityId(),
    );
  },

  isCurrentMainHero() {
    const currentMainHero = this.landingPlacements.mainHero ?? null;
    const ownTarget = options.getMainHeroTarget?.call(this);
    return Boolean(
      currentMainHero &&
        ownTarget &&
        currentMainHero.type === ownTarget.type &&
        currentMainHero.id === ownTarget.id,
    );
  },

  isCurrentEventCard() {
    const entityId = this.getPlacementEntityId();
    return Boolean(
      entityId &&
        this.landingPlacements.eventCard?.mode === "manual" &&
        this.landingPlacements.eventCard.id === entityId,
    );
  },

  isCurrentCultureInterviewBlock() {
    const entityId = this.getPlacementEntityId();
    return Boolean(
      entityId &&
        this.landingPlacements.cultureInterviewBlock?.mode === "manual" &&
        this.landingPlacements.cultureInterviewBlock.id === entityId,
    );
  },

  getCurrentMainHeroSummary() {
    const currentMainHero = this.landingPlacements.mainHero ?? null;
    if (!currentMainHero) {
      return "Сейчас главный материал не выбран.";
    }

    const typeLabel =
      MAIN_HERO_TYPE_LABELS[currentMainHero.type] ?? currentMainHero.type;
    if (this.currentMainHeroTitle) {
      return `${typeLabel}: ${this.currentMainHeroTitle}`;
    }

    return `${typeLabel}: заголовок пока не загрузился.`;
  },

  getCurrentEventCardSummary() {
    const eventCard = this.landingPlacements.eventCard ?? null;
    if (!eventCard) {
      return "Карточка события сейчас пустая.";
    }

    if (eventCard.mode === "auto-nearest") {
      return "Автоматически показывается ближайшее событие.";
    }

    if (this.currentEventCardTitle) {
      return `Вручную выбрано: ${this.currentEventCardTitle}`;
    }

    return `Вручную выбрано событие ${eventCard.id}.`;
  },

  async syncCurrentMainHeroTitle() {
    const currentMainHero = this.landingPlacements.mainHero ?? null;
    if (!currentMainHero) {
      this.currentMainHeroTitle = "";
      return;
    }

    try {
      this.currentMainHeroTitle =
        (await loadMainHeroTitle(currentMainHero)) || "Материал не найден";
    } catch (error) {
      console.error("Failed to load current main hero title:", error);
      this.currentMainHeroTitle = "Не удалось загрузить заголовок";
    }
  },

  async syncCurrentEventCardTitle() {
    const eventCard = this.landingPlacements.eventCard ?? null;
    if (!eventCard || eventCard.mode !== "manual") {
      this.currentEventCardTitle = "";
      return;
    }

    try {
      this.currentEventCardTitle =
        (await eventsApi.getById(eventCard.id)).title || "Событие не найдено";
    } catch (error) {
      console.error("Failed to load current event card title:", error);
      this.currentEventCardTitle = "Не удалось загрузить название события";
    }
  },

  async loadLandingPlacements() {
    this.placementLoading = true;
    this.placementError = "";

    try {
      this.landingPlacements = await editorialPlacementsApi.getLanding();
      await this.syncCurrentMainHeroTitle();
      await this.syncCurrentEventCardTitle();
    } catch (error) {
      console.error("Failed to load landing placements:", error);
      this.placementError =
        error instanceof Error
          ? error.message
          : "Не удалось загрузить текущие размещения landing.";
    } finally {
      this.placementLoading = false;
    }
  },

  async updateLandingPlacements(
    payload: UpdateLandingPlacementsPayload,
    successMessage: string,
  ) {
    this.placementSaving = true;
    this.placementError = "";

    try {
      this.landingPlacements = await editorialPlacementsApi.updateLanding(payload);
      await this.syncCurrentMainHeroTitle();
      await this.syncCurrentEventCardTitle();
      showToast(successMessage);
    } catch (error) {
      console.error("Failed to update landing placements:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось обновить размещение landing.";
      this.placementError = message;
      showToast(message, "error");
    } finally {
      this.placementSaving = false;
    }
  },

  async setAsMainHero() {
    const mainHeroTarget = options.getMainHeroTarget?.call(this);
    if (!mainHeroTarget) {
      showToast("Для этого типа контента main hero недоступен.", "error");
      return;
    }

    await this.updateLandingPlacements(
      {
        mainHero: {
          mode: "manual",
          type: mainHeroTarget.type,
          id: mainHeroTarget.id,
        },
      },
      "Материал назначен главным на landing.",
    );
  },

  async clearMainHero() {
    await this.updateLandingPlacements(
      { mainHero: null },
      "Главный материал landing очищен.",
    );
  },

  async setAsEventCard() {
    const entityId = this.getPlacementEntityId();
    if (!entityId) {
      showToast("Сначала сохрани событие, потом можно поставить его в slot.", "error");
      return;
    }

    await this.updateLandingPlacements(
      { eventCard: { mode: "manual", id: entityId } },
      "Событие назначено в блок «Календарь» на landing.",
    );
  },

  async clearEventCard() {
    await this.updateLandingPlacements(
      { eventCard: { mode: "auto-nearest" } },
      "Карточка события на landing переведена в автоматический режим.",
    );
  },

  async setAsCultureInterviewBlock() {
    const entityId = this.getPlacementEntityId();
    if (!entityId) {
      showToast(
        "Сначала сохрани интервью, потом можно поставить его в special block.",
        "error",
      );
      return;
    }

    await this.updateLandingPlacements(
      { cultureInterviewBlock: { mode: "manual", id: entityId } },
      "Интервью назначено в special block «Культура».",
    );
  },

  async clearCultureInterviewBlock() {
    await this.updateLandingPlacements(
      { cultureInterviewBlock: null },
      "Special block интервью в «Культуре» очищен.",
    );
  },
});
