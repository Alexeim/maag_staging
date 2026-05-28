import {
  editorialPlacementsApi,
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
}

interface InterviewOption {
  id: string;
  title: string;
}

interface CultureEditorInitialState {
  heroOptions: ContentOption[];
  initialHero: { mode: "empty" | "manual"; key: string };
  interviewOptions: InterviewOption[];
  initialFeaturedInterview: { mode: "empty" | "auto-latest" | "manual"; id: string };
  initialSecondaryStoriesMode: "empty" | "auto-latest";
  initialSecondaryStoriesLimit: number;
  initialSidebarMode: "empty" | "auto-hot";
  initialSidebarLimit: number;
}

const parseContentKey = (key: string) => {
  const separatorIndex = key.indexOf(":");
  if (separatorIndex <= 0) return null;
  const type = key.slice(0, separatorIndex);
  const id = key.slice(separatorIndex + 1);
  if (!id) return null;
  return { type, id };
};

export default (initialState: CultureEditorInitialState) => ({
  heroOptions: initialState.heroOptions ?? [],
  heroMode: initialState.initialHero?.mode ?? "empty",
  selectedHeroKey: initialState.initialHero?.key ?? "",
  heroSaving: false,
  heroError: "",

  interviewOptions: initialState.interviewOptions ?? [],
  featuredInterviewMode: initialState.initialFeaturedInterview?.mode ?? "auto-latest",
  selectedInterviewId: initialState.initialFeaturedInterview?.id ?? "",
  featuredInterviewSaving: false,
  featuredInterviewError: "",

  secondaryStoriesMode: initialState.initialSecondaryStoriesMode ?? "auto-latest",
  secondaryStoriesLimit: initialState.initialSecondaryStoriesLimit ?? 3,
  secondaryStoriesSaving: false,
  secondaryStoriesError: "",

  sidebarMode: initialState.initialSidebarMode ?? "auto-hot",
  sidebarLimit: initialState.initialSidebarLimit ?? 4,
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

      await editorialPlacementsApi.updateCulturePage({ hero });
      this.notify("Hero страницы «Культура» обновлён.");
      window.location.reload();
    } catch (error) {
      this.heroError =
        error instanceof Error ? error.message : "Не удалось сохранить hero.";
      this.notify(this.heroError, "error");
    } finally {
      this.heroSaving = false;
    }
  },

  async saveFeaturedInterview() {
    this.featuredInterviewSaving = true;
    this.featuredInterviewError = "";

    try {
      let featuredInterview: SectionPageFeaturedInterviewSelection | null = null;

      if (this.featuredInterviewMode === "auto-latest") {
        featuredInterview = { mode: "auto-latest" };
      } else if (this.featuredInterviewMode === "manual") {
        if (!this.selectedInterviewId) {
          throw new Error("Для ручного режима выбери интервью.");
        }
        featuredInterview = { mode: "manual", id: this.selectedInterviewId };
      }

      await editorialPlacementsApi.updateCulturePage({ featuredInterview });
      this.notify("Featured interview страницы «Культура» обновлено.");
      window.location.reload();
    } catch (error) {
      this.featuredInterviewError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить featured interview.";
      this.notify(this.featuredInterviewError, "error");
    } finally {
      this.featuredInterviewSaving = false;
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
          limit: Number(this.secondaryStoriesLimit) || 3,
        };
      }

      await editorialPlacementsApi.updateCulturePage({ secondaryStories });
      this.notify("Secondary stories страницы «Культура» обновлены.");
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
      }

      await editorialPlacementsApi.updateCulturePage({ sidebarRail });
      this.notify("Sidebar rail страницы «Культура» обновлён.");
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
