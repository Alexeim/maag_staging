import {
  editorialPlacementsApi,
  type LandingCategoryCardsItemTarget,
  type LandingCategoryCardsSelection,
  type LandingCategoryHeroSelection,
  type LandingCultureInterviewBlockSelection,
  type LandingEventCardSelection,
  type LandingMainHeroSelection,
  type LandingMainHeroType,
  type LandingNetlenkaItemTarget,
  type LandingNetlenkaRailSelection,
  type LandingNewsRailSelection,
  type SectionPageLeSaviezVousSelection,
} from "@/lib/api/api";
import type { UiStore } from "@/stores/uiStore";

declare const Alpine: any;

const ARTICLE_BUCKET_ORDER = ["culture", "paris", "tips"];

interface ContentOption {
  id: string;
  title: string;
}

interface NetlenkaOption extends ContentOption {
  type: string;
  typeLabel: string;
}

interface CategoryCardsOption extends ContentOption {
  type: string;
  typeLabel: string;
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
  cultureHeroOptions: CategoryCardsOption[];
  initialCultureHero: {
    mode: "empty" | "manual";
    key: string;
  };
  parisHeroOptions: CategoryCardsOption[];
  initialParisHero: {
    mode: "empty" | "manual";
    key: string;
  };
  newsOptions: ContentOption[];
  initialNewsRail: {
    mode: "empty" | "auto-latest" | "manual";
    limit: number;
    ids: string[];
  };
  netlenkaOptions: NetlenkaOption[];
  initialNetlenkaRail: {
    mode: "empty" | "auto-latest" | "manual";
    limit: number;
    keys: string[];
  };
  cultureCardsOptions: CategoryCardsOption[];
  initialCultureCards: {
    mode: "empty" | "auto-latest" | "manual";
    limit: number;
    keys: string[];
  };
  parisCardsOptions: CategoryCardsOption[];
  initialParisCards: {
    mode: "empty" | "auto-latest" | "manual";
    limit: number;
    keys: string[];
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
  leSaviezVousOptions: ContentOption[];
  initialLeSaviezVous: {
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

const parseContentKey = (key: string) => {
  const separatorIndex = key.indexOf(":");
  if (separatorIndex <= 0) {
    return null;
  }

  const type = key.slice(0, separatorIndex);
  const id = key.slice(separatorIndex + 1);
  if (!id) {
    return null;
  }

  return { type, id };
};

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

  cultureHeroOptions: initialState.cultureHeroOptions ?? [],
  cultureHeroMode: initialState.initialCultureHero?.mode ?? "empty",
  selectedCultureHeroKey: initialState.initialCultureHero?.key ?? "",
  cultureHeroSaving: false,
  cultureHeroError: "",

  parisHeroOptions: initialState.parisHeroOptions ?? [],
  parisHeroMode: initialState.initialParisHero?.mode ?? "empty",
  selectedParisHeroKey: initialState.initialParisHero?.key ?? "",
  parisHeroSaving: false,
  parisHeroError: "",

  newsOptions: initialState.newsOptions ?? [],
  newsRailMode: initialState.initialNewsRail?.mode ?? "auto-latest",
  newsRailLimit: initialState.initialNewsRail?.limit ?? 4,
  selectedNewsIds: [...(initialState.initialNewsRail?.ids ?? [])],
  newsSaving: false,
  newsError: "",

  netlenkaOptions: initialState.netlenkaOptions ?? [],
  netlenkaRailMode: initialState.initialNetlenkaRail?.mode ?? "auto-latest",
  netlenkaRailLimit: initialState.initialNetlenkaRail?.limit ?? 4,
  selectedNetlenkaKeys: [...(initialState.initialNetlenkaRail?.keys ?? [])],
  netlenkaSaving: false,
  netlenkaError: "",

  cultureCardsOptions: initialState.cultureCardsOptions ?? [],
  cultureCardsMode: initialState.initialCultureCards?.mode ?? "auto-latest",
  cultureCardsLimit: initialState.initialCultureCards?.limit ?? 3,
  selectedCultureCardKeys: [...(initialState.initialCultureCards?.keys ?? [])],
  cultureCardsSaving: false,
  cultureCardsError: "",

  parisCardsOptions: initialState.parisCardsOptions ?? [],
  parisCardsMode: initialState.initialParisCards?.mode ?? "auto-latest",
  parisCardsLimit: initialState.initialParisCards?.limit ?? 3,
  selectedParisCardKeys: [...(initialState.initialParisCards?.keys ?? [])],
  parisCardsSaving: false,
  parisCardsError: "",

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

  leSaviezVousOptions: initialState.leSaviezVousOptions ?? [],
  leSaviezVousMode: initialState.initialLeSaviezVous?.mode ?? "auto-latest",
  selectedLeSaviezVousId: initialState.initialLeSaviezVous?.id ?? "",
  leSaviezVousSaving: false,
  leSaviezVousError: "",

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

  isManualNetlenkaSelected(key: string) {
    return this.selectedNetlenkaKeys.includes(key);
  },

  toggleNetlenkaItem(key: string) {
    if (this.isManualNetlenkaSelected(key)) {
      this.selectedNetlenkaKeys = this.selectedNetlenkaKeys.filter(
        (selectedKey: string) => selectedKey !== key,
      );
      return;
    }

    this.selectedNetlenkaKeys = [key, ...this.selectedNetlenkaKeys];
  },

  isManualCultureCardSelected(key: string) {
    return this.selectedCultureCardKeys.includes(key);
  },

  toggleCultureCardItem(key: string) {
    if (this.isManualCultureCardSelected(key)) {
      this.selectedCultureCardKeys = this.selectedCultureCardKeys.filter(
        (selectedKey: string) => selectedKey !== key,
      );
      return;
    }

    this.selectedCultureCardKeys = [key, ...this.selectedCultureCardKeys];
  },

  isManualParisCardSelected(key: string) {
    return this.selectedParisCardKeys.includes(key);
  },

  toggleParisCardItem(key: string) {
    if (this.isManualParisCardSelected(key)) {
      this.selectedParisCardKeys = this.selectedParisCardKeys.filter(
        (selectedKey: string) => selectedKey !== key,
      );
      return;
    }

    this.selectedParisCardKeys = [key, ...this.selectedParisCardKeys];
  },

  async saveMainHero() {
    this.mainHeroSaving = true;
    this.mainHeroError = "";

    try {
      let mainHero: LandingMainHeroSelection | null = null;

      if (this.mainHeroMode === "manual") {
        if (!this.selectedMainHeroKey) {
          throw new Error("Для ручного режима выбери материал.");
        }

        const parsedKey = parseContentKey(this.selectedMainHeroKey);
        if (!parsedKey) {
          throw new Error("Не удалось распознать выбранный материал.");
        }

        mainHero = {
          mode: "manual",
          type: parsedKey.type as LandingMainHeroType,
          id: parsedKey.id,
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

  async saveCultureHero() {
    this.cultureHeroSaving = true;
    this.cultureHeroError = "";

    try {
      let cultureHero: LandingCategoryHeroSelection | null = null;

      if (this.cultureHeroMode === "manual") {
        if (!this.selectedCultureHeroKey) {
          throw new Error("Для ручного режима выбери материал.");
        }

        const parsedKey = parseContentKey(this.selectedCultureHeroKey);
        if (!parsedKey) {
          throw new Error("Не удалось распознать выбранный материал.");
        }

        cultureHero = {
          mode: "manual",
          type: parsedKey.type as LandingCategoryHeroSelection["type"],
          id: parsedKey.id,
        };
      }

      await editorialPlacementsApi.updateLanding({ cultureHero });

      this.notify("Главный материал блока «Культура» на landing обновлён.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save culture hero", error);
      this.cultureHeroError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить главный материал блока «Культура».";
      this.notify(this.cultureHeroError, "error");
    } finally {
      this.cultureHeroSaving = false;
    }
  },

  async saveParisHero() {
    this.parisHeroSaving = true;
    this.parisHeroError = "";

    try {
      let parisHero: LandingCategoryHeroSelection | null = null;

      if (this.parisHeroMode === "manual") {
        if (!this.selectedParisHeroKey) {
          throw new Error("Для ручного режима выбери материал.");
        }

        const parsedKey = parseContentKey(this.selectedParisHeroKey);
        if (!parsedKey) {
          throw new Error("Не удалось распознать выбранный материал.");
        }

        parisHero = {
          mode: "manual",
          type: parsedKey.type as LandingCategoryHeroSelection["type"],
          id: parsedKey.id,
        };
      }

      await editorialPlacementsApi.updateLanding({ parisHero });

      this.notify("Главный материал блока «Париж» на landing обновлён.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save paris hero", error);
      this.parisHeroError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить главный материал блока «Париж».";
      this.notify(this.parisHeroError, "error");
    } finally {
      this.parisHeroSaving = false;
    }
  },

  async saveNewsRail() {
    this.newsSaving = true;
    this.newsError = "";

    try {
      let newsRail: LandingNewsRailSelection | null = null;

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

  async saveNetlenkaRail() {
    this.netlenkaSaving = true;
    this.netlenkaError = "";

    try {
      let netlenkaRail: LandingNetlenkaRailSelection | null = null;

      if (this.netlenkaRailMode === "auto-latest") {
        netlenkaRail = {
          mode: "auto-latest",
          limit: Number(this.netlenkaRailLimit) || 4,
        };
      }

      if (this.netlenkaRailMode === "manual") {
        if (this.selectedNetlenkaKeys.length === 0) {
          throw new Error("Для ручного режима выбери хотя бы один материал.");
        }

        const items = this.selectedNetlenkaKeys.map((key: string) => {
          const parsedKey = parseContentKey(key);
          if (!parsedKey) {
            throw new Error("Не удалось распознать один из выбранных материалов.");
          }

          return parsedKey;
        }) as LandingNetlenkaItemTarget[];

        netlenkaRail = {
          mode: "manual",
          items,
        };
      }

      await editorialPlacementsApi.updateLanding({ netlenkaRail });

      this.notify("Блок «Самое Читаемое» обновлён.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save netlenka rail", error);
      this.netlenkaError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить блок «Самое Читаемое».";
      this.notify(this.netlenkaError, "error");
    } finally {
      this.netlenkaSaving = false;
    }
  },

  async saveCultureCards() {
    this.cultureCardsSaving = true;
    this.cultureCardsError = "";

    try {
      let cultureCards: LandingCategoryCardsSelection | null = null;

      if (this.cultureCardsMode === "auto-latest") {
        cultureCards = {
          mode: "auto-latest",
          limit: Number(this.cultureCardsLimit) || 3,
        };
      }

      if (this.cultureCardsMode === "manual") {
        if (this.selectedCultureCardKeys.length === 0) {
          throw new Error("Для ручного режима выбери хотя бы один материал.");
        }

        const items = this.selectedCultureCardKeys.map((key: string) => {
          const parsedKey = parseContentKey(key);
          if (!parsedKey) {
            throw new Error("Не удалось распознать один из выбранных материалов.");
          }

          return parsedKey;
        }) as LandingCategoryCardsItemTarget[];

        cultureCards = {
          mode: "manual",
          items,
        };
      }

      await editorialPlacementsApi.updateLanding({ cultureCards });

      this.notify("Карточки блока «Культура» на landing обновлены.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save culture cards", error);
      this.cultureCardsError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить карточки блока «Культура».";
      this.notify(this.cultureCardsError, "error");
    } finally {
      this.cultureCardsSaving = false;
    }
  },

  async saveParisCards() {
    this.parisCardsSaving = true;
    this.parisCardsError = "";

    try {
      let parisCards: LandingCategoryCardsSelection | null = null;

      if (this.parisCardsMode === "auto-latest") {
        parisCards = {
          mode: "auto-latest",
          limit: Number(this.parisCardsLimit) || 3,
        };
      }

      if (this.parisCardsMode === "manual") {
        if (this.selectedParisCardKeys.length === 0) {
          throw new Error("Для ручного режима выбери хотя бы один материал.");
        }

        const items = this.selectedParisCardKeys.map((key: string) => {
          const parsedKey = parseContentKey(key);
          if (!parsedKey) {
            throw new Error("Не удалось распознать один из выбранных материалов.");
          }

          return parsedKey;
        }) as LandingCategoryCardsItemTarget[];

        parisCards = {
          mode: "manual",
          items,
        };
      }

      await editorialPlacementsApi.updateLanding({ parisCards });

      this.notify("Карточки блока «Париж» на landing обновлены.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save paris cards", error);
      this.parisCardsError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить карточки блока «Париж».";
      this.notify(this.parisCardsError, "error");
    } finally {
      this.parisCardsSaving = false;
    }
  },

  async saveEventCard() {
    this.eventSaving = true;
    this.eventError = "";

    try {
      let eventCard: LandingEventCardSelection | null = null;

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
      let cultureInterviewBlock: LandingCultureInterviewBlockSelection | null = null;

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

  async saveLeSaviezVous() {
    this.leSaviezVousSaving = true;
    this.leSaviezVousError = "";

    try {
      let leSaviezVousFeature: SectionPageLeSaviezVousSelection | null = null;

      if (this.leSaviezVousMode === "auto-latest") {
        leSaviezVousFeature = { mode: "auto-latest" };
      }

      if (this.leSaviezVousMode === "manual") {
        if (!this.selectedLeSaviezVousId) {
          throw new Error("Для ручного режима выбери материал.");
        }
        leSaviezVousFeature = { mode: "manual", id: this.selectedLeSaviezVousId };
      }

      await editorialPlacementsApi.updateLanding({ leSaviezVousFeature });

      this.notify("Le saviez-vous на landing обновлён.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save le saviez-vous", error);
      this.leSaviezVousError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить le saviez-vous.";
      this.notify(this.leSaviezVousError, "error");
    } finally {
      this.leSaviezVousSaving = false;
    }
  },
});
