import type { UiStore } from "@/stores/uiStore";

declare const Alpine: any;

type ArticleFilter = "all" | "hot" | "regular";
type SectionArticleMeta = { id: string; isHotContent?: boolean };

const matchesArticleFilter = (
  filter: ArticleFilter,
  isHotContent: boolean,
) => {
  if (filter === "hot") {
    return isHotContent;
  }
  if (filter === "regular") {
    return !isHotContent;
  }
  return true;
};

export default (initialState: {
  apiBaseUrl: string;
  articles?: SectionArticleMeta[];
}) => ({
  apiBase: initialState.apiBaseUrl,
  hotFilter: "all" as ArticleFilter,
  articles: initialState.articles ?? [],

  getUiStore(): UiStore | null {
    return Alpine.store("ui");
  },

  matchesFilter(filter: ArticleFilter, isHotContent: boolean) {
    return matchesArticleFilter(filter, Boolean(isHotContent));
  },

  getVisibleCount() {
    return this.articles.filter((article) =>
      this.matchesFilter(this.hotFilter, Boolean(article.isHotContent)),
    ).length;
  },

  notify(message: string, type: "success" | "error" = "success") {
    const store = this.getUiStore();
    if (store?.showToast) {
      store.showToast(message, type);
    } else {
      window.alert(message);
    }
  },

  buildApiUrl(path: string) {
    try {
      // Ensures that we don't have double slashes if apiBase ends with one
      // and path starts with one.
      const combined = `${this.apiBase.replace(/\/$/, "")}/${path.replace(
        /^\//,
        "",
      )}`;
      return new URL(combined).toString();
    } catch (error) {
      console.error("Invalid API base URL", error);
      return path;
    }
  },

  async confirmAndDelete(id: string) {
    try {
      const response = await fetch(this.buildApiUrl(`/api/articles/${id}`), {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) { // 204 No Content is a success
        throw new Error(`Deletion failed with status: ${response.status}`);
      }
      this.notify("Статья удалена");
      // Use a slight delay to allow the user to see the toast message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error(error);
      this.notify("Не удалось удалить статью. Попробуй ещё раз.", "error");
    }
  },

  handleDeleteClick(id: string, title: string) {
    if (!id) return;

    const uiStore = this.getUiStore();
    if (uiStore?.showConfirmation) {
      uiStore.showConfirmation(
        `Удалить «${title}»? Это действие необратимо.`,
        () => this.confirmAndDelete(id),
      );
    } else {
      console.warn("UI store is not available, deleting without confirmation.");
      this.confirmAndDelete(id);
    }
  },
});
