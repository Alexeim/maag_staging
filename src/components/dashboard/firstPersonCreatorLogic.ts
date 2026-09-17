import { firstPersonApi } from "@/lib/api/api";
import articleCreatorLogic from "@/components/article/creatorLogic";
import { reindexContentBlocks } from "@/lib/utils/contentBlocks";
import { composeFirstPersonTitle } from "@/lib/utils/firstPerson";

// "От первого лица" reuses the article block editor/category/tags/author
// machinery wholesale (via articleCreatorLogic), but has no hero image and
// is never eligible to become a landing main/category hero — only the
// isMaagChoice flag controls where it surfaces (the "Выбор Maag" rail).
export default function firstPersonCreatorLogic(initialState = {}) {
  const baseLogic = articleCreatorLogic(initialState);

  const { isPreview = false } = initialState as { isPreview?: boolean };

  return {
    ...baseLogic,

    // Widens previewAuthorDisplay beyond baseLogic's {name, avatarUrl} shape
    // so assigning the extra noBgAvatarUrl field below type-checks.
    previewAuthorDisplay: { name: "", avatarUrl: "", noBgAvatarUrl: "" },

    loadLandingPlacements() {},
    getMainHeroTarget() {
      return null;
    },
    getCategoryHeroTarget() {
      return null;
    },

    init() {
      baseLogic.init.call(this);

      if (!isPreview) return;

      try {
        const stored = window.localStorage?.getItem("firstPersonPreview");
        const previewState = stored ? JSON.parse(stored) : null;
        if (!previewState?.article) return;

        this.article = { ...this.article, ...previewState.article };
        this.article.contentBlocks = Array.isArray(
          previewState.article.contentBlocks,
        )
          ? previewState.article.contentBlocks
          : [];
        this.articleId =
          typeof previewState.articleId === "string"
            ? previewState.articleId
            : this.articleId;
        this.isEditMode = Boolean(previewState.isEditMode);
        this.selectedAuthorId =
          typeof previewState.selectedAuthorId === "string"
            ? previewState.selectedAuthorId
            : "";
        this.useNewAuthor = Boolean(previewState.useNewAuthor);
        this.newAuthorFirstName =
          typeof previewState.newAuthorFirstName === "string"
            ? previewState.newAuthorFirstName
            : "";
        this.newAuthorLastName =
          typeof previewState.newAuthorLastName === "string"
            ? previewState.newAuthorLastName
            : "";
        this.previewAuthorDisplay =
          previewState.authorDisplay &&
          typeof previewState.authorDisplay === "object"
            ? {
                name:
                  typeof previewState.authorDisplay.name === "string"
                    ? previewState.authorDisplay.name
                    : "",
                avatarUrl:
                  typeof previewState.authorDisplay.avatarUrl === "string"
                    ? previewState.authorDisplay.avatarUrl
                    : "",
                noBgAvatarUrl:
                  typeof previewState.authorDisplay.noBgAvatarUrl === "string"
                    ? previewState.authorDisplay.noBgAvatarUrl
                    : "",
              }
            : { name: "", avatarUrl: "", noBgAvatarUrl: "" };
      } catch (error) {
        console.error("Failed to load first-person preview draft:", error);
      }
    },

    getSelectedAuthorNoBgAvatar() {
      const selectedAuthor = this.authors.find(
        (author: any) => author.id === this.selectedAuthorId,
      );
      return selectedAuthor?.noBgAvatar || "";
    },

    // article.title only holds the tail of the headline ("о том, как...");
    // the author's full name is prepended here so editors see the real
    // published headline while they type, not just the fragment.
    getComposedTitle() {
      return composeFirstPersonTitle(
        this.getSelectedAuthorDisplay().name,
        this.article.title,
      );
    },

    returnToEdit() {
      window.location.href =
        this.isEditMode && this.articleId
          ? `/dashboard/first-person/${this.articleId}/edit`
          : "/dashboard/first-person/create";
    },

    previewFirstPerson() {
      if (!this.prepareBlocksForAction()) return;

      const authorDisplay = {
        ...this.getSelectedAuthorDisplay(),
        noBgAvatarUrl: this.getSelectedAuthorNoBgAvatar(),
      };
      const previewState = {
        article: this.article,
        articleId: this.articleId,
        isEditMode: this.isEditMode,
        selectedAuthorId: this.selectedAuthorId,
        useNewAuthor: this.useNewAuthor,
        newAuthorFirstName: this.newAuthorFirstName,
        newAuthorLastName: this.newAuthorLastName,
        authorDisplay,
      };
      window.localStorage.setItem(
        "firstPersonPreview",
        JSON.stringify(previewState),
      );
      window.location.href = "/dashboard/first-person/preview";
    },

    async saveFirstPerson() {
      if (!this.prepareBlocksForAction()) return;
      if (this.isSaving) return;
      this.isSaving = true;

      const toast = (msg: string) =>
        (window as any).Alpine.store("ui").showToast(msg, "error");

      // baseLogic infers `article.contentBlocks` as `never[]` from its empty
      // literal default (nothing here widens it the way eventCreatorLogic's
      // article-override spread does) — cast to unblock the real runtime array.
      this.article.contentBlocks = reindexContentBlocks(
        this.article.contentBlocks,
      ) as any;

      if (
        this.article.contentBlocks.some(
          (block: any) => !this.validateVideoBlock(block),
        )
      ) {
        this.isSaving = false;
        return;
      }
      if (
        this.article.contentBlocks.some(
          (block: any) => !this.validateTweetBlock(block),
        )
      ) {
        this.isSaving = false;
        return;
      }

      if (!this.article.title?.trim()) {
        toast("Напиши заголовок материала.");
        this.isSaving = false;
        return;
      }

      if (!this.article.category) {
        toast("Выбери категорию — без неё материал не сохранится.");
        this.isSaving = false;
        return;
      }

      const selectedCategoryTags = this.getSelectedCategoryTags();
      if (
        !Array.isArray(selectedCategoryTags) ||
        selectedCategoryTags.length === 0
      ) {
        toast("Добавь хотя бы один тег — без него материал не сохранится.");
        this.isSaving = false;
        return;
      }

      try {
        const resolvedAuthorId = await this.resolveAuthorId();
        const isParisCategory = this.isParisCategory();
        const payload = {
          title: this.article.title,
          authorId: resolvedAuthorId,
          content: this.article.contentBlocks,
          category: this.article.category,
          tags: selectedCategoryTags,
          parisSubCategories: isParisCategory
            ? this.article.parisSubCategories
            : [],
          parisDistrict: isParisCategory
            ? this.article.parisDistrict || null
            : null,
          isMaagChoice: Boolean(this.article.isMaagChoice),
          published: Boolean(this.article.published),
        };

        if (this.isEditMode && this.articleId) {
          await firstPersonApi.update(this.articleId, payload);
          window.localStorage.removeItem("firstPersonPreview");
          (window as any).Alpine.store("ui").showToast("Материал обновлён!");
          setTimeout(() => {
            globalThis.location.href = "/dashboard";
          }, 1500);
        } else {
          const created = await firstPersonApi.create(payload);
          this.articleId = created.id;
          window.localStorage.removeItem("firstPersonPreview");
          (window as any).Alpine.store("ui").showToast(
            "Материал «от первого лица» создан!",
          );
          setTimeout(() => {
            globalThis.location.href = "/dashboard";
          }, 1500);
        }
      } catch (error) {
        console.error("First-person save error:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Что-то пошло не так при сохранении материала.";
        (window as any).Alpine.store("ui").showToast(message, "error");
        this.isSaving = false;
      }
    },

    deleteFirstPerson(redirectUrl: string) {
      if (!this.articleId) return;

      const performDelete = async () => {
        try {
          await firstPersonApi.delete(this.articleId as string);
          (window as any).Alpine.store("ui").showToast("Материал удалён");
          setTimeout(() => {
            window.location.href = redirectUrl || "/dashboard";
          }, 1500);
        } catch (error) {
          console.error(error);
          (window as any).Alpine.store("ui").showToast(
            "Не удалось удалить материал.",
            "error",
          );
        }
      };

      const uiStore = (window as any).Alpine?.store?.("ui");
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation(
          `Удалить материал «${this.article.title || "без названия"}»? Это необратимо.`,
          performDelete,
        );
      } else if (window.confirm("Удалить материал?")) {
        performDelete();
      }
    },
  };
}
