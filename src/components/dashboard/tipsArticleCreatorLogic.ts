import { articlesApi, authorsApi } from "@/lib/api/api";
import { app } from "../../lib/firebase/client";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

const storage = getStorage(app);

const slugifyTag = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-");

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
  copy.isHotContent = Boolean(copy.isHotContent);
  copy.isOnLanding = Boolean(copy.isOnLanding);
  copy.isMainInCategory = Boolean(copy.isMainInCategory);
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
  } = initialState as {
    initialArticle?: Record<string, unknown> | null;
    articleId?: string | null;
    isEditMode?: boolean;
    onSaveRedirect?: string | null;
    categoryTags?: Record<string, string[]>;
  };

  return {
    article: {
      title: "",
      lead: "",
      imageUrl: "",
      imageCaption: "",
      category: "culture",
      tags: [] as string[],
      techTags: [] as string[],
      isHotContent: false,
      isOnLanding: false,
      isMainInCategory: false,
      contentBlocks: [] as any[],
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

    // Author state
    authors: [] as any[],
    authorsLoading: false,
    selectedAuthorId: "",
    useNewAuthor: false,
    newAuthorFirstName: "",
    newAuthorLastName: "",

    // Tag state
    newTagInput: "",
    categoryTags,

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

      this.article.tags = normalizeTags(this.article.tags);
      this.article.contentBlocks = Array.isArray(this.article.contentBlocks)
        ? this.article.contentBlocks
        : [];

      this.selectedAuthorId =
        typeof this.article.authorId === "string" ? this.article.authorId : "";

      this.loadAuthors();
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
    isTagSelected(value: string) {
      return this.article.tags.includes(value);
    },
    toggleTag(value: string) {
      const idx = this.article.tags.indexOf(value);
      if (idx >= 0) {
        this.article.tags.splice(idx, 1);
      } else {
        this.article.tags.push(value);
      }
      this.article.tags = normalizeTags(this.article.tags);
    },
    removeTag(value: string) {
      const idx = this.article.tags.indexOf(value);
      if (idx >= 0) this.article.tags.splice(idx, 1);
    },
    addCustomTag() {
      const slug = slugifyTag(this.newTagInput);
      if (!slug) {
        ui()?.showToast?.(
          "Введи тег латиницей — это значение уходит в базу данных.",
          "error",
        );
        return;
      }
      if (this.article.tags.includes(slug)) {
        ui()?.showToast?.("Такой тег уже есть.", "info");
        this.newTagInput = "";
        return;
      }
      this.article.tags.push(slug);
      this.article.tags = normalizeTags(this.article.tags);
      this.newTagInput = "";
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

    // ── Save ──────────────────────────────────────────────────────────────────
    async saveArticle() {
      // Auto-save the currently open block so the user doesn't lose unsaved edits
      if (this.editingIndex !== null && this.editingBlock) {
        this.article.contentBlocks[this.editingIndex] = this.editingBlock;
        this.cancelEdit();
      }

      this.article.tags = normalizeTags(this.article.tags);

      if (!this.article.title) {
        ui()?.showToast?.("Добавь заголовок.", "error");
        return;
      }
      if (this.article.contentBlocks.length === 0) {
        ui()?.showToast?.("Добавь хотя бы один пункт.", "error");
        return;
      }
      if (this.article.tags.length === 0) {
        ui()?.showToast?.("Добавь хотя бы один тег.", "error");
        return;
      }

      try {
        const authorId = await this.resolveAuthorId();
        const payload = {
          title: this.article.title,
          lead: this.article.lead,
          authorId,
          articleType: "tips" as const,
          imageUrl: this.article.imageUrl,
          imageCaption: this.article.imageCaption,
          category: this.article.category,
          tags: this.article.tags,
          techTags: this.article.techTags,
          isHotContent: Boolean(this.article.isHotContent),
          isOnLanding: Boolean(this.article.isOnLanding),
          isMainInCategory: Boolean(this.article.isMainInCategory),
          content: this.article.contentBlocks,
        };

        if (this.isEditMode && this.articleId) {
          await articlesApi.update(this.articleId, payload);
          ui()?.showToast?.("Статья обновлена!");
          globalThis.location.href = this.onSaveRedirect || "/dashboard";
        } else {
          await articlesApi.create(payload);
          ui()?.showToast?.("Статья создана!");
          globalThis.location.href = "/dashboard";
        }
      } catch (e) {
        console.error("Ошибка сохранения:", e);
        const msg =
          e instanceof Error ? e.message : "Ошибка во время сохранения.";
        ui()?.showToast?.(msg, "error");
      }
    },
  };
}
