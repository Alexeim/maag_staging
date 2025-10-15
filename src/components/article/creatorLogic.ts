import { articlesApi } from "@/lib/api/api";
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
    copy.contentBlocks = Array.isArray(copy.contentBlocks)
      ? copy.contentBlocks
      : [];
    copy.tags = normalizeTags(copy.tags, copy.category);
    copy.techTags = normalizeTechTags(copy.techTags ?? copy.customTags);
    copy.imageCaption = copy.imageCaption ?? "";
    return copy;
  };

  return {
    article: {
      title: "",
      imageUrl: "",
      imageCaption: "", // <-- Added caption for the main image
      // --- REFACTORED: from 'paragraphs' to 'contentBlocks' ---
      contentBlocks: [],
      tags: [],
      techTags: [],
      category: "", // <-- Added category
      isHotContent: false,
    },

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

    init() {
      // The `isPreview` flag is passed from the page component
      if (this.isPreview) {
        // On the preview page, always load from storage, replacing the initial object
        const previewData = localStorage.getItem("articlePreview");
        if (previewData) {
          const normalized = normalizeLoadedArticle(JSON.parse(previewData));
          if (normalized) {
            this.article = normalized;
          }
        }
      } else {
              if (this.isEditMode) {
                // On the create page, merge if a draft exists to preserve the initial structure
                const draftData = localStorage.getItem("articlePreview");
                if (draftData) {
                  const normalized = normalizeLoadedArticle(JSON.parse(draftData));
                  if (normalized) {
                    Object.assign(this.article, normalized);
                  }
                }
              }      }
      this.article.tags = this.article.tags ?? [];
      this.article.techTags = this.article.techTags ?? [];
      this.article.isHotContent = Boolean(this.article.isHotContent);

      if (initialArticle) {
        const normalized = normalizeLoadedArticle(initialArticle);
        if (normalized) {
          Object.assign(this.article, normalized);
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
    handleImageUpload(event, isCover = true, blockIndex = null) {
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
            } else if (
              blockIndex !== null &&
              this.editingBlock &&
              this.editingBlock.type === "image"
            ) {
              // Update the URL for the specific image block being edited
              this.editingBlock.url = downloadURL;
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
      window.location.href = "/article/create";
    },

    // --- Preview and Save methods ---
    previewArticle() {
      localStorage.setItem("articlePreview", JSON.stringify(this.article));
      window.location.href = "/article/preview";
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
          imageUrl: this.article.imageUrl,
          imageCaption: this.article.imageCaption,
          authorId: "HxpjsagLQxlUb2oCiM6h",
          content: this.article.contentBlocks,
          category: this.article.category,
          tags: tagsForDb,
          techTags: this.article.techTags,
          isHotContent: this.article.isHotContent,
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
