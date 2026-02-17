import { articlesApi, authorsApi } from "@/lib/api/api";
import { app } from "../../lib/firebase/client";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

const storage = getStorage(app);

const createBlock = (type: string, data: Record<string, unknown>) => ({ type, ...data });

export default function newsCreatorLogic(initialState: Record<string, unknown> = {}) {
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
  };

  const categoryMapLegacy: Record<string, string> = Object.fromEntries(
    Object.entries(categoryLabels).map(([key, label]) => [label, key]),
  );

  const normalizeCategory = (value?: string) => {
    if (!value) return value;
    return categoryMapLegacy[value] || value;
  };

  const buildLegacyTagMap = (category?: string) => {
    if (!category) return {};
    const tags = (categoryTags as Record<string, Array<{ title: string; value: string }>>)[category];
    if (!tags) return {};
    return Object.fromEntries(tags.map((tag) => [tag.title, tag.value]));
  };

  const slugifyTag = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const normalizeTags = (tags?: string[], category?: string) => {
    if (!Array.isArray(tags)) return [];
    const legacyMap = buildLegacyTagMap(category);
    const deduped = new Set<string>();
    const normalized: string[] = [];
    for (const rawTag of tags) {
      if (typeof rawTag !== "string") continue;
      const trimmed = rawTag.trim();
      if (!trimmed) continue;
      const mapped = legacyMap[trimmed] || trimmed;
      if (!deduped.has(mapped)) {
        deduped.add(mapped);
        normalized.push(mapped);
      }
    }
    return normalized;
  };

  const normalizeTechTags = (tags?: string[]) => {
    if (!Array.isArray(tags)) return [];
    const deduped = new Set<string>();
    const normalized: string[] = [];
    for (const rawTag of tags) {
      if (typeof rawTag !== "string") continue;
      const slug = slugifyTag(rawTag);
      if (!slug || deduped.has(slug)) continue;
      deduped.add(slug);
      normalized.push(slug);
    }
    return normalized;
  };

  const normalizeLoadedArticle = (data: any) => {
    if (!data || typeof data !== "object") return null;
    const copy = JSON.parse(JSON.stringify(data));
    copy.category = normalizeCategory(copy.category) || "";
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
    copy.lead = copy.lead ?? "";
    copy.isNews = true;
    return copy;
  };

  return {
    article: {
      title: "",
      lead: "",
      imageUrl: "",
      imageCaption: "",
      contentBlocks: [] as any[],
      tags: [] as string[],
      techTags: [] as string[],
      category: "",
      isHotContent: false,
      isOnLanding: false,
      isMainInCategory: false,
      isNews: true,
    },

    showBlockOptions: false,
    editingIndex: null as number | null,
    editingBlock: null as any,

    isEditingTitle: false,
    editingTitleText: "",

    isEditingCaption: false,
    editingCaptionText: "",

    uploading: false,
    uploadProgress: 0,

    categoryTags,
    articleId,
    isEditMode,
    onSaveRedirect,
    newTagInput: "",
    authorsLoading: false,
    authors: [],
    selectedAuthorId: "",
    useNewAuthor: false,
    newAuthorFirstName: "",
    newAuthorLastName: "",

    categoryLabels,
    getCategoryLabel(value?: string) {
      if (!value) return "Category";
      return this.categoryLabels[value] || value;
    },
    getAvailableTags() {
      if (!this.article?.category) return [];
      return this.categoryTags[this.article.category] || [];
    },
    getTagLabel(value: string) {
      const availableForCurrent = this.getAvailableTags();
      const match = availableForCurrent.find((tag: any) => tag.value === value);
      if (match) return match.title;
      for (const tags of Object.values(this.categoryTags)) {
        const found = (tags as any[]).find((tag: any) => tag.value === value);
        if (found) return found.title;
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
        const techIdx = this.article.techTags.indexOf(normalized);
        if (techIdx >= 0) this.article.techTags.splice(techIdx, 1);
      }
      this.article.tags = normalizeTags(this.article.tags, this.article.category);
    },
    removeTag(value: string) {
      const idx = this.article.tags.indexOf(value);
      if (idx >= 0) this.article.tags.splice(idx, 1);
    },
    addCustomTag() {
      const slug = slugifyTag(this.newTagInput);
      if (!slug) {
        (window as any).Alpine?.store("ui")?.showToast?.(
          "Введи тег латиницей — это значение уходит в базу данных.",
          "error",
        );
        return;
      }
      if (this.article.tags.includes(slug) || this.article.techTags.includes(slug)) {
        (window as any).Alpine?.store("ui")?.showToast?.("Такой тег уже есть.", "info");
        this.newTagInput = "";
        return;
      }
      this.article.techTags.push(slug);
      this.article.techTags = normalizeTechTags(this.article.techTags);
      this.newTagInput = "";
    },
    removeTechTag(value: string) {
      const idx = this.article.techTags.indexOf(value);
      if (idx >= 0) this.article.techTags.splice(idx, 1);
    },
    handleCategoryChange(value: string) {
      this.article.category = value;
      this.article.tags = normalizeTags(this.article.tags, value);
      this.article.techTags = normalizeTechTags(this.article.techTags);
    },
    getAuthorLabel(author: any) {
      const firstName =
        typeof author?.firstName === "string" ? author.firstName.trim() : "";
      const lastName =
        typeof author?.lastName === "string" ? author.lastName.trim() : "";
      return `${firstName} ${lastName}`.trim();
    },
    ensureSelectedAuthorPresent() {
      if (!this.selectedAuthorId) {
        return;
      }
      const exists = this.authors.some(
        (author: any) => author.id === this.selectedAuthorId,
      );
      if (exists) {
        return;
      }
      const fallbackAuthor = this.article?.author;
      if (fallbackAuthor?.firstName || fallbackAuthor?.lastName) {
        this.authors.unshift({
          id: this.selectedAuthorId,
          firstName: fallbackAuthor.firstName || "",
          lastName: fallbackAuthor.lastName || "",
          role: fallbackAuthor.role || "author",
          avatar: fallbackAuthor.avatar || "",
        });
      }
    },
    async loadAuthors() {
      this.authorsLoading = true;
      try {
        const authors = await authorsApi.list();
        this.authors = Array.isArray(authors) ? authors : [];
        this.ensureSelectedAuthorPresent();
      } catch (error) {
        console.error("Failed to fetch authors:", error);
      } finally {
        this.authorsLoading = false;
      }
    },
    async resolveAuthorId() {
      if (this.useNewAuthor) {
        const firstName = this.newAuthorFirstName.trim();
        const lastName = this.newAuthorLastName.trim();
        if (!firstName || !lastName) {
          throw new Error("Заполни имя и фамилию нового автора.");
        }
        const createdAuthor = await authorsApi.create({ firstName, lastName });
        this.authors.unshift(createdAuthor);
        this.selectedAuthorId = createdAuthor.id;
        this.useNewAuthor = false;
        this.newAuthorFirstName = "";
        this.newAuthorLastName = "";
        return createdAuthor.id;
      }
      if (!this.selectedAuthorId) {
        throw new Error("Выбери автора из списка или создай нового.");
      }
      return this.selectedAuthorId;
    },

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

      this.article.tags = this.article.tags ?? [];
      this.article.techTags = this.article.techTags ?? [];
      this.article.lead = this.article.lead ?? "";
      this.article.isHotContent = Boolean(this.article.isHotContent);
      this.article.isOnLanding = Boolean(this.article.isOnLanding);
      this.article.isMainInCategory = Boolean(this.article.isMainInCategory);
      this.article.isNews = true;
      this.article.contentBlocks = Array.isArray(this.article.contentBlocks)
        ? this.article.contentBlocks
        : [];
      this.selectedAuthorId =
        typeof this.article.authorId === "string" ? this.article.authorId : "";
      this.ensureSelectedAuthorPresent();
      this.loadAuthors();
    },

    // Title editing
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

    // Caption editing
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

    // Image upload
    handleImageUpload(event: Event) {
      const file = (event.target as HTMLInputElement).files?.[0];
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
          (window as any).Alpine.store("ui").showToast(
            `Проблема загрузки картинки: ${error.message}`,
            "error",
          );
          this.uploading = false;
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            this.article.imageUrl = downloadURL;
            this.uploading = false;
            (window as any).Alpine.store("ui").showToast("Картинка успешно загружена!");
          });
        },
      );
    },

    // Block management (paragraph only)
    openBlockSelector() {
      const newBlock = createBlock("paragraph", { text: "" });
      this.article.contentBlocks.push(newBlock);
      this.editBlock(this.article.contentBlocks.length - 1);
    },

    editBlock(index: number) {
      this.editingIndex = index;
      this.editingBlock = JSON.parse(
        JSON.stringify(this.article.contentBlocks[index]),
      );
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
      const removeBlock = () => {
        this.article.contentBlocks.splice(index, 1);
      };
      const uiStore = (window as any).Alpine?.store?.("ui");
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation("Удалить этот блок?", removeBlock);
      } else {
        removeBlock();
      }
    },

    // Save
    async saveArticle() {
      const normalizedCategory = normalizeCategory(this.article.category) || "";
      this.article.category = normalizedCategory;
      this.article.tags = normalizeTags(this.article.tags, this.article.category);
      this.article.techTags = normalizeTechTags(this.article.techTags);

      if (!this.article.category) {
        (window as any).Alpine.store("ui").showToast(
          "Выбери категорию перед сохранением.",
          "error",
        );
        return;
      }

      if (!this.article.imageUrl) {
        (window as any).Alpine.store("ui").showToast(
          "Загрузи обложку новости!",
          "error",
        );
        return;
      }

      try {
        const resolvedAuthorId = await this.resolveAuthorId();
        const tagsForDb = this.article.tags.map((tag: string) => this.getTagLabel(tag));
        const payload = {
          title: this.article.title,
          lead: this.article.lead,
          imageUrl: this.article.imageUrl,
          imageCaption: this.article.imageCaption,
          authorId: resolvedAuthorId,
          content: this.article.contentBlocks,
          category: this.article.category,
          tags: tagsForDb,
          techTags: this.article.techTags,
          isHotContent: Boolean(this.article.isHotContent),
          isOnLanding: Boolean(this.article.isOnLanding),
          isMainInCategory: Boolean(this.article.isMainInCategory),
          isNews: true,
        };

        if (this.isEditMode && this.articleId) {
          await articlesApi.update(this.articleId, payload);
          (window as any).Alpine.store("ui").showToast("Новость обновлена!");
          const redirectTo = this.onSaveRedirect || `/dashboard/news/${this.articleId}/edit`;
          window.location.href = redirectTo;
        } else {
          const result = await articlesApi.create(payload);
          (window as any).Alpine.store("ui").showToast("Новость создана!");
          window.location.href = `/news/${result.id}`;
        }
      } catch (error) {
        console.error("Save error:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Ошибка сохранения новости.";
        (window as any).Alpine.store("ui").showToast(message, "error");
      }
    },

    deleteArticle(redirectUrl: string) {
      if (!this.articleId) return;

      const performDelete = async () => {
        try {
          await articlesApi.delete(this.articleId!);
          (window as any).Alpine.store("ui").showToast("Новость удалена");
          setTimeout(() => {
            window.location.href = redirectUrl || "/dashboard/news";
          }, 1500);
        } catch (error) {
          console.error(error);
          (window as any).Alpine.store("ui").showToast("Не удалось удалить.", "error");
        }
      };

      const uiStore = (window as any).Alpine?.store?.("ui");
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation(
          `Удалить новость «${this.article.title}»? Это необратимо.`,
          performDelete,
        );
      } else {
        if (confirm("Удалить новость?")) performDelete();
      }
    },

    ...restInitialState,
  };
}
