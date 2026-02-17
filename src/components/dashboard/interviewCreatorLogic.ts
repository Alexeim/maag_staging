import {
  interviewsApi,
  articlesApi,
  eventsApi,
  flippersApi,
  authorsApi,
} from "@/lib/api/api";
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

export default function interviewCreatorLogic(initialState = {}) {
  const {
    initialInterview = null,
    interviewId = null,
    isEditMode = false,
    onSaveRedirect = null,
    ...restInitialState
  } = initialState as {
    initialInterview?: Record<string, unknown> | null;
    interviewId?: string | null;
    isEditMode?: boolean;
    onSaveRedirect?: string | null;
  };

  const slugifyTag = (value: string) => {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
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
    copy.contentBlocks = blocks;
    copy.content = blocks;
    copy.tags = normalizeTags(copy.tags);
    copy.imageCaption = copy.imageCaption ?? "";
    copy.lead = copy.lead ?? "";
    copy.mainQuote = copy.mainQuote ?? "";
    return copy;
  };

  return {
    interview: {
      title: "",
      interviewee: "",
      lead: "",
      mainQuote: "",
      imageUrl: "",
      imageCaption: "",
      contentBlocks: [],
      tags: [],
    },

    showBlockOptions: false,
    editingIndex: null,
    editingBlock: null,
    isEditingTitle: false,
    editingTitleText: "",
    isEditingCaption: false,
    editingCaptionText: "",
    uploading: false,
    uploadProgress: 0,
    interviewId,
    isEditMode,
    onSaveRedirect,
    newTagInput: "",

    // State for managing content lists for link blocks
    contentListsLoading: false,
    allArticles: [],
    allEvents: [],
    allInterviews: [],
    allFlippers: [],
    authorsLoading: false,
    authors: [],
    selectedAuthorId: "",
    useNewAuthor: false,
    newAuthorFirstName: "",
    newAuthorLastName: "",

    isTagSelected(value: string) {
      return this.interview.tags.includes(value);
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
    addCustomTag() {
      const slug = slugifyTag(this.newTagInput);
      if (!slug) {
        window.Alpine?.store("ui")?.showToast?.(
          "Введи тег латиницей — это значение уходит в базу данных.",
          "error",
        );
        return;
      }
      if (this.interview.tags.includes(slug)) {
        window.Alpine?.store("ui")?.showToast?.(
          "Такой тег уже есть.",
          "info",
        );
        this.newTagInput = "";
        return;
      }
      this.interview.tags.push(slug);
      this.interview.tags = normalizeTags(this.interview.tags);
      this.newTagInput = "";
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
      this.interview.tags = this.interview.tags ?? [];
      this.interview.contentBlocks = Array.isArray(this.interview.contentBlocks)
        ? this.interview.contentBlocks
        : [];
      this.selectedAuthorId =
        typeof this.interview.authorId === "string"
          ? this.interview.authorId
          : "";
      this.ensureSelectedAuthorPresent();
      this.fetchContentLists();
      this.loadAuthors();
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

    handleImageUpload(event, isCover = true, blockIndex = null, column = null) {
      const file = event.target.files[0];
      if (!file) return;

      this.uploading = true;
      this.uploadProgress = 0;

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
            } else if (column && this.editingBlock?.type === "two-columns") {
              this.editingBlock[column].content = downloadURL;
              this.editingBlock[column].type = "image";
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

    openBlockSelector() {
      this.showBlockOptions = true;
    },

    addBlock(type) {
      let newBlockData = {};
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
        default:
          break;
      }

      const newBlock = createBlock(type, newBlockData);
      this.interview.contentBlocks.push(newBlock);
      this.showBlockOptions = false;
      this.editBlock(this.interview.contentBlocks.length - 1);
    },

    editBlock(index) {
      this.editingIndex = index;
      this.editingBlock = JSON.parse(JSON.stringify(this.interview.contentBlocks[index]));
    },

    updateBlock() {
      if (this.editingIndex !== null) {
        this.interview.contentBlocks[this.editingIndex] = this.editingBlock;
        this.cancelEdit();
      }
    },

    cancelEdit() {
      this.editingIndex = null;
      this.editingBlock = null;
    },

    deleteBlock(index) {
      const removeBlock = () => {
        this.interview.contentBlocks.splice(index, 1);
      };
      const uiStore = window.Alpine?.store?.("ui");
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation("Ты точно хочешь удалить этот блок?", removeBlock);
      } else {
        removeBlock();
      }
    },

    async saveInterview() {
      this.interview.tags = normalizeTags(this.interview.tags);

      if (!this.interview.title) {
        window.Alpine.store("ui").showToast("Добавь заголовок.", "error");
        return;
      }
      if (!this.interview.interviewee) {
        window.Alpine.store("ui").showToast("Добавь имя интервьюируемого.", "error");
        return;
      }
      if (!this.interview.imageUrl) {
        window.Alpine.store("ui").showToast("Загрузи обложку.", "error");
        return;
      }
      if (this.interview.tags.length === 0) {
        window.Alpine.store("ui").showToast("Добавь хотя бы один тег.", "error");
        return;
      }

      try {
        const resolvedAuthorId = await this.resolveAuthorId();
        const payload = {
          title: this.interview.title,
          interviewee: this.interview.interviewee,
          lead: this.interview.lead,
          mainQuote: this.interview.mainQuote,
          imageUrl: this.interview.imageUrl,
          imageCaption: this.interview.imageCaption,
          authorId: resolvedAuthorId,
          content: this.interview.contentBlocks,
          tags: this.interview.tags,
        };

        if (this.isEditMode && this.interviewId) {
          await interviewsApi.update(this.interviewId, payload);
          window.Alpine.store("ui").showToast("Интервью успешно обновлено!");
          const redirectTo = this.onSaveRedirect || `/dashboard/interviews`;
          window.location.href = redirectTo;
        } else {
          const result = await interviewsApi.create(payload);
          window.Alpine.store("ui").showToast("Интервью успешно создано!");
          window.location.href = `/dashboard/interviews`; // Redirect to the list
        }
      } catch (error) {
        console.error("Ошибка сохранения интервью:", error);
        const message = error instanceof Error ? error.message : "Во время сохранения интервью возникла ошибка.";
        window.Alpine.store("ui").showToast(message, "error");
      }
    },

    ...restInitialState,
  };
}
