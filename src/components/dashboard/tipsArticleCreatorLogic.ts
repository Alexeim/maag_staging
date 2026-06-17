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
import { createContentCollectionEditorState } from "@/lib/utils/contentCollectionEditor";
import { normalizeContentCollectionId } from "@/lib/utils/contentCollections";
import { compressImage } from "@/lib/images/compressImage";

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
    for (const tag of normalizeTagOptions(categoryTags[category])) {
      legacyMap[tag.title] = tag.value;
    }
  }
  return normalizeTags(tags.map((tag) => legacyMap[tag] || tag));
};

const normalizeTagOptions = (tags?: unknown) => {
  if (!Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const normalized: Array<{ title: string; value: string }> = [];
  for (const raw of tags) {
    const value =
      typeof raw === "string"
        ? raw.trim()
        : typeof raw?.value === "string"
          ? raw.value.trim()
          : "";
    const title =
      typeof raw === "object" &&
      raw !== null &&
      typeof raw.title === "string" &&
      raw.title.trim()
        ? raw.title.trim()
        : value;
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push({ title, value });
  }
  return normalized;
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
  copy.contentBlocks = Array.isArray(copy.content)
    ? copy.content
    : Array.isArray(copy.contentBlocks)
      ? copy.contentBlocks
      : [];
  copy.tags = normalizeTags(copy.tags);
  copy.imageCaption = copy.imageCaption ?? "";
  copy.lead = copy.lead ?? "";
  copy.cardLead = copy.cardLead ?? "";
  copy.isHotContent = Boolean(copy.isHotContent);
  copy.isMainInCategory = Boolean(copy.isMainInCategory);
  copy.published = Boolean(copy.published);
  copy.publishedAt = copy.publishedAt ?? null;
  copy.relatedContent = sanitizeRelatedContent(copy.relatedContent);
  return copy;
};

const ui = () => (globalThis as any).Alpine?.store("ui");

export default function tipsArticleCreatorLogic(initialState = {}) {
  const {
    initialArticle = null,
    articleId = null,
    isEditMode = false,
    isPreview = false,
    onSaveRedirect = null,
    categoryTags = {},
    parisDistrictOptions = [],
  } = initialState as {
    initialArticle?: Record<string, unknown> | null;
    articleId?: string | null;
    isEditMode?: boolean;
    isPreview?: boolean;
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
      published: false,
      publishedAt: null,
      contentBlocks: [] as any[],
      relatedContent: createEmptyRelatedContent(),
      contentCollectionId: null as string | null,
      authorId: "" as string, // populated from loaded article in edit mode
      author: null as any, // populated from API response in edit mode
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
    ...createContentCollectionEditorState("article"),

    // Author state
    authors: [] as any[],
    authorsLoading: false,
    selectedAuthorId: "",
    useNewAuthor: false,
    newAuthorFirstName: "",
    newAuthorLastName: "",
    previewAuthorDisplay: {
      name: "",
      avatarUrl: "",
    },
    ...createLandingPlacementManager({
      getEntityId() {
        return this.articleId;
      },
      getMainHeroTarget() {
        return this.articleId ? { type: "article", id: this.articleId } : null;
      },
      getCategoryHeroTarget() {
        const cat = (this.article?.category || "").trim().toLowerCase();
        if (!this.articleId || (cat !== "culture" && cat !== "paris"))
          return null;
        return {
          type: "article",
          id: this.articleId,
          category: cat as "culture" | "paris",
        };
      },
    }),

    categoryTags,
    parisDistrictOptions,

    articleId,
    isEditMode,
    onSaveRedirect,

    // ── Init ──────────────────────────────────────────────────────────────────
    init() {
      type PreviewState = {
        article?: unknown;
        articleId?: string | null;
        isEditMode?: boolean;
        selectedAuthorId?: string;
        useNewAuthor?: boolean;
        newAuthorFirstName?: string;
        newAuthorLastName?: string;
        authorDisplay?: {
          name?: string;
          avatarUrl?: string;
        };
      };

      let previewState: PreviewState | null = null;
      let restoredPreviewAuthorState = false;

      try {
        const stored = globalThis.localStorage?.getItem("tipsPreview");
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed && typeof parsed === "object") {
          previewState = parsed as PreviewState;
        }
      } catch (error) {
        console.error("Failed to load tips preview draft:", error);
      }

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

      const shouldApplyPreview = (() => {
        if (!previewState?.article) return false;
        if (isPreview) return true;
        const previewId =
          typeof previewState.articleId === "string" && previewState.articleId
            ? previewState.articleId
            : null;
        const isPreviewEdit = Boolean(previewState.isEditMode);
        const isSameEdit =
          this.isEditMode && previewId !== null && previewId === this.articleId;
        const isCreateDraft = !this.isEditMode && !previewId && !isPreviewEdit;
        return isSameEdit || isCreateDraft;
      })();

      if (shouldApplyPreview && previewState?.article) {
        const normalized = normalizeLoadedArticle(previewState.article);
        if (normalized) {
          if (isPreview) {
            this.article = normalized;
            this.articleId =
              typeof previewState.articleId === "string"
                ? previewState.articleId
                : null;
            this.isEditMode = Boolean(previewState.isEditMode);
          } else {
            Object.assign(this.article, normalized);
          }
        }
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
          previewState.authorDisplay && typeof previewState.authorDisplay === "object"
            ? {
                name:
                  typeof previewState.authorDisplay.name === "string"
                    ? previewState.authorDisplay.name
                    : "",
                avatarUrl:
                  typeof previewState.authorDisplay.avatarUrl === "string"
                    ? previewState.authorDisplay.avatarUrl
                    : "",
              }
            : { name: "", avatarUrl: "" };
        restoredPreviewAuthorState = true;
      }

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
      this.article.binaryForGuide = Boolean(
        (this.article as any).binaryForGuide,
      );
      this.article.relatedContent = sanitizeRelatedContent(
        (this.article as any).relatedContent,
        "article",
        this.articleId,
      );
      this.article.contentBlocks = Array.isArray(this.article.contentBlocks)
        ? this.article.contentBlocks
        : [];

      if (!restoredPreviewAuthorState) {
        this.selectedAuthorId =
          typeof this.article.authorId === "string" ? this.article.authorId : "";
      }

      this.fetchContentLists();
      this.loadAuthors();
      this.syncCurrentContentCollection();
      this.loadContentCollections();
      this.loadLandingPlacements();
    },

    returnToEdit() {
      globalThis.location.href =
        this.isEditMode && this.articleId
          ? `/dashboard/tips/${this.articleId}/edit`
          : "/dashboard/tips/create";
    },

    previewArticle() {
      if (!this.commitOpenItemBeforeAction()) return;

      const authorDisplay = this.getSelectedAuthorDisplay();
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
      globalThis.localStorage.setItem(
        "tipsPreview",
        JSON.stringify(previewState),
      );
      globalThis.location.href = "/dashboard/tips/preview";
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
      return normalizeTagOptions(this.categoryTags[this.article.category]);
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
      if (this.isParisCategory()) {
        this.article.parisSubCategories = Array.isArray(
          this.article.parisSubCategories,
        )
          ? this.article.parisSubCategories
          : [];
        return this.article.parisSubCategories;
      }
      this.article.tags = Array.isArray(this.article.tags)
        ? this.article.tags
        : [];
      return this.article.tags;
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
      this.article.parisDistrict = normalizeParisDistrict(
        this.article.parisDistrict,
      );
    },

    // ── Authors ───────────────────────────────────────────────────────────────
    getAuthorLabel(author: any) {
      const first =
        typeof author?.firstName === "string" ? author.firstName.trim() : "";
      const last =
        typeof author?.lastName === "string" ? author.lastName.trim() : "";
      return `${first} ${last}`.trim();
    },
    getAuthorAvatarUrl(author: any) {
      if (typeof author?.avatarUrl === "string" && author.avatarUrl.trim()) {
        return author.avatarUrl.trim();
      }
      if (typeof author?.avatar === "string" && author.avatar.trim()) {
        return author.avatar.trim();
      }
      return "";
    },
    getSelectedAuthorDisplay() {
      if (this.useNewAuthor) {
        return {
          name: `${this.newAuthorFirstName.trim()} ${this.newAuthorLastName.trim()}`.trim(),
          avatarUrl: "",
        };
      }

      const selectedAuthor = this.authors.find(
        (author: any) => author.id === this.selectedAuthorId,
      );
      if (selectedAuthor) {
        return {
          name: this.getAuthorLabel(selectedAuthor),
          avatarUrl: this.getAuthorAvatarUrl(selectedAuthor),
        };
      }

      const fallbackAuthor = this.article?.author;
      if (fallbackAuthor?.firstName || fallbackAuthor?.lastName) {
        return {
          name: this.getAuthorLabel(fallbackAuthor),
          avatarUrl: this.getAuthorAvatarUrl(fallbackAuthor),
        };
      }

      return {
        name: "",
        avatarUrl: "",
      };
    },
    getPreviewAuthorName() {
      const currentDisplay = this.getSelectedAuthorDisplay();
      return currentDisplay.name || this.previewAuthorDisplay.name || "Автор";
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
      const item = (this.relatedContentLists as Record<string, any[]>)[
        type
      ]?.find((entry) => entry.id === id);
      return item?.title || id;
    },
    addRelatedContent() {
      const type = this.selectedRelatedContentType;
      const id = this.selectedRelatedContentId;
      if (!type || !id) return;

      const normalized = sanitizeRelatedContent(
        (this.article as any).relatedContent,
      );
      if (this.articleId && type === "article" && id === this.articleId) {
        ui()?.showToast?.(
          "Нельзя привязать текущий материал к самому себе.",
          "error",
        );
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
      const normalized = sanitizeRelatedContent(
        (this.article as any).relatedContent,
      );
      normalized[type] = normalized[type].filter((itemId) => itemId !== id);
      (this.article as any).relatedContent = normalized;
    },

    // ── Tips-item blocks ──────────────────────────────────────────────────────
    addTipsItem() {
      if (!this.commitOpenItemBeforeAction()) return;
      this.article.contentBlocks.push(createTipsItem());
      const newIndex = this.article.contentBlocks.length - 1;
      this.editBlock(newIndex);
    },

    editBlock(index: number) {
      this.editingIndex = index;
      // JSON round-trip strips Alpine reactive proxies; structuredClone does not work on them
      this.editingBlock = JSON.parse(
        JSON.stringify(this.article.contentBlocks[index]),
      ); // NOSONAR
    },

    updateBlock() {
      if (this.editingIndex !== null) {
        if (this.uploading) {
          ui()?.showToast?.(
            "Подожди — загрузка файла ещё не завершилась.",
            "error",
          );
          return;
        }
        this.article.contentBlocks[this.editingIndex] = this.editingBlock;
        this.cancelEdit();
      }
    },

    commitOpenItemBeforeAction() {
      if (this.uploading) {
        ui()?.showToast?.(
          "Подожди — загрузка файла ещё не завершилась.",
          "error",
        );
        return false;
      }

      if (this.editingIndex !== null) {
        this.updateBlock();
        if (this.editingIndex !== null) return false;
      }

      return true;
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
      this._uploadFile(
        file,
        "tips-articles",
        (url) => {
          this.article.imageUrl = url;
        },
        null,
      );
    },

    handleItemImageUpload(event: Event) {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file || !this.editingBlock) return;
      const blockIndex = this.editingIndex;
      this._uploadFile(
        file,
        "tips-articles",
        (url) => {
          this.editingBlock.imageUrl = url;
        },
        blockIndex,
      );
    },

    async _uploadFile(
      raw: File,
      folder: string,
      onSuccess: (url: string) => void,
      blockIndex: number | null = null,
    ) {
      this.uploading = true;
      this.uploadingBlockIndex = blockIndex;
      this.uploadProgress = 0;
      const file = await compressImage(raw);
      const storageRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
      const task = uploadBytesResumable(storageRef, file);

      task.on(
        "state_changed",
        (snap) => {
          this.uploadProgress = (snap.bytesTransferred / snap.totalBytes) * 100;
        },
        (error) => {
          console.error("Upload failed:", error);
          ui()?.showToast?.(`Ошибка загрузки: ${error.message}`, "error");
          this.uploading = false;
          this.uploadingBlockIndex = null;
        },
        () => {
          getDownloadURL(task.snapshot.ref).then((url) => {
            onSuccess(url);
            this.uploading = false;
            this.uploadingBlockIndex = null;
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
            globalThis.location.href = redirectUrl || "/dashboard/tips";
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
      if (!this.commitOpenItemBeforeAction()) return;

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
      this.article.parisDistrict = normalizeParisDistrict(
        this.article.parisDistrict,
      );

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
          parisSubCategories: isParisCategory
            ? this.article.parisSubCategories
            : [],
          parisDistrict: isParisCategory
            ? this.article.parisDistrict || null
            : null,
          binaryForGuide: false,
          isHotContent: Boolean(this.article.isHotContent),
          isMainInCategory: Boolean(this.article.isMainInCategory),
          published: Boolean(this.article.published),
          content: this.article.contentBlocks,
          relatedContent: sanitizeRelatedContent(
            (this.article as any).relatedContent,
            "article",
            this.articleId,
          ),
          contentCollectionId: normalizeContentCollectionId(
            this.article.contentCollectionId,
          ),
        };

        if (this.isEditMode && this.articleId) {
          await articlesApi.update(this.articleId, payload);
          globalThis.localStorage.removeItem("tipsPreview");
          ui()?.showToast?.("Статья обновлена!");
          setTimeout(() => {
            globalThis.location.href = this.onSaveRedirect || "/dashboard/tips";
          }, 1500);
        } else {
          await articlesApi.create(payload);
          globalThis.localStorage.removeItem("tipsPreview");
          ui()?.showToast?.("Статья создана!");
          setTimeout(() => {
            globalThis.location.href = "/dashboard/tips";
          }, 1500);
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
