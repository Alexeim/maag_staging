import { editorialPlacementsApi } from "@/lib/api/api";
import type { UiStore } from "@/stores/uiStore";

declare const Alpine: any;

const ARTICLE_BUCKET_ORDER = ["culture", "paris", "tips"];

interface ContentOption {
  id: string;
  title: string;
}

interface MainHeroOption extends ContentOption {
  type: string;
  typeLabel: string;
  entityId: string;
  articleBucket?: string;
  articleBucketLabel?: string;
}

interface LandingEditorInitialState {
  apiBaseUrl: string;
  mainHeroOptions: MainHeroOption[];
  initialMainHero: {
    mode: "empty" | "manual";
    key: string;
  };
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

const getMainHeroTypeFromKey = (key: string) => {
  const separatorIndex = key.indexOf(":");
  if (separatorIndex <= 0) {
    return "";
  }

  return key.slice(0, separatorIndex);
};

const getMainHeroOptionByKey = (
  key: string,
  options: MainHeroOption[],
) => options.find((item) => item.id === key) ?? null;

export default (initialState: LandingEditorInitialState) => ({
  mainHeroOptions: initialState.mainHeroOptions ?? [],
  mainHeroMode: initialState.initialMainHero?.mode ?? "empty",
  selectedMainHeroType: getMainHeroTypeFromKey(initialState.initialMainHero?.key ?? ""),
  selectedMainHeroArticleBucket:
    getMainHeroOptionByKey(
      initialState.initialMainHero?.key ?? "",
      initialState.mainHeroOptions ?? [],
    )?.articleBucket ?? "",
  selectedMainHeroKey: initialState.initialMainHero?.key ?? "",
  mainHeroSaving: false,
  mainHeroError: "",

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

  getMainHeroTypeOptions() {
    const seenTypes = new Set<string>();

    return this.mainHeroOptions
      .filter((item: MainHeroOption) => {
        if (seenTypes.has(item.type)) {
          return false;
        }

        seenTypes.add(item.type);
        return true;
      })
      .map((item: MainHeroOption) => ({
        value: item.type,
        label: item.typeLabel,
      }));
  },

  getFilteredMainHeroOptions() {
    if (!this.selectedMainHeroType) {
      return [];
    }

    return this.mainHeroOptions.filter((item: MainHeroOption) => {
      if (item.type !== this.selectedMainHeroType) {
        return false;
      }

      if (this.selectedMainHeroType !== "article") {
        return true;
      }

      if (!this.selectedMainHeroArticleBucket) {
        return false;
      }

      return item.articleBucket === this.selectedMainHeroArticleBucket;
    });
  },

  selectMainHeroType(type: string) {
    this.selectedMainHeroType = type;
    this.mainHeroError = "";
    this.selectedMainHeroArticleBucket = "";

    const selectedItemStillAvailable = this.getFilteredMainHeroOptions().some(
      (item: MainHeroOption) => item.id === this.selectedMainHeroKey,
    );

    if (!selectedItemStillAvailable) {
      this.selectedMainHeroKey = "";
    }
  },

  getMainHeroArticleBucketOptions() {
    if (this.selectedMainHeroType !== "article") {
      return [];
    }

    const bucketMap = new Map<
      string,
      { value: string; label: string; count: number }
    >();

    this.mainHeroOptions.forEach((item: MainHeroOption) => {
      if (item.type !== "article" || !item.articleBucket || !item.articleBucketLabel) {
        return;
      }

      const existing = bucketMap.get(item.articleBucket);
      if (existing) {
        existing.count += 1;
        return;
      }

      bucketMap.set(item.articleBucket, {
        value: item.articleBucket,
        label: item.articleBucketLabel,
        count: 1,
      });
    });

    return Array.from(bucketMap.values()).sort(
      (left, right) =>
        ARTICLE_BUCKET_ORDER.indexOf(left.value) - ARTICLE_BUCKET_ORDER.indexOf(right.value),
    );
  },

  selectMainHeroArticleBucket(bucket: string) {
    this.selectedMainHeroArticleBucket = bucket;
    this.mainHeroError = "";

    const selectedItemStillAvailable = this.getFilteredMainHeroOptions().some(
      (item: MainHeroOption) => item.id === this.selectedMainHeroKey,
    );

    if (!selectedItemStillAvailable) {
      this.selectedMainHeroKey = "";
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

  async saveMainHero() {
    this.mainHeroSaving = true;
    this.mainHeroError = "";

    try {
      let mainHero: unknown = null;

      if (this.mainHeroMode === "manual") {
        if (!this.selectedMainHeroKey) {
          throw new Error("Для ручного режима выбери материал.");
        }

        const separatorIndex = this.selectedMainHeroKey.indexOf(":");
        if (separatorIndex <= 0) {
          throw new Error("Не удалось распознать выбранный материал.");
        }

        const type = this.selectedMainHeroKey.slice(0, separatorIndex);
        const id = this.selectedMainHeroKey.slice(separatorIndex + 1);

        if (!id) {
          throw new Error("Не удалось распознать идентификатор материала.");
        }

        mainHero = {
          mode: "manual",
          type,
          id,
        };
      }

      await editorialPlacementsApi.updateLanding({ mainHero });

      this.notify("Главный материал landing обновлён.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save main hero", error);
      this.mainHeroError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить главный материал landing.";
      this.notify(this.mainHeroError, "error");
    } finally {
      this.mainHeroSaving = false;
    }
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
