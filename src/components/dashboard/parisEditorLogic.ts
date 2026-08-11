import {
  editorialPlacementsApi,
  type PhotoOfTheDayFeatureSelection,
  type SectionPageFeaturedInterviewSelection,
  type SectionPageHeroManualSelection,
  type SectionPageHeroType,
  type SectionPageSecondaryStoriesSelection,
  type SectionPageSidebarRailSelection,
} from "@/lib/api/api";
import type { UiStore } from "@/stores/uiStore";

declare const Alpine: any;

interface ContentOption {
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  createdAtMs: number | null;
  publishedAtMs: number | null;
}

interface ArticleOption {
  id: string;
  title: string;
  createdAtMs: number | null;
  publishedAtMs: number | null;
}

interface ParisEditorInitialState {
  heroOptions: ContentOption[];
  initialHero: { mode: "empty" | "manual"; key: string };
  initialTwoImageArticle: { mode: "empty" | "manual"; key: string };
  interviewOptions: ArticleOption[];
  initialInterviewFeature: { mode: "empty" | "auto-latest" | "manual"; id: string };
  initialSecondaryStoriesMode: "empty" | "auto-latest";
  initialSecondaryStoriesLimit: number;
  photoOfTheDayOptions: ArticleOption[];
  initialPhotoOfTheDay: { mode: "empty" | "auto-latest" | "manual"; id: string };
  initialSidebarMode: "empty" | "auto-hot" | "manual";
  initialSidebarLimit: number;
  sidebarOptions: ContentOption[];
  initialSidebarKeys: string[];
}

const parseContentKey = (key: string) => {
  const separatorIndex = key.indexOf(":");
  if (separatorIndex <= 0) return null;
  const type = key.slice(0, separatorIndex);
  const id = key.slice(separatorIndex + 1);
  if (!id) return null;
  return { type, id };
};

