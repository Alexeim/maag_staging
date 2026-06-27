import {
  editorialPlacementsApi,
  type SectionPageHeroManualSelection,
  type SectionPageHeroType,
  type SectionPageLeSaviezVousSelection,
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

interface ArticleOption {
  id: string;
  title: string;
}

interface ParisEditorInitialState {
  heroOptions: ContentOption[];
  initialHero: { mode: "empty" | "manual"; key: string };
  leSaviezVousOptions: ArticleOption[];
  initialLeSaviezVous: { mode: "empty" | "auto-latest" | "manual"; id: string };
  initialSecondaryStoriesMode: "empty" | "auto-latest";
  initialSecondaryStoriesLimit: number;
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

  leSaviezVousOptions: initialState.leSaviezVousOptions ?? [],
  leSaviezVousMode: initialState.initialLeSaviezVous?.mode ?? "auto-latest",
  selectedLeSaviezVousId: initialState.initialLeSaviezVous?.id ?? "",
  leSaviezVousSaving: false,
  leSaviezVousError: "",

  secondaryStoriesMode: initialState.initialSecondaryStoriesMode ?? "auto-latest",
  secondaryStoriesLimit: initialState.initialSecondaryStoriesLimit ?? 3,
  secondaryStoriesSaving: false,
  secondaryStoriesError: "",

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

  async saveLeSaviezVous() {
    this.leSaviezVousSaving = true;
    this.leSaviezVousError = "";

    try {
      let leSaviezVousFeature: SectionPageLeSaviezVousSelection | null = null;

      if (this.leSaviezVousMode === "auto-latest") {
        leSaviezVousFeature = { mode: "auto-latest" };
      } else if (this.leSaviezVousMode === "manual") {
        if (!this.selectedLeSaviezVousId) {
          throw new Error("Для ручного режима выбери материал.");
        }
        leSaviezVousFeature = { mode: "manual", id: this.selectedLeSaviezVousId };
      }

      await editorialPlacementsApi.updateParisPage({ leSaviezVousFeature });
      this.notify("Le saviez-vous страницы «Париж» обновлён.");
      window.location.reload();
    } catch (error) {
      this.leSaviezVousError =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить le saviez-vous.";
      this.notify(this.leSaviezVousError, "error");
    } finally {
      this.leSaviezVousSaving = false;
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
