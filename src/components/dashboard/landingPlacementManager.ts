import {
  editorialPlacementsApi,
  type LandingMainHeroRef,
  type LandingMainHeroType,
  type LandingPlacementsResponse,
  type UpdateLandingPlacementsPayload,
} from "@/lib/api/api";

interface LandingPlacementManagerOptions {
  getEntityId(this: any): string | null;
  getMainHeroRef?: ((this: any) => LandingMainHeroRef | null) | null;
  supportsFeaturedEvent?: boolean;
  supportsFeaturedInterviewInCulture?: boolean;
}

const DEFAULT_LANDING_PLACEMENTS: LandingPlacementsResponse = {
  schemaVersion: 2,
  mainHero: null,
  newsRail: {
    mode: "auto-latest",
    limit: 4,
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

export const createLandingPlacementManager = (
  options: LandingPlacementManagerOptions,
) => ({
  landingPlacements: { ...DEFAULT_LANDING_PLACEMENTS } as LandingPlacementsResponse,
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
    const ref = options.getMainHeroRef?.call(this);
    return ref?.type ?? null;
  },

  canSetAsMainHero() {
    return Boolean(options.getMainHeroRef && this.getPlacementEntityId());
  },

  canSetAsFeaturedEvent() {
    return Boolean(options.supportsFeaturedEvent && this.getPlacementEntityId());
  },

  canSetAsFeaturedInterviewInCulture() {
    return Boolean(
      options.supportsFeaturedInterviewInCulture && this.getPlacementEntityId(),
    );
  },

  isCurrentMainHero() {
    const currentRef = this.landingPlacements.mainHero?.ref ?? null;
    const ownRef = options.getMainHeroRef?.call(this);
    return Boolean(
      currentRef &&
        ownRef &&
        currentRef.type === ownRef.type &&
        currentRef.id === ownRef.id,
    );
  },

  isCurrentFeaturedEvent() {
    const entityId = this.getPlacementEntityId();
    return Boolean(
      entityId &&
        this.landingPlacements.eventCard?.mode === "manual" &&
        this.landingPlacements.eventCard.id === entityId,
    );
  },

  isCurrentFeaturedInterviewInCulture() {
    const entityId = this.getPlacementEntityId();
    return Boolean(
      entityId &&
        this.landingPlacements.cultureInterviewBlock?.mode === "manual" &&
        this.landingPlacements.cultureInterviewBlock.id === entityId,
    );
  },

  async loadLandingPlacements() {
    this.placementLoading = true;
    this.placementError = "";

    try {
      this.landingPlacements = await editorialPlacementsApi.getLanding();
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
    const mainHeroRef = options.getMainHeroRef?.call(this);
    if (!mainHeroRef) {
      showToast("Для этого типа контента main hero недоступен.", "error");
      return;
    }

    await this.updateLandingPlacements(
      { mainHero: { mode: "manual", ref: mainHeroRef } },
      "Материал назначен главным на landing.",
    );
  },

  async clearMainHero() {
    await this.updateLandingPlacements(
      { mainHero: null },
      "Главный материал landing очищен.",
    );
  },

  async setAsFeaturedEvent() {
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

  async clearFeaturedEvent() {
    await this.updateLandingPlacements(
      { eventCard: null },
      "Блок события на landing очищен.",
    );
  },

  async setAsFeaturedInterviewInCulture() {
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

  async clearFeaturedInterviewInCulture() {
    await this.updateLandingPlacements(
      { cultureInterviewBlock: null },
      "Special block интервью в «Культуре» очищен.",
    );
  },
});
