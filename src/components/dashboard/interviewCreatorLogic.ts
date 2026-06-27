import {
  interviewsApi,
  authorsApi,
} from "@/lib/api/api";
import { getInitialRichTextHtml } from "@/lib/utils/richText";
import {
  MATERIAL_LINK_TYPE_OPTIONS,
  RELATED_CONTENT_TYPE_OPTIONS,
  createEmptyRelatedContent,
  createEmptyRelatedContentLists,
  fetchRelatedContentLists,
  sanitizeRelatedContent,
} from "@/lib/utils/relatedContent";
import {
  detectVideoProvider,
  getDirectVideoUrl as resolveVideoDirectUrl,
  getVideoEmbedUrl as resolveVideoEmbedUrl,
  getVideoRenderMode as resolveVideoRenderMode,
  normalizeVideoBlock,
} from "@/lib/utils/video";
import {
  getBlockSummary as buildBlockSummary,
  getBlockTypeLabel as resolveBlockTypeLabel,
  getColumnTypeLabel as resolveColumnTypeLabel,
  getLinkedBlockTitle as resolveLinkedBlockTitle,
  getLinkedContentTypeLabel as resolveLinkedContentTypeLabel,
  truncatePreviewText,
} from "@/lib/utils/contentBlockPreview";
import {
  reindexContentBlocks,
  sortAndNormalizeContentBlocks,
  withBlockMeta,
} from "@/lib/utils/contentBlocks";
import { createContentCollectionEditorState } from "@/lib/utils/contentCollectionEditor";
import { normalizeContentCollectionId } from "@/lib/utils/contentCollections";
import { app } from "../../lib/firebase/client";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { createLandingPlacementManager } from "@/components/dashboard/landingPlacementManager";
import { compressImage } from "@/lib/images/compressImage";

const storage = getStorage(app);

// Helper to create a new block object
const createBlock = (type, data, position = 0) =>
  withBlockMeta({ type, ...data }, position);