export default (initialState: ParisEditorInitialState) => ({
  heroOptions: initialState.heroOptions ?? [],
  heroMode: initialState.initialHero?.mode ?? "empty",
  selectedHeroKey: initialState.initialHero?.key ?? "",
  heroSaving: false,
  heroError: "",

  twoImageArticleMode: initialState.initialTwoImageArticle?.mode ?? "empty",
  selectedTwoImageArticleKey: initialState.initialTwoImageArticle?.key ?? "",
  twoImageArticleSaving: false,
  twoImageArticleError: "",

  interviewOptions: initialState.interviewOptions ?? [],
  interviewFeatureMode: initialState.initialInterviewFeature?.mode ?? "auto-latest",
  selectedInterviewFeatureId: initialState.initialInterviewFeature?.id ?? "",
  interviewFeatureSaving: false,
  interviewFeatureError: "",

  secondaryStoriesMode: initialState.initialSecondaryStoriesMode ?? "auto-latest",
  secondaryStoriesLimit: initialState.initialSecondaryStoriesLimit ?? 2,
  secondaryStoriesSaving: false,
  secondaryStoriesError: "",

  photoOfTheDayOptions: initialState.photoOfTheDayOptions ?? [],
  photoOfTheDayMode: initialState.initialPhotoOfTheDay?.mode ?? "auto-latest",
  selectedPhotoOfTheDayId: initialState.initialPhotoOfTheDay?.id ?? "",
  photoOfTheDaySaving: false,
  photoOfTheDayError: "",

  sidebarMode: initialState.initialSidebarMode ?? "auto-hot",
  sidebarLimit: initialState.initialSidebarLimit ?? 4,
  sidebarOptions: initialState.sidebarOptions ?? [],
  selectedSidebarKeys: [...(initialState.initialSidebarKeys ?? [])],
  sidebarSaving: false,
  sidebarError: "",

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

  isManualSidebarSelected(key: string) {
    return this.selectedSidebarKeys.includes(key);
  },

  toggleSidebarItem(key: string) {
    if (this.selectedSidebarKeys.includes(key)) {
      this.selectedSidebarKeys = this.selectedSidebarKeys.filter(
        (selectedKey: string) => selectedKey !== key,
      );
      return;
    }
    this.selectedSidebarKeys = [key, ...this.selectedSidebarKeys];
  },

  async saveHero() {
    this.heroSaving = true;
    this.heroError = "";

    try {
      let hero: SectionPageHeroManualSelection | null = null;

      if (this.heroMode === "manual") {
        if (!this.selectedHeroKey) {
          throw new Error("Для ручного режима выбери материал.");
        }
        const parsed = parseContentKey(this.selectedHeroKey);
        if (!parsed) {
          throw new Error("Не удалось распознать выбранный материал.");
        }
        hero = { mode: "manual", type: parsed.type as SectionPageHeroType, id: parsed.id };
      }

      await editorialPlacementsApi.updateParisPage({ hero });
      this.notify("Hero страницы «Париж» обновлён.");
      window.location.reload();
    } catch (error) {
      this.heroError =
        error instanceof Error ? error.message : "Не удалось сохранить hero.";
      this.notify(this.heroError, "error");
    } finally {
      this.heroSaving = false;
    }
  },

  async saveTwoImageArticle() {
    this.twoImageArticleSaving = true;
    this.twoImageArticleError = "";

    try {
      let twoImageArticle: SectionPageHeroManualSelection | null = null;

      if (this.twoImageArticleMode === "manual") {
        if (!this.selectedTwoImageArticleKey) {
          throw new Error("Для ручного режима выбери материал.");
        }
        const parsed = parseContentKey(this.selectedTwoImageArticleKey);
        if (!parsed) {
          throw new Error("Не удалось распознать выбранный материал.");
        }
        twoImageArticle = { mode: "manual", type: parsed.type as SectionPageHeroType, id: parsed.id };
      }

      await editorialPlacementsApi.updateParisPage({ twoImageArticle });
      this.notify("Two-image article страницы «Париж» обновлён.");
      window.location.reload();
    } catch (error) {
      this.twoImageArticleError =
        error instanceof Error ? error.message : "Не удалось сохранить two-image article.";
      this.notify(this.twoImageArticleError, "error");
    } finally {
      this.twoImageArticleSaving = false;
    }
  },

  async saveInterviewFeature() {
    this.interviewFeatureSaving = true;
    this.interviewFeatureError = "";

    try {
      let interviewFeature: SectionPageFeaturedInterviewSelection | null = null;

      if (this.interviewFeatureMode === "auto-latest") {
        interviewFeature = { mode: "auto-latest" };
      } else if (this.interviewFeatureMode === "manual") {
        if (!this.selectedInterviewFeatureId) {
          throw new Error("Для ручного режима выбери интервью.");
        }
        interviewFeature = { mode: "manual", id: this.selectedInterviewFeatureId };
      }

      await editorialPlacementsApi.updateParisPage({ interviewFeature });
      this.notify("Interview страницы «Париж» обновлён.");
      window.location.reload();
    } catch (error) {
      this.interviewFeatureError =
        error instanceof Error ? error.message : "Не удалось сохранить interview.";
      this.notify(this.interviewFeatureError, "error");
    } finally {
      this.interviewFeatureSaving = false;
    }
  },

  async saveSecondaryStories() {
    this.secondaryStoriesSaving = true;
    this.secondaryStoriesError = "";

    try {
      let secondaryStories: SectionPageSecondaryStoriesSelection | null = null;

      if (this.secondaryStoriesMode === "auto-latest") {
        secondaryStories = {
          mode: "auto-latest",
          limit: Number(this.secondaryStoriesLimit) || 2,
        };
      }

      await editorialPlacementsApi.updateParisPage({ secondaryStories });
      this.notify("Secondary stories страницы «Париж» обновлены.");
      window.location.reload();
    } catch (error) {
      this.secondaryStoriesError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить secondary stories.";
      this.notify(this.secondaryStoriesError, "error");
    } finally {
      this.secondaryStoriesSaving = false;
    }
  },

  async savePhotoOfTheDay() {
    this.photoOfTheDaySaving = true;
    this.photoOfTheDayError = "";

    try {
      let photoOfTheDayFeature: PhotoOfTheDayFeatureSelection | null = null;

      if (this.photoOfTheDayMode === "auto-latest") {
        photoOfTheDayFeature = { mode: "auto-latest" };
      } else if (this.photoOfTheDayMode === "manual") {
        if (!this.selectedPhotoOfTheDayId) {
          throw new Error("Для ручного режима выбери фото.");
        }
        photoOfTheDayFeature = { mode: "manual", id: this.selectedPhotoOfTheDayId };
      }

      await editorialPlacementsApi.updateParisPage({ photoOfTheDayFeature });
      this.notify("Фото дня страницы «Париж» обновлено.");
      window.location.reload();
    } catch (error) {
      this.photoOfTheDayError =
        error instanceof Error ? error.message : "Не удалось сохранить фото дня.";
      this.notify(this.photoOfTheDayError, "error");
    } finally {
      this.photoOfTheDaySaving = false;
    }
  },

  async saveSidebarRail() {
    this.sidebarSaving = true;
    this.sidebarError = "";

    try {
      let sidebarRail: SectionPageSidebarRailSelection | null = null;

      if (this.sidebarMode === "auto-hot") {
        sidebarRail = {
          mode: "auto-hot",
          limit: Number(this.sidebarLimit) || 4,
        };
      } else if (this.sidebarMode === "manual") {
        if (this.selectedSidebarKeys.length === 0) {
          throw new Error("Для ручного режима выбери хотя бы один материал.");
        }
        sidebarRail = {
          mode: "manual",
          items: this.selectedSidebarKeys.map((key: string) => {
            const parsed = parseContentKey(key);
            if (!parsed) {
              throw new Error("Не удалось распознать выбранный материал.");
            }
            return {
              type: parsed.type as SectionPageHeroType,
              id: parsed.id,
            };
          }),
        };
      }

      await editorialPlacementsApi.updateParisPage({ sidebarRail });
      this.notify("Sidebar rail страницы «Париж» обновлён.");
      window.location.reload();
    } catch (error) {
      this.sidebarError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить sidebar rail.";
      this.notify(this.sidebarError, "error");
    } finally {
      this.sidebarSaving = false;
    }
  },
});
