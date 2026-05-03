import { visualStoriesApi, authorsApi } from "@/lib/api/api";
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
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const normalizeTechTags = (tags?: string[]) => {
  if (!Array.isArray(tags)) return [];
  const deduped = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    if (typeof raw !== "string") continue;
    const slug = slugifyTag(raw);
    if (!slug || deduped.has(slug)) continue;
    deduped.add(slug);
    result.push(slug);
  }
  return result;
};

const normalizeTags = (
  tags?: string[],
  categoryTags?: Record<string, Array<{ title: string; value: string }>>,
  category?: string,
) => {
  if (!Array.isArray(tags)) return [];
  const legacyMap: Record<string, string> = {};
  if (category && categoryTags?.[category]) {
    for (const tag of categoryTags[category]) {
      legacyMap[tag.title] = tag.value;
    }
  }
  const deduped = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const mapped = legacyMap[trimmed] || trimmed;
    if (!deduped.has(mapped)) {
      deduped.add(mapped);
      result.push(mapped);
    }
  }
  return result;
};

export default function visualStoryCreatorLogic(initialState = {}) {
  const {
    categoryTags = {},
    initialStory = null,
    storyId = null,
    isEditMode = false,
    onSaveRedirect = null,
  } = initialState as {
    categoryTags?: Record<string, Array<{ title: string; value: string }>>;
    initialStory?: Record<string, unknown> | null;
    storyId?: string | null;
    isEditMode?: boolean;
    onSaveRedirect?: string | null;
  };

  const categoryLabels: Record<string, string> = {
    culture: "Культура",
    paris: "Париж",
    hotContent: "Самое Читаемое",
  };

  return {
    story: {
      title: "",
      lead: "",
      cardLead: "",
      imageUrl: "",
      category: "",
      tags: [] as string[],
      techTags: [] as string[],
      isHotContent: false,
      isOnLanding: false,
      slides: [] as Array<{ imageUrl: string; text: string }>,
    },

    storyId,
    isEditMode,
    onSaveRedirect,
    categoryTags,
    categoryLabels,
    newTagInput: "",

    authorsLoading: false,
    authors: [] as any[],
    selectedAuthorId: "",
    useNewAuthor: false,
    newAuthorFirstName: "",
    newAuthorLastName: "",

    isEditingTitle: false,
    editingTitleText: "",

    uploading: false,
    uploadProgress: 0,
    uploadingSlideIndex: null as number | null,
    isSaving: false,

    getCategoryLabel(value?: string) {
      if (!value) return "Category";
      return this.categoryLabels[value] || value;
    },

    getAvailableTags() {
      if (!this.story?.category) return [];
      return this.categoryTags[this.story.category] || [];
    },

    getTagLabel(value: string) {
      for (const tags of Object.values(this.categoryTags as Record<string, Array<{ title: string; value: string }>>)) {
        const found = tags.find((t) => t.value === value);
        if (found) return found.title;
      }
      return value;
    },

    isTagSelected(value: string) {
      return this.story.tags.includes(value);
    },

    toggleTag(value: string) {
      const normalized = normalizeTags([value], this.categoryTags, this.story.category)[0] || value;
      const idx = this.story.tags.indexOf(normalized);
      if (idx >= 0) {
        this.story.tags.splice(idx, 1);
      } else {
        this.story.tags.push(normalized);
      }
    },

    removeTag(value: string) {
      const idx = this.story.tags.indexOf(value);
      if (idx >= 0) this.story.tags.splice(idx, 1);
    },

    addCustomTag() {
      const slug = slugifyTag(this.newTagInput);
      if (!slug) {
        window.Alpine?.store("ui")?.showToast?.("Введи тег латиницей.", "error");
        return;
      }
      if (this.story.tags.includes(slug) || this.story.techTags.includes(slug)) {
        window.Alpine?.store("ui")?.showToast?.("Такой тег уже есть.", "info");
        this.newTagInput = "";
        return;
      }
      this.story.techTags.push(slug);
      this.story.techTags = normalizeTechTags(this.story.techTags);
      this.newTagInput = "";
    },

    removeTechTag(value: string) {
      const idx = this.story.techTags.indexOf(value);
      if (idx >= 0) this.story.techTags.splice(idx, 1);
    },

    handleCategoryChange(value: string) {
      this.story.category = value;
    },

    getAuthorLabel(author: any) {
      const first = typeof author?.firstName === "string" ? author.firstName.trim() : "";
      const last = typeof author?.lastName === "string" ? author.lastName.trim() : "";
      return `${first} ${last}`.trim();
    },

    async loadAuthors() {
      this.authorsLoading = true;
      try {
        const authors = await authorsApi.list();
        this.authors = Array.isArray(authors) ? authors : [];
        if (this.selectedAuthorId) {
          const exists = this.authors.some((a: any) => a.id === this.selectedAuthorId);
          if (!exists && (this.story as any).author) {
            const fallback = (this.story as any).author;
            this.authors.unshift({
              id: this.selectedAuthorId,
              firstName: fallback.firstName || "",
              lastName: fallback.lastName || "",
              role: fallback.role || "author",
              avatar: fallback.avatar || "",
            });
          }
        }
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
        const created = await authorsApi.create({ firstName, lastName });
        this.authors.unshift(created);
        this.selectedAuthorId = created.id;
        this.useNewAuthor = false;
        this.newAuthorFirstName = "";
        this.newAuthorLastName = "";
        return created.id;
      }
      if (!this.selectedAuthorId) {
        throw new Error("Выбери автора из списка или создай нового.");
      }
      return this.selectedAuthorId;
    },

    addSlide() {
      this.story.slides.push({ imageUrl: "", text: "" });
    },

    removeSlide(index: number) {
      const uiStore = window.Alpine?.store?.("ui");
      const doRemove = () => this.story.slides.splice(index, 1);
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation("Удалить этот слайд?", doRemove);
      } else {
        doRemove();
      }
    },

    handleCoverImageUpload(event: Event) {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      this.uploading = true;
      this.uploadingSlideIndex = null;
      this.uploadProgress = 0;

      const storageRef = ref(storage, `visual-stories/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          console.error("Upload failed:", error);
          window.Alpine?.store("ui")?.showToast?.(`Ошибка загрузки: ${error.message}`, "error");
          this.uploading = false;
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            this.story.imageUrl = downloadURL;
            this.uploading = false;
            window.Alpine?.store("ui")?.showToast?.("Обложка успешно загружена!");
          });
        },
      );
    },

    handleSlideImageUpload(event: Event, slideIndex: number) {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      this.uploading = true;
      this.uploadingSlideIndex = slideIndex;
      this.uploadProgress = 0;

      const storageRef = ref(storage, `visual-stories/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          console.error("Upload failed:", error);
          window.Alpine?.store("ui")?.showToast?.(`Ошибка загрузки: ${error.message}`, "error");
          this.uploading = false;
          this.uploadingSlideIndex = null;
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            if (this.story.slides[slideIndex] !== undefined) {
              this.story.slides[slideIndex].imageUrl = downloadURL;
            }
            this.uploading = false;
            this.uploadingSlideIndex = null;
            window.Alpine?.store("ui")?.showToast?.("Картинка успешно загружена!");
          });
        },
      );
    },

    editTitle() {
      this.isEditingTitle = true;
      this.editingTitleText = this.story.title;
    },
    saveTitle() {
      this.story.title = this.editingTitleText;
      this.isEditingTitle = false;
    },
    cancelEditTitle() {
      this.isEditingTitle = false;
    },

    init() {
      if (initialStory) {
        const copy = JSON.parse(JSON.stringify(initialStory));
        this.story.title = copy.title || "";
        this.story.lead = copy.lead || "";
        this.story.cardLead = copy.cardLead || "";
        this.story.imageUrl = copy.imageUrl || "";
        this.story.category = copy.category || "";
        this.story.tags = Array.isArray(copy.tags) ? copy.tags : [];
        this.story.techTags = Array.isArray(copy.techTags) ? copy.techTags : [];
        this.story.isHotContent = Boolean(copy.isHotContent);
        this.story.isOnLanding = Boolean(copy.isOnLanding);
        this.story.slides = Array.isArray(copy.slides) ? copy.slides : [];
        (this.story as any).author = copy.author;
        this.selectedAuthorId = typeof copy.authorId === "string" ? copy.authorId : "";
      }
      this.loadAuthors();
    },

    async saveStory() {
      if (this.uploading) {
        window.Alpine?.store("ui")?.showToast?.("Подожди — загрузка ещё не завершилась.", "error");
        return;
      }
      if (this.isSaving) return;
      this.isSaving = true;

      if (!this.story.title.trim()) {
        window.Alpine?.store("ui")?.showToast?.("Введи заголовок визуальной истории.", "error");
        this.isSaving = false;
        return;
      }

      if (this.story.slides.length === 0) {
        window.Alpine?.store("ui")?.showToast?.("Добавь хотя бы один слайд.", "error");
        this.isSaving = false;
        return;
      }

      const emptyImageSlide = this.story.slides.findIndex((s) => !s.imageUrl);
      if (emptyImageSlide !== -1) {
        window.Alpine?.store("ui")?.showToast?.(
          `Слайд ${emptyImageSlide + 1} без изображения — загрузи картинку.`,
          "error",
        );
        this.isSaving = false;
        return;
      }

      try {
        const resolvedAuthorId = await this.resolveAuthorId();
        const tagsForDb = this.story.tags.map((tag: string) => this.getTagLabel(tag));
        const payload = {
          title: this.story.title,
          lead: this.story.lead,
          cardLead: this.story.cardLead,
          imageUrl: this.story.imageUrl || undefined,
          authorId: resolvedAuthorId,
          slides: this.story.slides,
          category: this.story.category,
          tags: tagsForDb,
          techTags: normalizeTechTags(this.story.techTags),
          isHotContent: this.story.isHotContent,
          isOnLanding: this.story.isOnLanding,
        };

        if (this.isEditMode && this.storyId) {
          await visualStoriesApi.update(this.storyId, payload);
          window.Alpine?.store("ui")?.showToast?.("Визуальная история обновлена!");
          const redirectTo = this.onSaveRedirect || `/dashboard/visual-story/${this.storyId}/edit`;
          setTimeout(() => { globalThis.location.href = redirectTo; }, 1500);
        } else {
          const result = await visualStoriesApi.create(payload);
          window.Alpine?.store("ui")?.showToast?.("Визуальная история создана!");
          setTimeout(() => { globalThis.location.href = `/visual-story/${result.id}`; }, 1500);
        }
      } catch (error) {
        console.error("Save error:", error);
        const message = error instanceof Error ? error.message : "Ошибка при сохранении.";
        window.Alpine?.store("ui")?.showToast?.(message, "error");
        this.isSaving = false;
      }
    },

    deleteStory(redirectUrl: string) {
      if (!this.storyId) return;

      const performDelete = async () => {
        try {
          await visualStoriesApi.delete(this.storyId!);
          window.Alpine?.store("ui")?.showToast?.("Визуальная история удалена");
          setTimeout(() => {
            window.location.href = redirectUrl || "/dashboard/visual-stories";
          }, 1500);
        } catch (error) {
          console.error(error);
          window.Alpine?.store("ui")?.showToast?.("Не удалось удалить.", "error");
        }
      };

      const uiStore = window.Alpine?.store?.("ui");
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation(
          `Удалить «${this.story.title}»? Это действие необратимо.`,
          performDelete,
        );
      } else {
        performDelete();
      }
    },
  };
}
