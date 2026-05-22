import { articlesApi, authorsApi } from "@/lib/api/api";
import { app } from "../../lib/firebase/client";
import {
  RELATED_CONTENT_TYPE_OPTIONS,
  createEmptyRelatedContent,
  createEmptyRelatedContentLists,
  fetchRelatedContentLists,
  sanitizeRelatedContent,
} from "@/lib/utils/relatedContent";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { createLandingPlacementManager } from "@/components/dashboard/landingPlacementManager";

const storage = getStorage(app);

const normalizeTags = (tags?: string[]) => {
  if (!Array.isArray(tags)) return [];
  const deduped = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    if (typeof raw !== "string") continue;
    const t = raw.trim();
    if (t && !deduped.has(t)) {
      deduped.add(t);
      result.push(t);
    }
  }
  return result;
};

const normalizeCategoryTags = (
  tags: string[] | undefined,
  categoryTags: Record<string, Array<{ title: string; value: string }>>,
  category?: string,
) => {
  if (!Array.isArray(tags)) return [];
  const legacyMap: Record<string, string> = {};
  if (category && categoryTags?.[category]) {
    for (const tag of categoryTags[category]) {
      legacyMap[tag.title] = tag.value;
    }
  }
  return normalizeTags(tags.map((tag) => legacyMap[tag] || tag));
};

// Creates a blank tips-item block
const createTipsItem = () => ({
  type: "tips-item",
  heading: "",
  imageUrl: "",
  imageCaption: "",
  meta1: "",
  meta2: "",
  meta2IsLink: false,
  meta2Url: "",
  text: "",
});

const normalizeLoadedArticle = (data: any) => {
  if (!data || typeof data !== "object") return null;
  // JSON round-trip strips Alpine reactive proxies — structuredClone does not work on them
  const copy = JSON.parse(JSON.stringify(data));
  copy.contentBlocks = Array.isArray(copy.content) ? copy.content : [];
  copy.tags = normalizeTags(copy.tags);
  copy.imageCaption = copy.imageCaption ?? "";
  copy.lead = copy.lead ?? "";
  copy.cardLead = copy.cardLead ?? "";
  copy.isHotContent = Boolean(copy.isHotContent);
  copy.isMainInCategory = Boolean(copy.isMainInCategory);
  copy.relatedContent = sanitizeRelatedContent(copy.relatedContent);
  return copy;
};

const ui = () => (globalThis as any).Alpine?.store("ui");

