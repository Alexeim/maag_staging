import type { UiStore } from "@/stores/uiStore";
import {
  MATERIAL_TYPES,
  type DashboardBucket,
  type DashboardMaterialRow,
  type DashboardMaterialType,
} from "@/lib/utils/dashboardMaterials";

declare const Alpine: any;

type CategoryFilter = "all" | DashboardBucket;
type StatusFilter = "all" | "published" | "draft";
type SortKey = "updated" | "created" | "title";

interface OverviewCounts {
  total: number;
  byBucket: Record<DashboardBucket, number>;
  byStatus: { published: number; draft: number };
}

interface InitialState {
  apiBaseUrl: string;
  materials?: DashboardMaterialRow[];
  counts?: OverviewCounts;
}

const STORAGE_KEY = "dashboardOverview:filters";
const DIGEST_PER_SECTION = 12;
const FLAT_CAP = 100;

const EMPTY_COUNTS: OverviewCounts = {
  total: 0,
  byBucket: { culture: 0, paris: 0, events: 0, none: 0 },
  byStatus: { published: 0, draft: 0 },
};

export default (initialState: InitialState) => ({
  apiBase: initialState.apiBaseUrl,
  materials: (initialState.materials ?? []) as DashboardMaterialRow[],
  counts: (initialState.counts ?? EMPTY_COUNTS) as OverviewCounts,

  // --- filter state ---
  category: "all" as CategoryFilter,
  types: [] as DashboardMaterialType[], // empty = all types
  status: "all" as StatusFilter,
  query: "",
  sort: "updated" as SortKey,
  hotOnly: false,

  init() {
    this.restoreFilters();
  },

  // Called by the filter controls after they mutate state — keeps the URL and
  // localStorage in sync so refresh / back / shared links survive.
  setCategory(key: CategoryFilter) {
    this.category = key;
    this.persistFilters();
  },

  setDraftOnly() {
    this.category = "all";
    this.status = "draft";
    this.persistFilters();
  },

  // --- view mode ---
  // NB: these are methods, not getters — $lazy does Object.assign(this, module),
  // which flattens getters to a one-time value. Templates call them as fns.
  isDigest(): boolean {
    return this.category === "all";
  },

  typeMeta(type: DashboardMaterialType) {
    return MATERIAL_TYPES[type];
  },

  // Events read best by their start date; everything else by last touch.
  formatRowDate(row: DashboardMaterialRow): string {
    const raw =
      row.type === "event"
        ? row.startDate ?? row.createdAt
        : row.updatedAt ?? row.createdAt;
    if (!raw) return "—";
    const date = new Date(raw);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  },

  // --- filtering ---
  // Everything except the category segment (digest sections already imply a bucket).
  matchesSecondary(row: DashboardMaterialRow): boolean {
    if (this.types.length > 0 && !this.types.includes(row.type)) return false;
    if (this.status === "published" && !row.published) return false;
    if (this.status === "draft" && row.published) return false;
    if (this.hotOnly && !row.isHotContent) return false;
    const q = this.query.trim().toLowerCase();
    if (q) {
      const haystack = `${row.title} ${row.id} ${row.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  },

  sortRows(rows: DashboardMaterialRow[]): DashboardMaterialRow[] {
    const copy = [...rows];
    if (this.sort === "title") {
      copy.sort((a, b) => a.title.localeCompare(b.title, "ru"));
      return copy;
    }
    const field = this.sort === "created" ? "createdAt" : "updatedAt";
    copy.sort((a, b) => {
      const at = Date.parse(a[field] ?? a.createdAt ?? "") || 0;
      const bt = Date.parse(b[field] ?? b.createdAt ?? "") || 0;
      return bt - at;
    });
    return copy;
  },

  // Flat mode (a specific category tab is selected).
  filteredRows(): DashboardMaterialRow[] {
    const rows = this.materials.filter(
      (row: DashboardMaterialRow) =>
        row.bucket === this.category && this.matchesSecondary(row),
    );
    return this.sortRows(rows);
  },

  flatRows(): DashboardMaterialRow[] {
    return this.filteredRows().slice(0, FLAT_CAP);
  },

  flatOverflow(): number {
    return Math.max(0, this.filteredRows().length - FLAT_CAP);
  },

  // Digest mode ("Все").
  digestSection(bucket: DashboardBucket) {
    const rows = this.sortRows(
      this.materials.filter(
        (row: DashboardMaterialRow) =>
          row.bucket === bucket && this.matchesSecondary(row),
      ),
    );
    return { rows: rows.slice(0, DIGEST_PER_SECTION), total: rows.length };
  },

  totalVisible(): number {
    return this.materials.filter((row: DashboardMaterialRow) =>
      this.matchesSecondary(row),
    ).length;
  },

  // --- type filter helpers (multi-select) ---
  isTypeActive(type: DashboardMaterialType): boolean {
    return this.types.includes(type);
  },

  toggleType(type: DashboardMaterialType) {
    this.types = this.isTypeActive(type)
      ? this.types.filter((t: DashboardMaterialType) => t !== type)
      : [...this.types, type];
    this.persistFilters();
  },

  // Bound to the x-model controls via @change / @input — runs after Alpine has
  // written the new value back into state.
  syncFilters() {
    this.persistFilters();
  },

  clearFilters() {
    this.types = [];
    this.status = "all";
    this.query = "";
    this.hotOnly = false;
    this.persistFilters();
  },

  hasSecondaryFilters(): boolean {
    return (
      this.types.length > 0 ||
      this.status !== "all" ||
      this.query.trim() !== "" ||
      this.hotOnly
    );
  },

  // --- persistence ---
  restoreFilters() {
    const params = new URLSearchParams(window.location.search);
    let source: Record<string, string> = {};

    if ([...params.keys()].some((k) => k.startsWith("cat") || ["type", "status", "q", "sort", "hot"].includes(k))) {
      source = Object.fromEntries(params.entries());
    } else {
      try {
        source = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
      } catch {
        source = {};
      }
    }

    const cat = source.cat as CategoryFilter;
    if (["all", "culture", "paris", "events", "none"].includes(cat)) {
      this.category = cat;
    }
    if (typeof source.type === "string" && source.type) {
      this.types = source.type
        .split(",")
        .filter((t): t is DashboardMaterialType => t in MATERIAL_TYPES);
    }
    if (["published", "draft"].includes(source.status)) {
      this.status = source.status as StatusFilter;
    }
    if (typeof source.q === "string") this.query = source.q;
    if (["updated", "created", "title"].includes(source.sort)) {
      this.sort = source.sort as SortKey;
    }
    this.hotOnly = source.hot === "1" || source.hot === "true";
  },

  persistFilters() {
    const state: Record<string, string> = {};
    if (this.category !== "all") state.cat = this.category;
    if (this.types.length) state.type = this.types.join(",");
    if (this.status !== "all") state.status = this.status;
    if (this.query.trim()) state.q = this.query.trim();
    if (this.sort !== "updated") state.sort = this.sort;
    if (this.hotOnly) state.hot = "1";

    const qs = new URLSearchParams(state).toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage disabled — URL still carries state */
    }
  },

  // --- delete (routes per type via the registry) ---
  getUiStore(): UiStore | null {
    return Alpine.store("ui");
  },

  notify(message: string, type: "success" | "error" = "success") {
    const store = this.getUiStore();
    if (store?.showToast) store.showToast(message, type);
    else window.alert(message);
  },

  buildApiUrl(path: string) {
    try {
      const combined = `${this.apiBase.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
      return new URL(combined).toString();
    } catch (error) {
      console.error("Invalid API base URL", error);
      return path;
    }
  },

  handleDeleteClick(id: string, title: string, type: DashboardMaterialType) {
    if (!id) return;
    const store = this.getUiStore();
    const run = () => this.confirmAndDelete(id, type);
    if (store?.showConfirmation) {
      store.showConfirmation(`Удалить «${title}»? Это действие необратимо.`, run);
    } else {
      run();
    }
  },

  async confirmAndDelete(id: string, type: DashboardMaterialType) {
    const meta = MATERIAL_TYPES[type];
    if (!meta) return;
    try {
      const response = await fetch(this.buildApiUrl(meta.deletePath(id)), {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(`Deletion failed with status: ${response.status}`);
      }
      // Drop it locally so the list updates without a full reload.
      this.materials = this.materials.filter(
        (row: DashboardMaterialRow) => row.id !== id,
      );
      this.notify("Материал удалён");
    } catch (error) {
      console.error(error);
      this.notify("Не удалось удалить материал. Попробуй ещё раз.", "error");
    }
  },
});
