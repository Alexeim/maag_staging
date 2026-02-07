import { articlesApi, eventsApi, interviewsApi, flippersApi } from "@/lib/api/api";
import { app } from "../../lib/firebase/client";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

const storage = getStorage(app);

// Helper to create a new block object
const createBlock = (type, data) => ({ type, ...data });

export default function articleCreatorLogic(initialState = {}) {
  const {
    categoryTags = {},
    initialArticle = null,
    articleId = null,
    isEditMode = false,
    onSaveRedirect = null,
    ...restInitialState
  } = initialState as {
    categoryTags?: Record<string, Array<{ title: string; value: string }>>;
    initialArticle?: Record<string, unknown> | null;
    articleId?: string | null;
    isEditMode?: boolean;
    onSaveRedirect?: string | null;
  };

  const categoryLabels: Record<string, string> = {
    culture: "Культура",
    paris: "Париж",
    news: "Новости",
    hotContent: "Самое Читаемое",
  };

  const categoryMapLegacy: Record<string, string> = Object.fromEntries(
    Object.entries(categoryLabels).map(([key, label]) => [label, key]),
  );

  const normalizeCategory = (value?: string) => {
    if (!value) {
      return value;
    }
    return categoryMapLegacy[value] || value;
  };

  const buildLegacyTagMap = (category?: string) => {
    if (!category) {
      return {};
    }
    const tags = categoryTags[category];
    if (!tags) {
      return {};
    }
    return Object.fromEntries(tags.map((tag) => [tag.title, tag.value]));
  };

  const slugifyTag = (value: string) => {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const normalizeTags = (tags?: string[], category?: string) => {
    if (!Array.isArray(tags)) {
      return [];
    }
    const legacyMap = buildLegacyTagMap(category);
    const deduped = new Set<string>();
    const normalized: string[] = [];

    for (const rawTag of tags) {
      if (typeof rawTag !== "string") {
        continue;
      }
      const trimmed = rawTag.trim();
      if (!trimmed) {
        continue;
      }
      const mapped = legacyMap[trimmed] || trimmed;
      if (!deduped.has(mapped)) {
        deduped.add(mapped);
        normalized.push(mapped);
      }
    }

    return normalized;
  };

  const normalizeTechTags = (tags?: string[]) => {
    if (!Array.isArray(tags)) {
      return [];
    }
    const deduped = new Set<string>();
    const normalized: string[] = [];
    for (const rawTag of tags) {
      if (typeof rawTag !== "string") {
        continue;
      }
      const slug = slugifyTag(rawTag);
      if (!slug || deduped.has(slug)) {
        continue;
      }
      deduped.add(slug);
      normalized.push(slug);
    }
    return normalized;
  };

  const normalizeLoadedArticle = (data: any) => {
    if (!data || typeof data !== "object") {
      return null;
    }
    const copy = JSON.parse(JSON.stringify(data));
    const normalizedCategory = normalizeCategory(copy.category);
    const isHotContentLegacy =
      Boolean(copy.isHotContent) || normalizedCategory === "hotContent";
    copy.category =
      isHotContentLegacy && normalizedCategory === "hotContent"
        ? ""
        : normalizedCategory;
    copy.isHotContent = isHotContentLegacy;
    const blocks = Array.isArray(copy.content)
      ? copy.content
      : Array.isArray(copy.contentBlocks)
        ? copy.contentBlocks
        : [];
    copy.contentBlocks = blocks;
    copy.content = blocks;
    copy.tags = normalizeTags(copy.tags, copy.category);
    copy.techTags = normalizeTechTags(copy.techTags ?? copy.customTags);
    copy.imageCaption = copy.imageCaption ?? "";
    return copy;
  };

  return {
    article: {
      title: "",
      lead: "", // Вводка — краткое описание под заголовком
      imageUrl: "",
      imageCaption: "", // <-- Added caption for the main image
      // --- REFACTORED: from 'paragraphs' to 'contentBlocks' ---
      contentBlocks: [],
      tags: [],
      techTags: [],
      category: "", // <-- Added category
      isHotContent: false,
      isOnLanding: false,
      isMainInCategory: false,
    },

    // --- State for managing content lists for link blocks ---
    contentListsLoading: false,
    allArticles: [],
    allEvents: [],
    allInterviews: [],
    allFlippers: [],

    // --- State for managing the block creation UI ---
    showBlockOptions: false,

    // --- State for editing a specific block ---
    editingIndex: null,
    editingBlock: null, // Will hold a copy of the block being edited

    isEditingTitle: false,
    editingTitleText: "",

    // --- State for editing the main image caption ---
    isEditingCaption: false,
    editingCaptionText: "",

    uploading: false,
    uploadProgress: 0,

    categoryTags,
    articleId,
    isEditMode,
    onSaveRedirect,
    newTagInput: "",

    categoryLabels,
    getCategoryLabel(value?: string) {
      if (!value) {
        return "Category";
      }
      return this.categoryLabels[value] || value;
    },
    getAvailableTags() {
      if (!this.article?.category) {
        return [];
      }
      return this.categoryTags[this.article.category] || [];
    },
    getTagLabel(value: string) {
      const availableForCurrent = this.getAvailableTags();
      const match = availableForCurrent.find((tag) => tag.value === value);
      if (match) {
        return match.title;
      }
      // Fallback: try other categories
      for (const tags of Object.values(this.categoryTags)) {
        const found = tags.find((tag) => tag.value === value);
        if (found) {
          return found.title;
        }
      }
      return value;
    },
    isTagSelected(value: string) {
      return this.article.tags.includes(value);
    },
    toggleTag(value: string) {
      const normalized = normalizeTags([value], this.article.category)[0] || value;
      const idx = this.article.tags.indexOf(normalized);
      if (idx >= 0) {
        this.article.tags.splice(idx, 1);
      } else {
        this.article.tags.push(normalized);
        // Ensure custom tech tag with the same value is removed to avoid duplicates
        const techIdx = this.article.techTags.indexOf(normalized);
        if (techIdx >= 0) {
          this.article.techTags.splice(techIdx, 1);
        }
      }
      this.article.tags = normalizeTags(this.article.tags, this.article.category);
    },
    removeTag(value: string) {
      const idx = this.article.tags.indexOf(value);
      if (idx >= 0) {
        this.article.tags.splice(idx, 1);
      }
    },
    addCustomTag() {
      const slug = slugifyTag(this.newTagInput);
      if (!slug) {
        window.Alpine?.store("ui")?.showToast?.(
          "Введи тег латиницей — это значение уходит в базу данных.",
          "error",
        );
        return;
      }
      if (this.article.tags.includes(slug)) {
        window.Alpine?.store("ui")?.showToast?.(
          "Такой тег уже выбран.",
          "info",
        );
        this.newTagInput = "";
        return;
      }
      if (this.article.techTags.includes(slug)) {
        window.Alpine?.store("ui")?.showToast?.(
          "Такой техтег уже есть.",
          "info",
        );
        this.newTagInput = "";
        return;
      }
      this.article.techTags.push(slug);
      this.article.techTags = normalizeTechTags(this.article.techTags);
      this.newTagInput = "";
    },
    removeTechTag(value: string) {
      const idx = this.article.techTags.indexOf(value);
      if (idx >= 0) {
        this.article.techTags.splice(idx, 1);
      }
    },
    handleCategoryChange(value: string) {
      this.article.category = value;
      this.article.tags = normalizeTags(this.article.tags, value);
      this.article.techTags = normalizeTechTags(this.article.techTags);
    },

    async fetchContentLists() {
      this.contentListsLoading = true;
      try {
        const [articles, events, interviews, flippers] = await Promise.all([
          articlesApi.list(),
          eventsApi.list(),
          interviewsApi.list(),
          flippersApi.list(),
        ]);
        this.allArticles = articles;
        this.allEvents = events;
        this.allInterviews = interviews;
        this.allFlippers = flippers;
      } catch (error) {
        console.error("Failed to fetch content lists:", error);
        window.Alpine?.store("ui")?.showToast?.(
          "Не удалось загрузить списки контента для ссылок.",
          "error",
        );
      } finally {
        this.contentListsLoading = false;
      }
    },

    getFilteredContentList(contentType) {
      switch (contentType) {
        case "article":
          return this.allArticles;
        case "event":
          return this.allEvents;
        case "interview":
          return this.allInterviews;
        case "flipper":
          return this.allFlippers;
        default:
          return [];
      }
    },
    init() {
      type PreviewState = {
        article?: unknown;
        articleId?: string | null;
        isEditMode?: boolean;
      };
      let previewState: PreviewState | null = null;

      if (typeof window !== "undefined") {
        try {
          const stored = window.localStorage?.getItem("articlePreview");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === "object") {
              if ("article" in parsed || "articleId" in parsed || "isEditMode" in parsed) {
                previewState = parsed as PreviewState;
              } else {
                previewState = { article: parsed } as PreviewState;
              }
            } else {
              previewState = { article: parsed } as PreviewState;
            }
          }
        } catch (error) {
          console.error("Failed to parse preview draft:", error);
        }
      }

      if (initialArticle) {
        const normalizedInitial = normalizeLoadedArticle(initialArticle);
        if (normalizedInitial) {
          this.article = normalizedInitial;
        }
      }

      if (articleId) {
        this.articleId = articleId;
        this.isEditMode = true;
      }
      if (typeof isEditMode === "boolean") {
        this.isEditMode = isEditMode;
      }
      if (onSaveRedirect) {
        this.onSaveRedirect = onSaveRedirect;
      }

      const shouldApplyPreview = (() => {
        if (!previewState?.article) {
          return false;
        }
        if (this.isPreview) {
          return true;
        }
        const previewId =
          typeof previewState.articleId === "string" && previewState.articleId
            ? previewState.articleId
            : null;
        const isPreviewEdit = Boolean(previewState?.isEditMode);
        const isSameEdit =
          this.isEditMode && previewId !== null && previewId === this.articleId;
        const isCreateDraft =
          !this.isEditMode && !previewId && !isPreviewEdit;
        return isSameEdit || isCreateDraft;
      })();

      if (shouldApplyPreview && previewState?.article) {
        const normalizedPreview = normalizeLoadedArticle(previewState.article);
        if (normalizedPreview) {
          if (this.isPreview) {
            this.article = normalizedPreview;
            if (typeof previewState.articleId === "string" && previewState.articleId) {
              this.articleId = previewState.articleId;
            }
            if (typeof previewState.isEditMode === "boolean") {
              this.isEditMode = previewState.isEditMode;
            }
          } else {
            Object.assign(this.article, normalizedPreview);
          }
        }
      } else if (previewState) {
        try {
          window.localStorage?.removeItem("articlePreview");
        } catch (error) {
          console.warn("Failed to cleanup mismatched preview draft:", error);
        }
      }

      this.article.tags = this.article.tags ?? [];
      this.article.techTags = this.article.techTags ?? [];
      this.article.lead = this.article.lead ?? "";
      this.article.isHotContent = Boolean(this.article.isHotContent);
      this.article.isOnLanding = Boolean(this.article.isOnLanding);
      this.article.isMainInCategory = Boolean(this.article.isMainInCategory);
      this.article.contentBlocks = Array.isArray(this.article.contentBlocks)
        ? this.article.contentBlocks
        : [];

      this.fetchContentLists();
    },

    // --- Title editing methods (unchanged) ---
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

    // --- Caption editing methods ---
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

    // --- Image Upload Method ---
    handleImageUpload(event, isCover = true, blockIndex = null, column = null) {
      const file = event.target.files[0];
      if (!file) return;

      this.uploading = true;
      this.uploadProgress = 0;

      const storageRef = ref(storage, `articles/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          this.uploadProgress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          console.error("Upload failed:", error);
          window.Alpine.store("ui").showToast(
            `Проблема загрузки картинки: ${error.message}`,
            "error",
          );
          this.uploading = false;
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            if (isCover) {
              this.article.imageUrl = downloadURL;
            } else if (blockIndex !== null && this.editingBlock) {
              if (this.editingBlock.type === "image") {
                this.editingBlock.url = downloadURL;
              } else if (this.editingBlock.type === "two-columns" && column) {
                this.editingBlock[column].content = downloadURL;
                this.editingBlock[column].type = 'image'; // Ensure type is image
              }
            }
            this.uploading = false;
            window.Alpine.store("ui").showToast("Картинка успешно загружена!");
          });
        },
      );
    },

    // --- REFACTORED: Block management methods ---

    // Opens the menu to select a new block type
    openBlockSelector() {
      this.showBlockOptions = true;
    },

    // Adds a new block of a specific type and opens it for editing
    addBlock(type) {
      let newBlockData = {};
      // Set default data based on block type
      switch (type) {
        case "paragraph":
        case "first-paragraph":
        case "h2":
        case "h3":
        case "quote":
          newBlockData = { text: "" };
          break;
        case "image":
          newBlockData = { url: "", caption: "" };
          break;
        case "two-columns":
          newBlockData = {
            left: { type: "text", content: "", caption: "" },
            right: { type: "text", content: "", caption: "" },
          };
          break;
        case "link":
          newBlockData = {
            text: "",
            linkedContentType: "article", // Default to article
            linkedContentId: "",
            linkedContentTitle: "",
          };
          break;
        // Add other cases here
        default:
          break;
      }

      const newBlock = createBlock(type, newBlockData);
      this.article.contentBlocks.push(newBlock);
      this.showBlockOptions = false;

      // Immediately open the new block for editing
      this.editBlock(this.article.contentBlocks.length - 1);
    },

    // Opens a block for editing
    editBlock(index) {
      this.editingIndex = index;
      // Create a deep copy to avoid modifying the original until save
      this.editingBlock = JSON.parse(
        JSON.stringify(this.article.contentBlocks[index]),
      );
    },

    // Saves the changes to the block
    updateBlock() {
      if (this.editingIndex !== null) {
        // You might want to add validation here
        this.article.contentBlocks[this.editingIndex] = this.editingBlock;
        this.cancelEdit();
      }
    },

    // Cancels the editing of a block
    cancelEdit() {
      this.editingIndex = null;
      this.editingBlock = null;
    },

    // Deletes a block
    deleteBlock(index) {
      const removeBlock = () => {
        this.article.contentBlocks.splice(index, 1);
      };

      const uiStore = window.Alpine?.store?.("ui");
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation("Ты точно хочешь удалить этот блок?", removeBlock);
      } else {
        console.warn('UI store недоступен, удаляем блок без подтверждения');
        removeBlock();
      }
    },

    // For Preview Page
    returnToEdit() {
      const target =
        this.isEditMode && this.articleId
          ? `/dashboard/article/${this.articleId}/edit`
          : "/dashboard/article/create";
      window.location.href = target;
    },

    // --- Preview and Save methods ---
    previewArticle() {
      const previewState = {
        article: this.article,
        articleId: this.articleId,
        isEditMode: this.isEditMode,
      };
      localStorage.setItem("articlePreview", JSON.stringify(previewState));
      window.location.href = "/dashboard/article/preview";
    },

    async saveArticle() {
      const normalizedCategory = normalizeCategory(this.article.category) || "";
      const isHotContentFlag =
        Boolean(this.article.isHotContent) ||
        normalizedCategory === "hotContent";
      this.article.isHotContent = isHotContentFlag;
      this.article.category =
        isHotContentFlag && normalizedCategory === "hotContent"
          ? ""
          : normalizedCategory;
      this.article.tags = normalizeTags(this.article.tags, this.article.category);
      this.article.techTags = normalizeTechTags(this.article.techTags);

      if (!this.article.category && !this.article.isHotContent) {
        window.Alpine.store("ui").showToast(
          "Выбери категорию перед сохранением — это обязательное поле.",
          "error",
        );
        return;
      }

      const hasTags =
        Array.isArray(this.article.tags) && this.article.tags.length > 0;
      const hasTechTags =
        Array.isArray(this.article.techTags) &&
        this.article.techTags.length > 0;

      if (!hasTags && !hasTechTags) {
        window.Alpine.store("ui").showToast(
          "Добавь хотя бы один тег или техтег — без них статья не сохранится.",
          "error",
        );
        return;
      }

      if (!this.article.imageUrl) {
        window.Alpine.store("ui").showToast(
          "Загрузи оболожку статьи - обязательно!!!",
          "error",
        );
        return;
      }

      try {
        const tagsForDb = this.article.tags.map((tag) => this.getTagLabel(tag));
        const payload = {
          title: this.article.title,
          lead: this.article.lead,
          imageUrl: this.article.imageUrl,
          imageCaption: this.article.imageCaption,
          authorId: "HxpjsagLQxlUb2oCiM6h",
          content: this.article.contentBlocks,
          category: this.article.category,
          tags: tagsForDb,
          techTags: this.article.techTags,
          isHotContent: this.article.isHotContent,
          isOnLanding: this.article.isOnLanding,
          isMainInCategory: this.article.isMainInCategory,
        };

        if (this.isEditMode && this.articleId) {
          await articlesApi.update(this.articleId, payload);
          window.Alpine.store("ui").showToast("Статья успешно обновлена!");
          localStorage.removeItem("articlePreview");
          const redirectTo = this.onSaveRedirect || `/dashboard/article/${this.articleId}/edit`;
          window.location.href = redirectTo;
        } else {
          const result = await articlesApi.create(payload);
          window.Alpine.store("ui").showToast("Статья успешно создана! Молодец!");
          localStorage.removeItem("articlePreview");
          window.location.href = `/article/${result.id}`;
        }
      } catch (error) {
        console.error("Проблемка сохранения:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Во время сохранения статьи возникла ошибочка.";
        window.Alpine.store("ui").showToast(message, "error");
      }
    },

    ...restInitialState,

    deleteArticle(redirectUrl) {
      if (!this.articleId) return;

      const performDelete = async () => {
        try {
          const response = await articlesApi.del(this.articleId);
          if (response.status !== 200 && response.status !== 204) {
            throw new Error(`Deletion failed with status: ${response.status}`);
          }
          window.Alpine.store("ui").showToast("Статья удалена");
          setTimeout(() => {
            window.location.href = redirectUrl || '/dashboard';
          }, 1500);
        } catch (error) {
          console.error(error);
          window.Alpine.store("ui").showToast("Не удалось удалить статью.", "error");
        }
      };

      const uiStore = window.Alpine?.store?.("ui");
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation(
          `Удалить статью «${this.article.title}»? Это действие необратимо.`,
          performDelete
        );
      } else {
        if (confirm("Вы уверены, что хотите удалить эту статью?")) {
          performDelete();
        }
      }
    },
  };
}