export default function interviewCreatorLogic(initialState = {}) {
  const {
    initialInterview = null,
    interviewId = null,
    isEditMode = false,
    isPreview = false,
    onSaveRedirect = null,
    ...restInitialState
  } = initialState as {
    initialInterview?: Record<string, unknown> | null;
    interviewId?: string | null;
    isEditMode?: boolean;
    isPreview?: boolean;
    onSaveRedirect?: string | null;
  };

  const normalizeTags = (tags?: string[]) => {
    if (!Array.isArray(tags)) {
      return [];
    }
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
      if (!deduped.has(trimmed)) {
        deduped.add(trimmed);
        normalized.push(trimmed);
      }
    }
    return normalized;
  };

  const normalizeLoadedInterview = (data: any) => {
    if (!data || typeof data !== "object") {
      return null;
    }
    const copy = JSON.parse(JSON.stringify(data));
    const blocks = Array.isArray(copy.content) ? copy.content : [];
    copy.contentBlocks = sortAndNormalizeContentBlocks(blocks).map((block: any) =>
      block?.type === "video"
        ? withBlockMeta(
            normalizeVideoBlock(block) as Record<string, unknown>,
            Number(block.position) || 0,
          )
        : block,
    );
    copy.content = copy.contentBlocks;
    copy.tags = normalizeTags(copy.tags);
    copy.imageCaption = copy.imageCaption ?? "";
    copy.lead = copy.lead ?? "";
    copy.cardLead = copy.cardLead ?? "";
    copy.mainQuote = copy.mainQuote ?? "";
    copy.isHotContent = Boolean(copy.isHotContent);
    copy.isNotebookContent = Boolean(copy.isNotebookContent);
    copy.paid = Boolean(copy.paid);
    copy.published = Boolean(copy.published);
    copy.publishedAt = copy.publishedAt ?? null;
    copy.relatedContent = sanitizeRelatedContent(copy.relatedContent);
    copy.contentCollectionId = normalizeContentCollectionId(copy.contentCollectionId);
    return copy;
  };

  const normalizeEditableInterviewBlocks = (blocks?: unknown) => {
    const reindexedBlocks = reindexContentBlocks(blocks);
    return reindexedBlocks.map((block: any) =>
      block?.type === "video"
        ? withBlockMeta(
            normalizeVideoBlock(block) as Record<string, unknown>,
            Number(block.position) || 0,
          )
        : block,
    );
  };

  return {
    interview: {
      title: "",
      interviewee: "",
      lead: "",
      cardLead: "",
      mainQuote: "",
      isHotContent: false,
      isNotebookContent: false,
      paid: false,
      published: false,
      publishedAt: null,
      imageUrl: "",
      imageCaption: "",
      contentBlocks: [],
      tags: [],
      relatedContent: createEmptyRelatedContent(),
      contentCollectionId: null as string | null,
    },

    showBlockOptions: false,
    editingIndex: null,
    editingBlock: null,
    draggedBlockId: null,
    dragOverBlockId: null,
    isEditingTitle: false,
    editingTitleText: "",
    isEditingCaption: false,
    editingCaptionText: "",
    uploading: false,
    uploadProgress: 0,
    isSaving: false,
    interviewId,
    isEditMode,
    onSaveRedirect,

    // State for managing content lists for link blocks
    contentListsLoading: false,
    relatedContentLists: createEmptyRelatedContentLists(),
    relatedContentTypeOptions: RELATED_CONTENT_TYPE_OPTIONS,
    materialLinkTypeOptions: MATERIAL_LINK_TYPE_OPTIONS,
    selectedRelatedContentType: "article",
    selectedRelatedContentId: "",
    ...createContentCollectionEditorState("interview"),
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
    ...createLandingPlacementManager({
      getEntityId() {
        return this.interviewId;
      },
      getMainHeroTarget() {
        return this.interviewId ? { type: "interview", id: this.interviewId } : null;
      },
      supportsCultureInterviewBlock: true,
    }),
    getRichTextInitialHtml(block) {
      return getInitialRichTextHtml(block);
    },
    getColumnRichTextInitialHtml(column) {
      return getInitialRichTextHtml({
        html: column?.html,
        text: column?.content,
      });
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
    getLinkedBlockTitle(block) {
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
    getBlockSummary(block) {
      return buildBlockSummary(block, {
        resolveLinkedTitle: (currentBlock) => this.getLinkedBlockTitle(currentBlock),
      });
    },

    isTagSelected(value: string) {
      return this.interview.tags.includes(value);
    },
    syncContentBlockOrder(blocks = this.interview.contentBlocks) {
      this.interview.contentBlocks = reindexContentBlocks(blocks);
    },
    getVideoProvider(url: string, sourceType = "embed") {
      return detectVideoProvider(url, sourceType);
    },
    getVideoEmbedUrl(url: string) {
      return resolveVideoEmbedUrl(url);
    },
    getVideoDirectUrl(url: string) {
      return resolveVideoDirectUrl(url);
    },
    getVideoRenderMode(url: string, sourceType = "embed") {
      return resolveVideoRenderMode(url, sourceType);
    },
    validateVideoBlock(block, showToast = true) {
      if (!block || block.type !== "video") {
        return true;
      }
      const normalized = normalizeVideoBlock(block);
      if (!normalized.url) {
        if (showToast) {
          window.Alpine?.store("ui")?.showToast?.(
            "Для видео-блока добавь файл или ссылку.",
            "error",
          );
        }
        return false;
      }
      if (
        normalized.sourceType === "embed" &&
        resolveVideoRenderMode(normalized.url, normalized.sourceType) ===
          "unknown"
      ) {
        if (showToast) {
          window.Alpine?.store("ui")?.showToast?.(
            "Нужна прямая ссылка на видеофайл или готовая ссылка для встраивания, а не обычная страница с видео.",
            "error",
          );
        }
        return false;
      }
      return true;
    },
    toggleTag(value: string) {
      const idx = this.interview.tags.indexOf(value);
      if (idx >= 0) {
        this.interview.tags.splice(idx, 1);
      } else {
        this.interview.tags.push(value);
      }
      this.interview.tags = normalizeTags(this.interview.tags);
    },
    removeTag(value: string) {
      const idx = this.interview.tags.indexOf(value);
      if (idx >= 0) {
        this.interview.tags.splice(idx, 1);
      }
    },
    async fetchContentLists() {
      this.contentListsLoading = true;
      try {
        this.relatedContentLists = await fetchRelatedContentLists();
      } catch (error) {
        console.error("Failed to fetch content lists:", error);
        window.Alpine?.store("ui")?.showToast?.(
          "Не удалось загрузить списки контента.",
          "error",
        );
      } finally {
        this.contentListsLoading = false;
      }
    },

    getFilteredContentList(contentType) {
      return this.relatedContentLists[contentType] ?? [];
    },
    getAvailableRelatedContentItems() {
      if (!this.selectedRelatedContentType) {
        return [];
      }
      return this.relatedContentLists[this.selectedRelatedContentType] ?? [];
    },
    getSelectedEntityRelatedContent(type) {
      return this.interview?.relatedContent?.[type] ?? [];
    },
    getRelatedContentItemLabel(type, id) {
      const item = (this.relatedContentLists[type] ?? []).find(
        (entry) => entry.id === id,
      );
      return item?.title || id;
    },
    addRelatedContent() {
      const type = this.selectedRelatedContentType;
      const id = this.selectedRelatedContentId;

      if (!type || !id) {
        return;
      }

      const normalized = sanitizeRelatedContent(this.interview.relatedContent);
      const currentIds = normalized[type] ?? [];

      if (this.interviewId && type === "interview" && id === this.interviewId) {
        window.Alpine?.store("ui")?.showToast?.(
          "Нельзя привязать текущее интервью к самому себе.",
          "error",
        );
        return;
      }

      if (currentIds.includes(id)) {
        window.Alpine?.store("ui")?.showToast?.(
          "Этот материал уже добавлен.",
          "info",
        );
        return;
      }

      normalized[type] = [...currentIds, id];
      this.interview.relatedContent = normalized;
      this.selectedRelatedContentId = "";
    },
    removeRelatedContent(type, id) {
      const normalized = sanitizeRelatedContent(this.interview.relatedContent);
      normalized[type] = normalized[type].filter((itemId) => itemId !== id);
      this.interview.relatedContent = normalized;
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

      const fallbackAuthor = this.interview?.author;
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
      const fallbackAuthor = this.interview?.author;
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
        interview?: unknown;
        interviewId?: string | null;
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

      if (typeof window !== "undefined") {
        try {
          const stored = window.localStorage?.getItem("interviewPreview");
          const parsed = stored ? JSON.parse(stored) : null;
          if (parsed && typeof parsed === "object") {
            previewState = parsed as PreviewState;
          }
        } catch (error) {
          console.error("Failed to load interview preview draft:", error);
        }
      }

      if (initialInterview) {
        const normalizedInitial = normalizeLoadedInterview(initialInterview);
        if (normalizedInitial) {
          this.interview = normalizedInitial;
        }
      }
      if (interviewId) {
        this.interviewId = interviewId;
        this.isEditMode = true;
      }
      if (typeof isEditMode === "boolean") {
        this.isEditMode = isEditMode;
      }
      if (onSaveRedirect) {
        this.onSaveRedirect = onSaveRedirect;
      }

      const shouldApplyPreview = (() => {
        if (!previewState?.interview) {
          return false;
        }
        if (isPreview) {
          return true;
        }
        const previewId =
          typeof previewState.interviewId === "string" && previewState.interviewId
            ? previewState.interviewId
            : null;
        const isPreviewEdit = Boolean(previewState.isEditMode);
        const isSameEdit =
          this.isEditMode && previewId !== null && previewId === this.interviewId;
        const isCreateDraft = !this.isEditMode && !previewId && !isPreviewEdit;
        return isSameEdit || isCreateDraft;
      })();

      if (shouldApplyPreview && previewState?.interview) {
        const normalizedPreview = normalizeLoadedInterview(previewState.interview);
        if (normalizedPreview) {
          if (isPreview) {
            this.interview = normalizedPreview;
            this.interviewId =
              typeof previewState.interviewId === "string"
                ? previewState.interviewId
                : null;
            this.isEditMode = Boolean(previewState.isEditMode);
          } else {
            Object.assign(this.interview, normalizedPreview);
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

      this.interview.tags = this.interview.tags ?? [];
      this.interview.isHotContent = Boolean(this.interview.isHotContent);
      this.interview.isNotebookContent = Boolean(this.interview.isNotebookContent);
      this.interview.relatedContent = sanitizeRelatedContent(
        this.interview.relatedContent,
        "interview",
        this.interviewId,
      );
      this.interview.contentBlocks = Array.isArray(this.interview.contentBlocks)
        ? normalizeEditableInterviewBlocks(this.interview.contentBlocks)
        : [];
      if (!restoredPreviewAuthorState) {
        this.selectedAuthorId =
          typeof this.interview.authorId === "string"
            ? this.interview.authorId
            : "";
      }
      this.ensureSelectedAuthorPresent();
      this.fetchContentLists();
      this.loadAuthors();
      this.syncCurrentContentCollection();
      this.loadContentCollections();
      this.loadLandingPlacements();
    },

    returnToEdit() {
      window.location.href =
        this.isEditMode && this.interviewId
          ? `/dashboard/interview/${this.interviewId}/edit`
          : "/dashboard/interview/create";
    },

    previewInterview() {
      if (this.editingIndex !== null) {
        this.updateBlock();
        if (this.editingIndex !== null) return;
      }

      if (this.uploading) {
        window.Alpine.store("ui").showToast(
          "Подожди — загрузка файла ещё не завершилась.",
          "error",
        );
        return;
      }

      const authorDisplay = this.getSelectedAuthorDisplay();
      const previewState = {
        interview: this.interview,
        interviewId: this.interviewId,
        isEditMode: this.isEditMode,
        selectedAuthorId: this.selectedAuthorId,
        useNewAuthor: this.useNewAuthor,
        newAuthorFirstName: this.newAuthorFirstName,
        newAuthorLastName: this.newAuthorLastName,
        authorDisplay,
      };
      window.localStorage.setItem("interviewPreview", JSON.stringify(previewState));
      window.location.href = "/dashboard/interview/preview";
    },

    editTitle() {
      this.isEditingTitle = true;
      this.editingTitleText = this.interview.title;
    },
    saveTitle() {
      this.interview.title = this.editingTitleText;
      this.isEditingTitle = false;
    },
    cancelEditTitle() {
      this.isEditingTitle = false;
    },

    editCaption() {
      this.isEditingCaption = true;
      this.editingCaptionText = this.interview.imageCaption;
    },
    saveCaption() {
      this.interview.imageCaption = this.editingCaptionText;
      this.isEditingCaption = false;
    },
    cancelEditCaption() {
      this.isEditingCaption = false;
    },

    async handleImageUpload(
      event,
      isCover = true,
      blockIndex = null,
      column = null,
      imageField = null,
    ) {
      const raw = event.target.files[0];
      if (!raw) return;

      this.uploading = true;
      this.uploadProgress = 0;

      const file = await compressImage(raw);
      const storageRef = ref(storage, `interviews/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          console.error("Upload failed:", error);
          window.Alpine.store("ui").showToast(`Проблема загрузки картинки: ${error.message}`, "error");
          this.uploading = false;
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            if (isCover) {
              this.interview.imageUrl = downloadURL;
            } else if (
              column &&
              this.editingBlock &&
              ["two-columns", "three-columns"].includes(this.editingBlock.type)
            ) {
              this.editingBlock[column].content = downloadURL;
              this.editingBlock[column].type = "image";
            } else if (
              imageField &&
              this.editingBlock?.type === "one-big-one-small"
            ) {
              this.editingBlock[imageField] = downloadURL;
            } else if (blockIndex !== null && this.editingIndex !== null && this.interview.contentBlocks[this.editingIndex]?.type === "image") {
              this.interview.contentBlocks[this.editingIndex].url = downloadURL;
              // Also update editingBlock to reflect this change
              if (this.editingBlock && this.editingBlock.type === "image") {
                this.editingBlock.url = downloadURL;
              }
            }
            this.uploading = false;
            window.Alpine.store("ui").showToast("Картинка успешно загружена!");
          });
        },
      );
    },

    handleVideoUpload(event, blockIndex = null) {
      const file = event.target.files[0];
      if (!file) return;

      this.uploading = true;
      this.uploadProgress = 0;

      const storageRef = ref(storage, `interviews/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          this.uploading = true;
          this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          console.error("Upload failed:", error);
          window.Alpine.store("ui").showToast(`Проблема загрузки видео: ${error.message}`, "error");
          this.uploading = false;
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            if (blockIndex !== null && this.editingBlock?.type === "video") {
              this.editingBlock.sourceType = "upload";
              this.editingBlock.url = downloadURL;
              this.editingBlock.provider = "upload";
            }
            this.uploading = false;
            window.Alpine.store("ui").showToast("Видео успешно загружено!");
          });
        },
      );
    },

    // Uploads a slide image for a flipper block being edited
    async handleFlipperSlideUpload(event, slideIndex: number) {
      const raw = event.target.files[0];
      if (!raw) return;

      this.uploading = true;
      this.uploadProgress = 0;

      const file = await compressImage(raw);
      const storageRef = ref(storage, `interviews/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          console.error("Upload failed:", error);
          window.Alpine.store("ui").showToast(`Проблема загрузки картинки: ${error.message}`, "error");
          this.uploading = false;
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            if (this.editingBlock?.slides?.[slideIndex] !== undefined) {
              this.editingBlock.slides[slideIndex].imageUrl = downloadURL;
            }
            this.uploading = false;
            window.Alpine.store("ui").showToast("Картинка успешно загружена!");
          });
        },
      );
    },

    openBlockSelector() {
      this.showBlockOptions = true;
    },

    addBlock(type) {
      let newBlockData = {};
      switch (type) {
        case "paragraph":
        case "first-paragraph":
          newBlockData = { text: "", html: "" };
          break;
        case "h2":
        case "h3":
        case "quote":
          newBlockData = { text: "" };
          break;
        case "image":
          newBlockData = { url: "", caption: "" };
          break;
        case "video":
          newBlockData = {
            sourceType: "embed",
            url: "",
            caption: "",
            provider: "unknown",
          };
          break;
        case "two-columns":
          newBlockData = {
            left: { type: "text", content: "", html: "", caption: "" },
            right: { type: "text", content: "", html: "", caption: "" },
          };
          break;
        case "three-columns":
          newBlockData = {
            left: { type: "text", content: "", html: "", caption: "" },
            center: { type: "text", content: "", html: "", caption: "" },
            right: { type: "text", content: "", html: "", caption: "" },
          };
          break;
        case "qa":
          newBlockData = { question: "", answer: "" };
          break;
        case "link":
          newBlockData = {
            text: "",
            linkedContentType: "article", // Default to article
            linkedContentId: "",
            linkedContentTitle: "",
          };
          break;
        case "url-link":
          newBlockData = { text: "", url: "" };
          break;
        case "flipper":
          newBlockData = {
            slides: [{ imageUrl: "", caption: "" }],
          };
          break;
        case "one-big-one-small":
          newBlockData = {
            portraitImageUrl: "",
            portraitImageCaption: "",
            landscapeImageUrl: "",
            landscapeImageCaption: "",
          };
          break;
        default:
          break;
      }

      const newBlock = createBlock(
        type,
        newBlockData,
        this.interview.contentBlocks.length,
      );
      this.interview.contentBlocks.push(newBlock);
      this.syncContentBlockOrder();
      this.showBlockOptions = false;
      this.editBlock(this.interview.contentBlocks.length - 1);
    },

    editBlock(index) {
      this.editingIndex = index;
      this.editingBlock = JSON.parse(JSON.stringify(this.interview.contentBlocks[index]));
      if (this.editingBlock?.type === "video") {
        this.editingBlock = normalizeVideoBlock(this.editingBlock);
      }
    },

    updateBlock() {
      if (this.editingIndex !== null) {
        if (this.editingBlock?.type === "video") {
          this.editingBlock = normalizeVideoBlock(this.editingBlock);
          if (!this.validateVideoBlock(this.editingBlock)) {
            return;
          }
        }
        this.interview.contentBlocks[this.editingIndex] = this.editingBlock;
        this.syncContentBlockOrder();
        this.cancelEdit();
      }
    },

    cancelEdit() {
      this.editingIndex = null;
      this.editingBlock = null;
    },

    startBlockDrag(index) {
      if (this.editingIndex !== null || this.uploading) {
        return;
      }
      const block = this.interview.contentBlocks[index];
      if (!block?.id) {
        return;
      }
      this.draggedBlockId = block.id;
      this.dragOverBlockId = block.id;
    },

    setBlockDropTarget(index) {
      if (!this.draggedBlockId) {
        return;
      }
      const block = this.interview.contentBlocks[index];
      if (!block?.id) {
        return;
      }
      this.dragOverBlockId = block.id;
    },

    dropBlock(targetIndex) {
      if (!this.draggedBlockId || this.editingIndex !== null) {
        this.resetBlockDrag();
        return;
      }

      const fromIndex = this.interview.contentBlocks.findIndex(
        (block) => block?.id === this.draggedBlockId,
      );

      if (fromIndex < 0 || fromIndex === targetIndex) {
        this.resetBlockDrag();
        return;
      }

      const reorderedBlocks = [...this.interview.contentBlocks];
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

    deleteBlock(index) {
      const removeBlock = () => {
        this.interview.contentBlocks.splice(index, 1);
        this.syncContentBlockOrder();
      };
      const uiStore = window.Alpine?.store?.("ui");
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation("Ты точно хочешь удалить этот блок?", removeBlock);
      } else {
        removeBlock();
      }
    },

    async saveInterview() {
      // Auto-commit any open block — prevents losing unsaved flipper/image/text edits
      if (this.editingIndex !== null) {
        this.updateBlock();
        if (this.editingIndex !== null) return;
      }

      // Block save while a file upload is still in progress
      if (this.uploading) {
        window.Alpine.store("ui").showToast(
          "Подожди — загрузка файла ещё не завершилась.",
          "error",
        );
        return;
      }

      // Guard against double-submit
      if (this.isSaving) return;
      this.isSaving = true;

      this.interview.tags = normalizeTags(this.interview.tags);
      this.interview.contentBlocks = normalizeEditableInterviewBlocks(
        this.interview.contentBlocks,
      );

      const hasInvalidVideoBlock = this.interview.contentBlocks.some(
        (block: any) => !this.validateVideoBlock(block),
      );
      if (hasInvalidVideoBlock) {
        this.isSaving = false;
        return;
      }

      if (!this.interview.title) {
        window.Alpine.store("ui").showToast("Добавь заголовок.", "error");
        this.isSaving = false;
        return;
      }
      if (!this.interview.interviewee) {
        window.Alpine.store("ui").showToast("Добавь имя интервьюируемого.", "error");
        this.isSaving = false;
        return;
      }
      if (!this.interview.imageUrl) {
        window.Alpine.store("ui").showToast("Загрузи обложку.", "error");
        this.isSaving = false;
        return;
      }
      try {
        const resolvedAuthorId = await this.resolveAuthorId();
        const payload = {
          title: this.interview.title,
          interviewee: this.interview.interviewee,
          lead: this.interview.lead,
          cardLead: this.interview.cardLead,
          mainQuote: this.interview.mainQuote,
          isHotContent: Boolean(this.interview.isHotContent),
          isNotebookContent: Boolean(this.interview.isNotebookContent),
          paid: Boolean(this.interview.paid),
          published: Boolean(this.interview.published),
          imageUrl: this.interview.imageUrl,
          imageCaption: this.interview.imageCaption,
          authorId: resolvedAuthorId,
          content: this.interview.contentBlocks,
          tags: this.interview.tags,
          relatedContent: sanitizeRelatedContent(
            this.interview.relatedContent,
            "interview",
            this.interviewId,
          ),
          contentCollectionId: normalizeContentCollectionId(
            this.interview.contentCollectionId,
          ),
        };

        if (this.isEditMode && this.interviewId) {
          await interviewsApi.update(this.interviewId, payload);
          window.localStorage.removeItem("interviewPreview");
          window.Alpine.store("ui").showToast("Интервью успешно обновлено!");
          const redirectTo = this.onSaveRedirect || `/dashboard/interviews`;
          setTimeout(() => { globalThis.location.href = redirectTo; }, 1500);
        } else {
          await interviewsApi.create(payload);
          window.localStorage.removeItem("interviewPreview");
          window.Alpine.store("ui").showToast("Интервью успешно создано!");
          setTimeout(() => { globalThis.location.href = `/dashboard/interviews`; }, 1500);
        }
      } catch (error) {
        console.error("Ошибка сохранения интервью:", error);
        const message = error instanceof Error ? error.message : "Во время сохранения интервью возникла ошибка.";
        window.Alpine.store("ui").showToast(message, "error");
        this.isSaving = false;
      }
    },

    deleteInterview(redirectUrl?: string) {
      if (!this.interviewId) {
        return;
      }

      const performDelete = async () => {
        try {
          await interviewsApi.delete(this.interviewId as string);
          window.Alpine.store("ui").showToast("Интервью удалено");
          setTimeout(() => {
            globalThis.location.href = redirectUrl || "/dashboard/interviews";
          }, 1500);
        } catch (error) {
          console.error(error);
          window.Alpine.store("ui").showToast(
            "Не получилось удалить интервью.",
            "error",
          );
        }
      };

      const uiStore = window.Alpine?.store?.("ui");
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation(
          `Удалить интервью «${this.interview.title || "без названия"}»? Это действие необратимо.`,
          performDelete,
        );
      } else if (window.confirm("Удалить интервью? Это действие необратимо.")) {
        performDelete();
      }
    },

    ...restInitialState,
  };
}