export default function tipsArticleCreatorLogic(initialState = {}) {
  const {
    initialArticle = null,
    articleId = null,
    isEditMode = false,
    onSaveRedirect = null,
    categoryTags = {},
    parisDistrictOptions = [],
  } = initialState as {
    initialArticle?: Record<string, unknown> | null;
    articleId?: string | null;
    isEditMode?: boolean;
    onSaveRedirect?: string | null;
    categoryTags?: Record<string, Array<{ title: string; value: string }>>;
    parisDistrictOptions?: Array<{ title: string; value: string }>;
  };

  const buildParisDistrictMap = () =>
    Object.fromEntries(
      parisDistrictOptions.flatMap((district) => [
        [district.value.toLowerCase(), district.value],
        [district.title.toLowerCase(), district.value],
      ]),
    );

  const normalizeParisDistrict = (value?: unknown) => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    const districtMap = buildParisDistrictMap();
    return districtMap[trimmed.toLowerCase()] || trimmed;
  };

  return {
    article: {
      title: "",
      lead: "",
      cardLead: "",
      imageUrl: "",
      imageCaption: "",
      category: "culture",
      tags: [] as string[],
      parisSubCategories: [] as string[],
      parisDistrict: "",
      binaryForGuide: false,
      isHotContent: false,
      isMainInCategory: false,
      contentBlocks: [] as any[],
      relatedContent: createEmptyRelatedContent(),
      authorId: "" as string,  // populated from loaded article in edit mode
      author: null as any,     // populated from API response in edit mode
    },

    // Editing state
    editingIndex: null as number | null,
    editingBlock: null as any,
    isEditingTitle: false,
    editingTitleText: "",
    isEditingCaption: false,
    editingCaptionText: "",

    // Upload state
    uploading: false,
    uploadProgress: 0,
    uploadingBlockIndex: null as number | null,
    isSaving: false,
    contentListsLoading: false,
    relatedContentLists: createEmptyRelatedContentLists(),
    relatedContentTypeOptions: RELATED_CONTENT_TYPE_OPTIONS,
    selectedRelatedContentType: "article",
    selectedRelatedContentId: "",

    // Author state
    authors: [] as any[],
    authorsLoading: false,
    selectedAuthorId: "",
    useNewAuthor: false,
    newAuthorFirstName: "",
    newAuthorLastName: "",
    ...createLandingPlacementManager({
      getEntityId() {
        return this.articleId;
      },
      getMainHeroRef() {
        return this.articleId ? { type: "article", id: this.articleId } : null;
      },
    }),

    categoryTags,
    parisDistrictOptions,

    articleId,
    isEditMode,
    onSaveRedirect,

    // ── Init ──────────────────────────────────────────────────────────────────
    init() {
      if (initialArticle) {
        const normalized = normalizeLoadedArticle(initialArticle);
        if (normalized) this.article = normalized;
      }
      if (articleId) {
        this.articleId = articleId;
        this.isEditMode = true;
      }
      if (typeof isEditMode === "boolean") this.isEditMode = isEditMode;
      if (onSaveRedirect) this.onSaveRedirect = onSaveRedirect;

      this.article.tags = normalizeCategoryTags(
        this.article.tags,
        this.categoryTags,
        this.article.category,
      );
      this.article.parisSubCategories = normalizeCategoryTags(
        (this.article as any).parisSubCategories ??
          (this.article.category === "paris" ? this.article.tags : []),
        this.categoryTags,
        "paris",
      );
      this.article.parisDistrict = normalizeParisDistrict(
        (this.article as any).parisDistrict,
      );
      this.article.binaryForGuide = Boolean((this.article as any).binaryForGuide);
      this.article.relatedContent = sanitizeRelatedContent(
        (this.article as any).relatedContent,
        "article",
        this.articleId,
      );
      this.article.contentBlocks = Array.isArray(this.article.contentBlocks)
        ? this.article.contentBlocks
        : [];

      this.selectedAuthorId =
        typeof this.article.authorId === "string" ? this.article.authorId : "";

      this.fetchContentLists();
      this.loadAuthors();
      this.loadLandingPlacements();
    },

    // ── Title editing ────────────────────────────────────────────────────────
    editTitle() {
      this.isEditingTitle = true;
      this.editingTitleText = this.article.title;
    },
    saveTitle() {
      this.article.title = this.editingTitleText;
      this.isEditingTitle = false;
    },
    cancelEditTitle() {
      this.isEditingTitle = false;
    },

    // ── Cover caption editing ────────────────────────────────────────────────
    editCaption() {
      this.isEditingCaption = true;
      this.editingCaptionText = this.article.imageCaption;
    },
    saveCaption() {
      this.article.imageCaption = this.editingCaptionText;
      this.isEditingCaption = false;
    },
    cancelEditCaption() {
      this.isEditingCaption = false;
    },

    // ── Tags ─────────────────────────────────────────────────────────────────
    getAvailableTags() {
      if (!this.article?.category) return [];
      return this.categoryTags[this.article.category] || [];
    },
    getTagLabel(value: string) {
      for (const tags of Object.values(this.categoryTags)) {
        const found = tags.find((tag) => tag.value === value);
        if (found) return found.title;
      }
      return value;
    },
    isParisCategory() {
      return this.article.category === "paris";
    },
    getSelectedCategoryTags() {
      return this.isParisCategory()
        ? this.article.parisSubCategories
        : this.article.tags;
    },
    isTagSelected(value: string) {
      return this.getSelectedCategoryTags().includes(value);
    },
    toggleTag(value: string) {
      const targetTags = this.getSelectedCategoryTags();
      const idx = targetTags.indexOf(value);
      if (idx >= 0) {
        targetTags.splice(idx, 1);
      } else {
        targetTags.push(value);
      }
      if (this.isParisCategory()) {
        this.article.parisSubCategories = normalizeCategoryTags(
          this.article.parisSubCategories,
          this.categoryTags,
          "paris",
        );
      } else {
        this.article.tags = normalizeCategoryTags(
          this.article.tags,
          this.categoryTags,
          this.article.category,
        );
      }
    },
    removeTag(value: string) {
      const targetTags = this.getSelectedCategoryTags();
      const idx = targetTags.indexOf(value);
      if (idx >= 0) targetTags.splice(idx, 1);
    },
    handleCategoryChange(value: string) {
      this.article.category = value;
      this.article.tags = normalizeCategoryTags(
        this.article.tags,
        this.categoryTags,
        value,
      );
      this.article.parisSubCategories = normalizeCategoryTags(
        this.article.parisSubCategories,
        this.categoryTags,
        "paris",
      );
      this.article.parisDistrict = normalizeParisDistrict(this.article.parisDistrict);
    },

    // ── Authors ───────────────────────────────────────────────────────────────
    getAuthorLabel(author: any) {
      const first =
        typeof author?.firstName === "string" ? author.firstName.trim() : "";
      const last =
        typeof author?.lastName === "string" ? author.lastName.trim() : "";
      return `${first} ${last}`.trim();
    },
    ensureSelectedAuthorPresent() {
      if (!this.selectedAuthorId) return;
      const exists = this.authors.some(
        (a: any) => a.id === this.selectedAuthorId,
      );
      if (exists) return;
      const fallback = this.article.author;
      if (fallback?.firstName || fallback?.lastName) {
        this.authors.unshift({
          id: this.selectedAuthorId,
          firstName: fallback.firstName || "",
          lastName: fallback.lastName || "",
          role: fallback.role || "author",
          avatar: fallback.avatar || "",
        });
      }
    },
    async loadAuthors() {
      this.authorsLoading = true;
      try {
        const authors = await authorsApi.list();
        this.authors = Array.isArray(authors) ? authors : [];
        this.ensureSelectedAuthorPresent();
      } catch (e) {
        console.error("Failed to fetch authors:", e);
      } finally {
        this.authorsLoading = false;
      }
    },
    async resolveAuthorId() {
      if (this.useNewAuthor) {
        const first = this.newAuthorFirstName.trim();
        const last = this.newAuthorLastName.trim();
        if (!first || !last)
          throw new Error("Заполни имя и фамилию нового автора.");
        const created = await authorsApi.create({
          firstName: first,
          lastName: last,
        });
        this.authors.unshift(created);
        this.selectedAuthorId = created.id;
        this.useNewAuthor = false;
        this.newAuthorFirstName = "";
        this.newAuthorLastName = "";
        return created.id;
      }
      if (!this.selectedAuthorId)
        throw new Error("Выбери автора из списка или создай нового.");
      return this.selectedAuthorId;
    },
    async fetchContentLists() {
      this.contentListsLoading = true;
      try {
        this.relatedContentLists = await fetchRelatedContentLists();
      } catch (e) {
        console.error("Failed to fetch content lists:", e);
        ui()?.showToast?.("Не удалось загрузить списки контента.", "error");
      } finally {
        this.contentListsLoading = false;
      }
    },
    getAvailableRelatedContentItems() {
      if (!this.selectedRelatedContentType) return [];
      return this.relatedContentLists[this.selectedRelatedContentType] ?? [];
    },
    getSelectedEntityRelatedContent(type: string) {
      return (this.article as any)?.relatedContent?.[type] ?? [];
    },
    getRelatedContentItemLabel(type: string, id: string) {
      const item = (this.relatedContentLists as Record<string, any[]>)[type]?.find(
        (entry) => entry.id === id,
      );
      return item?.title || id;
    },
    addRelatedContent() {
      const type = this.selectedRelatedContentType;
      const id = this.selectedRelatedContentId;
      if (!type || !id) return;

      const normalized = sanitizeRelatedContent((this.article as any).relatedContent);
      if (this.articleId && type === "article" && id === this.articleId) {
        ui()?.showToast?.("Нельзя привязать текущий материал к самому себе.", "error");
        return;
      }
      if (normalized[type].includes(id)) {
        ui()?.showToast?.("Этот материал уже добавлен.", "info");
        return;
      }

      normalized[type] = [...normalized[type], id];
      (this.article as any).relatedContent = normalized;
      this.selectedRelatedContentId = "";
    },
    removeRelatedContent(type: string, id: string) {
      const normalized = sanitizeRelatedContent((this.article as any).relatedContent);
      normalized[type] = normalized[type].filter((itemId) => itemId !== id);
      (this.article as any).relatedContent = normalized;
    },

    // ── Tips-item blocks ──────────────────────────────────────────────────────
    addTipsItem() {
      this.article.contentBlocks.push(createTipsItem());
      const newIndex = this.article.contentBlocks.length - 1;
      this.editBlock(newIndex);
    },

    editBlock(index: number) {
      this.editingIndex = index;
      // JSON round-trip strips Alpine reactive proxies; structuredClone does not work on them
      this.editingBlock = JSON.parse(JSON.stringify(this.article.contentBlocks[index])); // NOSONAR
    },

    updateBlock() {
      if (this.editingIndex !== null) {
        this.article.contentBlocks[this.editingIndex] = this.editingBlock;
        this.cancelEdit();
      }
    },

    cancelEdit() {
      this.editingIndex = null;
      this.editingBlock = null;
    },

    deleteBlock(index: number) {
      const remove = () => {
        this.article.contentBlocks.splice(index, 1);
        if (this.editingIndex === index) this.cancelEdit();
      };
      const uiStore = ui();
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation("Удалить этот пункт?", remove);
      } else {
        remove();
      }
    },

    moveBlock(index: number, direction: "up" | "down") {
      const blocks = this.article.contentBlocks;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= blocks.length) return;
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      if (this.editingIndex === index) this.editingIndex = target;
    },

    // ── Image uploads ─────────────────────────────────────────────────────────
    handleCoverUpload(event: Event) {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      this._uploadFile(file, "tips-articles", (url) => {
        this.article.imageUrl = url;
      });
    },

    handleItemImageUpload(event: Event) {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file || !this.editingBlock) return;
      this._uploadFile(file, "tips-articles", (url) => {
        this.editingBlock.imageUrl = url;
      });
    },

    _uploadFile(file: File, folder: string, onSuccess: (url: string) => void) {
      this.uploading = true;
      this.uploadProgress = 0;
      const storageRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
      const task = uploadBytesResumable(storageRef, file);

      task.on(
        "state_changed",
        (snap) => {
          this.uploadProgress =
            (snap.bytesTransferred / snap.totalBytes) * 100;
        },
        (error) => {
          console.error("Upload failed:", error);
          ui()?.showToast?.(`Ошибка загрузки: ${error.message}`, "error");
          this.uploading = false;
        },
        () => {
          getDownloadURL(task.snapshot.ref).then((url) => {
            onSuccess(url);
            this.uploading = false;
            ui()?.showToast?.("Картинка загружена!");
          });
        },
      );
    },

    // ── Delete ────────────────────────────────────────────────────────────────
    deleteArticle(redirectUrl?: string) {
      if (!this.articleId) return;

      const performDelete = async () => {
        try {
          await articlesApi.delete(this.articleId!);
          ui()?.showToast?.("Статья удалена");
          setTimeout(() => {
            globalThis.location.href = redirectUrl || "/dashboard";
          }, 1500);
        } catch (error) {
          console.error(error);
          ui()?.showToast?.("Не удалось удалить статью.", "error");
        }
      };

      const uiStore = ui();
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation(
          `Удалить статью «${this.article.title}»? Это действие необратимо.`,
          performDelete,
        );
      } else {
        if (globalThis.confirm("Вы уверены, что хотите удалить эту статью?")) {
          performDelete();
        }
      }
    },

    // ── Save ──────────────────────────────────────────────────────────────────
    async saveArticle() {
      // Auto-commit any open block — prevents losing unsaved flipper/image/text edits
      if (this.editingIndex !== null) {
        this.updateBlock();
        if (this.editingIndex !== null) return;
      }

      // Block save while a file upload is still in progress
      if (this.uploading) {
        ui()?.showToast?.("Подожди — загрузка файла ещё не завершилась.", "error");
        return;
      }

      // Guard against double-submit
      if (this.isSaving) return;
      this.isSaving = true;

      this.article.tags = normalizeCategoryTags(
        this.article.tags,
        this.categoryTags,
        this.article.category,
      );
      this.article.parisSubCategories = normalizeCategoryTags(
        this.article.parisSubCategories,
        this.categoryTags,
        "paris",
      );
      this.article.parisDistrict = normalizeParisDistrict(this.article.parisDistrict);

      if (!this.article.title) {
        ui()?.showToast?.("Добавь заголовок.", "error");
        this.isSaving = false;
        return;
      }
      if (this.article.contentBlocks.length === 0) {
        ui()?.showToast?.("Добавь хотя бы один пункт.", "error");
        this.isSaving = false;
        return;
      }
      const selectedCategoryTags = this.getSelectedCategoryTags();
      if (selectedCategoryTags.length === 0) {
        ui()?.showToast?.("Добавь хотя бы один тег.", "error");
        this.isSaving = false;
        return;
      }

      try {
        const authorId = await this.resolveAuthorId();
        const isParisCategory = this.isParisCategory();
        const payload = {
          title: this.article.title,
          lead: this.article.lead,
          cardLead: this.article.cardLead,
          authorId,
          articleType: "tips" as const,
          imageUrl: this.article.imageUrl,
          imageCaption: this.article.imageCaption,
          category: this.article.category,
          tags: selectedCategoryTags.map((tag) => this.getTagLabel(tag)),
          parisSubCategories: isParisCategory ? this.article.parisSubCategories : [],
          parisDistrict: isParisCategory ? this.article.parisDistrict || null : null,
          binaryForGuide: false,
          isHotContent: Boolean(this.article.isHotContent),
          isMainInCategory: Boolean(this.article.isMainInCategory),
          content: this.article.contentBlocks,
          relatedContent: sanitizeRelatedContent(
            (this.article as any).relatedContent,
            "article",
            this.articleId,
          ),
        };

        if (this.isEditMode && this.articleId) {
          await articlesApi.update(this.articleId, payload);
          ui()?.showToast?.("Статья обновлена!");
          setTimeout(() => { globalThis.location.href = this.onSaveRedirect || "/dashboard"; }, 1500);
        } else {
          await articlesApi.create(payload);
          ui()?.showToast?.("Статья создана!");
          setTimeout(() => { globalThis.location.href = "/dashboard"; }, 1500);
        }
      } catch (e) {
        console.error("Ошибка сохранения:", e);
        const msg =
          e instanceof Error ? e.message : "Ошибка во время сохранения.";
        ui()?.showToast?.(msg, "error");
        this.isSaving = false;
      }
    },
  };
}
