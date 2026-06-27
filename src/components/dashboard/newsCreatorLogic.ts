import { newsApi, authorsApi } from "@/lib/api/api";
import { app } from "../../lib/firebase/client";
import {
  MATERIAL_LINK_TYPE_OPTIONS,
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
import {
  reindexContentBlocks,
  sortAndNormalizeContentBlocks,
  withBlockMeta,
} from "@/lib/utils/contentBlocks";
import {
  getBlockSummary as buildBlockSummary,
  getBlockTypeLabel as resolveBlockTypeLabel,
  getColumnTypeLabel as resolveColumnTypeLabel,
  getLinkedBlockTitle as resolveLinkedBlockTitle,
  getLinkedContentTypeLabel as resolveLinkedContentTypeLabel,
  truncatePreviewText,
} from "@/lib/utils/contentBlockPreview";
import { createContentCollectionEditorState } from "@/lib/utils/contentCollectionEditor";
import { normalizeContentCollectionId } from "@/lib/utils/contentCollections";
import { compressImage } from "@/lib/images/compressImage";

const storage = getStorage(app);

const createBlock = (
  type: string,
  data: Record<string, unknown>,
  position = 0,
) => withBlockMeta({ type, ...data }, position);

export default function newsCreatorLogic(
  initialState: Record<string, unknown> = {},
) {
  const {
    categoryTags = {},
    initialArticle = null,
    articleId = null,
    isEditMode = false,
    isPreview = false,
    onSaveRedirect = null,
    ...restInitialState
  } = initialState as {
    categoryTags?: Record<string, Array<{ title: string; value: string }>>;
    initialArticle?: Record<string, unknown> | null;
    articleId?: string | null;
    isEditMode?: boolean;
    isPreview?: boolean;
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
    const tags = normalizeTagOptions(
      (
        categoryTags as Record<string, Array<{ title: string; value: string }>>
      )[category],
    );
    return Object.fromEntries(tags.map((tag) => [tag.title, tag.value]));
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

  const normalizeLoadedArticle = (data: any) => {
    if (!data || typeof data !== "object") return null;
    const copy = JSON.parse(JSON.stringify(data));
    copy.category = normalizeCategory(copy.category) || "";
    const blocks = Array.isArray(copy.content)
      ? copy.content
      : Array.isArray(copy.contentBlocks)
        ? copy.contentBlocks
        : [];
    copy.contentBlocks = sortAndNormalizeContentBlocks(blocks);
    copy.content = copy.contentBlocks;
    copy.tags = normalizeTags(copy.tags, copy.category);
    copy.imageCaption = copy.imageCaption ?? "";
    copy.lead = copy.lead ?? "";
    copy.cardLead = copy.cardLead ?? "";
    copy.published = Boolean(copy.published);
    copy.publishedAt = copy.publishedAt ?? null;
    delete copy.isHotContent;
    delete copy.isNotebookContent;
    delete copy.isMaagChoice;
    copy.relatedContent = sanitizeRelatedContent(copy.relatedContent);
    return copy;
  };

  return {
    article: {
      title: "",
      lead: "",
      cardLead: "",
      imageUrl: "",
      imageCaption: "",
      contentBlocks: [] as any[],
      tags: [] as string[],
      category: "",
      isMainInCategory: false,
      published: false,
      publishedAt: null,
      relatedContent: createEmptyRelatedContent(),
      contentCollectionId: null as string | null,
    },

    showBlockOptions: false,
    editingIndex: null as number | null,
    editingBlock: null as any,
    draggedBlockId: null as string | null,
    dragOverBlockId: null as string | null,

    isEditingTitle: false,
    editingTitleText: "",

    isEditingCaption: false,
    editingCaptionText: "",

    uploading: false,
    uploadProgress: 0,
    isSaving: false,
    contentListsLoading: false,
    relatedContentLists: createEmptyRelatedContentLists(),
    relatedContentTypeOptions: RELATED_CONTENT_TYPE_OPTIONS,
    materialLinkTypeOptions: MATERIAL_LINK_TYPE_OPTIONS,
    selectedRelatedContentType: "article",
    selectedRelatedContentId: "",
    ...createContentCollectionEditorState("article"),

    categoryTags,
    articleId,
    isEditMode,
    onSaveRedirect,
    authorsLoading: false,
    authors: [],
    selectedAuthorId: "",
    useNewAuthor: false,
    newAuthorFirstName: "",
    newAuthorLastName: "",
    previewAuthorDisplay: {
      name: "",
      avatarUrl: "",
    },

    categoryLabels,
    getCategoryLabel(value?: string) {
      if (!value) return "Category";
      return this.categoryLabels[value] || value;
    },
    getBlockTypeLabel(type?: string) {
      return resolveBlockTypeLabel(type);
    },
    getLinkedContentTypeLabel(type?: string) {
      return resolveLinkedContentTypeLabel(type);
    },
    getColumnTypeLabel(type?: string) {
      return resolveColumnTypeLabel(type);
    },
    getPreviewText(value?: string, maxLength = 120) {
      return truncatePreviewText(value, maxLength);
    },
    getLinkedBlockTitle(block: Record<string, unknown>) {
      return resolveLinkedBlockTitle(block, (currentBlock) => {
        const contentType =
          typeof currentBlock.linkedContentType === "string"
            ? currentBlock.linkedContentType
            : "";
        const contentId =
          typeof currentBlock.linkedContentId === "string"
            ? currentBlock.linkedContentId
            : "";
        if (!contentType || !contentId) {
          return "";
        }
        return this.getRelatedContentItemLabel(contentType, contentId);
      });
    },
    getBlockSummary(block: Record<string, unknown>) {
      return buildBlockSummary(block, {
        resolveLinkedTitle: (currentBlock) =>
          this.getLinkedBlockTitle(currentBlock),
      });
    },
    syncContentBlockOrder(blocks = this.article.contentBlocks) {
      this.article.contentBlocks = reindexContentBlocks(blocks);
    },
    getAvailableTags() {
      if (!this.article?.category) return [];
      return normalizeTagOptions(this.categoryTags[this.article.category]);
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
    async fetchContentLists() {
      this.contentListsLoading = true;
      try {
        this.relatedContentLists = await fetchRelatedContentLists();
      } catch (error) {
        console.error("Failed to fetch content lists:", error);
        (window as any).Alpine?.store?.("ui")?.showToast?.(
          "Не удалось загрузить списки контента.",
          "error",
        );
      } finally {
        this.contentListsLoading = false;
      }
    },
    getAvailableRelatedContentItems() {
      if (!this.selectedRelatedContentType) return [];
      return this.relatedContentLists[this.selectedRelatedContentType] ?? [];
    },
    getSelectedEntityRelatedContent(type: string) {
      return this.article?.relatedContent?.[type] ?? [];
    },
    getRelatedContentItemLabel(type: string, id: string) {
      const item = (this.relatedContentLists as Record<string, any[]>)[
        type
      ]?.find((entry) => entry.id === id);
      return item?.title || id;
    },
    getFilteredContentList(contentType: string) {
      return (
        (this.relatedContentLists as Record<string, any[]>)[contentType] ?? []
      );
    },
    addRelatedContent() {
      const type = this.selectedRelatedContentType;
      const id = this.selectedRelatedContentId;
      if (!type || !id) return;

      const normalized = sanitizeRelatedContent(this.article.relatedContent);
      if (this.articleId && type === "news" && id === this.articleId) {
        (window as any).Alpine?.store?.("ui")?.showToast?.(
          "Нельзя привязать текущую новость к самой себе.",
          "error",
        );
        return;
      }
      if (normalized[type].includes(id)) {
        (window as any).Alpine?.store?.("ui")?.showToast?.(
          "Этот материал уже добавлен.",
          "info",
        );
        return;
      }
      normalized[type] = [...normalized[type], id];
      this.article.relatedContent = normalized;
      this.selectedRelatedContentId = "";
    },
    removeRelatedContent(type: string, id: string) {
      const normalized = sanitizeRelatedContent(this.article.relatedContent);
      normalized[type] = normalized[type].filter((itemId) => itemId !== id);
      this.article.relatedContent = normalized;
    },
    isTagSelected(value: string) {
      return this.article.tags.includes(value);
    },
    toggleTag(value: string) {
      const normalized =
        normalizeTags([value], this.article.category)[0] || value;
      const idx = this.article.tags.indexOf(normalized);
      if (idx >= 0) {
        this.article.tags.splice(idx, 1);
      } else {
        this.article.tags.push(normalized);
      }
      this.article.tags = normalizeTags(
        this.article.tags,
        this.article.category,
      );
    },
    removeTag(value: string) {
      const idx = this.article.tags.indexOf(value);
      if (idx >= 0) this.article.tags.splice(idx, 1);
    },
    handleCategoryChange(value: string) {
      this.article.category = value;
      this.article.tags = normalizeTags(this.article.tags, value);
    },
    getAuthorLabel(author: any) {
      const firstName =
        typeof author?.firstName === "string" ? author.firstName.trim() : "";
      const lastName =
        typeof author?.lastName === "string" ? author.lastName.trim() : "";
      return `${firstName} ${lastName}`.trim();
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
        const stored = window.localStorage?.getItem("newsPreview");
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed && typeof parsed === "object") {
          previewState = parsed as PreviewState;
        }
      } catch (error) {
        console.error("Failed to load news preview draft:", error);
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

      this.article.tags = this.article.tags ?? [];
      this.article.lead = this.article.lead ?? "";
      this.article.cardLead = this.article.cardLead ?? "";
      this.article.isMainInCategory = Boolean(this.article.isMainInCategory);
      this.article.relatedContent = sanitizeRelatedContent(
        this.article.relatedContent,
        "news",
        this.articleId,
      );
      this.article.contentBlocks = Array.isArray(this.article.contentBlocks)
        ? sortAndNormalizeContentBlocks(this.article.contentBlocks)
        : [];
      if (!restoredPreviewAuthorState) {
        this.selectedAuthorId =
          typeof this.article.authorId === "string" ? this.article.authorId : "";
      }
      this.ensureSelectedAuthorPresent();
      this.fetchContentLists();
      this.loadAuthors();
      this.syncCurrentContentCollection();
      this.loadContentCollections();
    },

    returnToEdit() {
      window.location.href =
        this.isEditMode && this.articleId
          ? `/dashboard/news/${this.articleId}/edit`
          : "/dashboard/news/create";
    },

    previewArticle() {
      if (this.editingIndex !== null) {
        this.updateBlock();
        if (this.editingIndex !== null) return;
      }

      if (this.uploading) {
        (window as any).Alpine.store("ui").showToast(
          "Подожди — загрузка файла ещё не завершилась.",
          "error",
        );
        return;
      }

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
      window.localStorage.setItem("newsPreview", JSON.stringify(previewState));
      window.location.href = "/dashboard/news/preview";
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
    async handleImageUpload(event: Event) {
      const raw = (event.target as HTMLInputElement).files?.[0];
      if (!raw) return;

      this.uploading = true;
      this.uploadProgress = 0;

      const file = await compressImage(raw);
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
            (window as any).Alpine.store("ui").showToast(
              "Картинка успешно загружена!",
            );
          });
        },
      );
    },

    openBlockSelector() {
      this.showBlockOptions = true;
    },

    addBlock(type: string) {
      let newBlockData: Record<string, unknown> = {};
      switch (type) {
        case "paragraph":
          newBlockData = { text: "" };
          break;
        case "link":
          newBlockData = {
            text: "",
            linkedContentType: "article",
            linkedContentId: "",
            linkedContentTitle: "",
          };
          break;
        case "url-link":
          newBlockData = { text: "", url: "" };
          break;
        default:
          break;
      }
      const newBlock = createBlock(
        type,
        newBlockData,
        this.article.contentBlocks.length,
      );
      this.article.contentBlocks.push(newBlock);
      this.syncContentBlockOrder();
      this.showBlockOptions = false;
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
        this.syncContentBlockOrder();
        this.cancelEdit();
      }
    },

    cancelEdit() {
      this.editingIndex = null;
      this.editingBlock = null;
    },

    startBlockDrag(index: number) {
      if (this.editingIndex !== null || this.uploading) return;
      const block = this.article.contentBlocks[index];
      if (!block?.id) return;
      this.draggedBlockId = block.id;
      this.dragOverBlockId = block.id;
    },

    setBlockDropTarget(index: number) {
      if (!this.draggedBlockId) return;
      const block = this.article.contentBlocks[index];
      if (!block?.id) return;
      this.dragOverBlockId = block.id;
    },

    dropBlock(targetIndex: number) {
      if (!this.draggedBlockId || this.editingIndex !== null) {
        this.resetBlockDrag();
        return;
      }

      const fromIndex = this.article.contentBlocks.findIndex(
        (block: any) => block?.id === this.draggedBlockId,
      );

      if (fromIndex < 0 || fromIndex === targetIndex) {
        this.resetBlockDrag();
        return;
      }

      const reorderedBlocks = [...this.article.contentBlocks];
      const [movedBlock] = reorderedBlocks.splice(fromIndex, 1);

      if (!movedBlock) {
        this.resetBlockDrag();
        return;
      }

      reorderedBlocks.splice(targetIndex, 0, movedBlock);
      this.syncContentBlockOrder(reorderedBlocks);
      this.resetBlockDrag();
    },

    resetBlockDrag() {
      this.draggedBlockId = null;
      this.dragOverBlockId = null;
    },

    deleteBlock(index: number) {
      const removeBlock = () => {
        this.article.contentBlocks.splice(index, 1);
        this.syncContentBlockOrder();
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
      // Auto-commit any open block — prevents losing unsaved flipper/image/text edits
      if (this.editingIndex !== null) {
        this.updateBlock();
        if (this.editingIndex !== null) return;
      }

      // Block save while a file upload is still in progress
      if (this.uploading) {
        (window as any).Alpine.store("ui").showToast(
          "Подожди — загрузка файла ещё не завершилась.",
          "error",
        );
        return;
      }

      // Guard against double-submit
      if (this.isSaving) return;
      this.isSaving = true;

      const normalizedCategory = normalizeCategory(this.article.category) || "";
      this.article.category = normalizedCategory;
      this.article.contentBlocks = reindexContentBlocks(
        this.article.contentBlocks,
      );
      this.article.tags = normalizeTags(
        this.article.tags,
        this.article.category,
      );

      if (!this.article.category) {
        (window as any).Alpine.store("ui").showToast(
          "Выбери категорию перед сохранением.",
          "error",
        );
        this.isSaving = false;
        return;
      }

      if (!this.article.imageUrl) {
        (window as any).Alpine.store("ui").showToast(
          "Загрузи обложку новости!",
          "error",
        );
        this.isSaving = false;
        return;
      }

      try {
        const resolvedAuthorId = await this.resolveAuthorId();
        const tagsForDb = this.article.tags.map((tag: string) =>
          this.getTagLabel(tag),
        );
        const payload = {
          title: this.article.title,
          lead: this.article.lead,
          cardLead: this.article.cardLead,
          imageUrl: this.article.imageUrl,
          imageCaption: this.article.imageCaption,
          authorId: resolvedAuthorId,
          content: this.article.contentBlocks,
          category: this.article.category,
          tags: tagsForDb,
          isMainInCategory: Boolean(this.article.isMainInCategory),
          published: Boolean(this.article.published),
          relatedContent: sanitizeRelatedContent(
            this.article.relatedContent,
            "news",
            this.articleId,
          ),
          contentCollectionId: normalizeContentCollectionId(
            this.article.contentCollectionId,
          ),
        };

        if (this.isEditMode && this.articleId) {
          await newsApi.update(this.articleId, payload);
          window.localStorage.removeItem("newsPreview");
          (window as any).Alpine.store("ui").showToast("Новость обновлена!");
          const redirectTo = this.onSaveRedirect || `/dashboard/news`;
          setTimeout(() => {
            globalThis.location.href = redirectTo;
          }, 1500);
        } else {
          const result = await newsApi.create(payload);
          window.localStorage.removeItem("newsPreview");
          (window as any).Alpine.store("ui").showToast("Новость создана!");
          setTimeout(() => {
            globalThis.location.href = `/dashboard/news`;
          }, 1500);
        }
      } catch (error) {
        console.error("Save error:", error);
        const message =
          error instanceof Error ? error.message : "Ошибка сохранения новости.";
        (window as any).Alpine.store("ui").showToast(message, "error");
        this.isSaving = false;
      }
    },

    deleteArticle(redirectUrl: string) {
      if (!this.articleId) return;

      const performDelete = async () => {
        try {
          await newsApi.delete(this.articleId!);
          (window as any).Alpine.store("ui").showToast("Новость удалена");
          setTimeout(() => {
            window.location.href = redirectUrl || "/dashboard/news";
          }, 1500);
        } catch (error) {
          console.error(error);
          (window as any).Alpine.store("ui").showToast(
            "Не удалось удалить.",
            "error",
          );
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
