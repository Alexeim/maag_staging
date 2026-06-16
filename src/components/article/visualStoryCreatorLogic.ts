import {
  visualStoriesApi,
  authorsApi,
  type VisualStorySlide,
} from "@/lib/api/api";
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

const normalizeSlide = (slide?: Record<string, unknown>): VisualStorySlide => ({
  imageUrl: typeof slide?.imageUrl === "string" ? slide.imageUrl : "",
  contentType: slide?.contentType === "quote" ? "quote" : "text",
  text: typeof slide?.text === "string" ? slide.text : "",
  caption: typeof slide?.caption === "string" ? slide.caption : "",
  quote: typeof slide?.quote === "string" ? slide.quote : "",
  quoteAuthor:
    typeof slide?.quoteAuthor === "string" ? slide.quoteAuthor : "",
});

const normalizeTags = (
  tags?: string[],
  categoryTags?: Record<string, Array<{ title: string; value: string }>>,
  category?: string,
) => {
  if (!Array.isArray(tags)) return [];
  const legacyMap: Record<string, string> = {};
  if (category && categoryTags?.[category]) {
    for (const tag of normalizeTagOptions(categoryTags[category])) {
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

export default function visualStoryCreatorLogic(initialState = {}) {
  const {
    categoryTags = {},
    parisDistrictOptions = [],
    initialStory = null,
    storyId = null,
    isEditMode = false,
    onSaveRedirect = null,
    isPreview = false,
  } = initialState as {
    categoryTags?: Record<string, Array<{ title: string; value: string }>>;
    parisDistrictOptions?: Array<{ title: string; value: string }>;
    initialStory?: Record<string, unknown> | null;
    storyId?: string | null;
    isEditMode?: boolean;
    onSaveRedirect?: string | null;
    isPreview?: boolean;
  };

  const categoryLabels: Record<string, string> = {
    culture: "Культура",
    paris: "Париж",
    hotContent: "Самое Читаемое",
  };

  const buildParisDistrictMap = () =>
    Object.fromEntries(
      parisDistrictOptions.flatMap((district) => [
        [district.value.toLowerCase(), district.value],
        [district.title.toLowerCase(), district.value],
      ]),
    );

  const normalizeParisDistrict = (value?: unknown) => {
    if (typeof value !== "string") {
      return "";
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }
    const districtMap = buildParisDistrictMap();
    return districtMap[trimmed.toLowerCase()] || trimmed;
  };

  return {
    story: {
      title: "",
      lead: "",
      cardLead: "",
      imageUrl: "",
      imageCaption: "",
      category: "",
      tags: [] as string[],
      parisSubCategories: [] as string[],
      parisDistrict: "",
      binaryForGuide: false,
      isHotContent: false,
      paid: false,
      published: false,
      publishedAt: null,
      slides: [] as Array<{
        imageUrl: string;
        contentType: "text" | "quote";
        text: string;
        caption: string;
        quote: string;
        quoteAuthor: string;
      }>,
      relatedContent: createEmptyRelatedContent(),
      contentCollectionId: null as string | null,
    },

    storyId,
    isEditMode,
    isPreview,
    onSaveRedirect,
    categoryTags,
    parisDistrictOptions,
    categoryLabels,

    authorsLoading: false,
    authors: [] as any[],
    selectedAuthorId: "",
    useNewAuthor: false,
    newAuthorFirstName: "",
    newAuthorLastName: "",
    ...createLandingPlacementManager({
      getEntityId() {
        return this.storyId;
      },
      getMainHeroTarget() {
        return this.storyId ? { type: "visual-story", id: this.storyId } : null;
      },
      getCategoryHeroTarget() {
        const cat = (this.story?.category || "").trim().toLowerCase();
        if (!this.storyId || (cat !== "culture" && cat !== "paris")) return null;
        return { type: "visual-story", id: this.storyId, category: cat as "culture" | "paris" };
      },
    }),

    isEditingTitle: false,
    editingTitleText: "",

    uploading: false,
    uploadProgress: 0,
    uploadingSlideIndex: null as number | null,
    isSaving: false,
    contentListsLoading: false,
    relatedContentLists: createEmptyRelatedContentLists(),
    relatedContentTypeOptions: RELATED_CONTENT_TYPE_OPTIONS,
    selectedRelatedContentType: "article",
    selectedRelatedContentId: "",
    ...createContentCollectionEditorState("story"),

    getCategoryLabel(value?: string) {
      if (!value) return "Category";
      return this.categoryLabels[value] || value;
    },

    getAvailableTags() {
      if (!this.story?.category) return [];
      return normalizeTagOptions(this.categoryTags[this.story.category]);
    },
    isParisCategory() {
      return this.story?.category === "paris";
    },
    getSelectedCategoryTags() {
      if (this.isParisCategory()) {
        this.story.parisSubCategories = Array.isArray(
          this.story.parisSubCategories,
        )
          ? this.story.parisSubCategories
          : [];
        return this.story.parisSubCategories;
      }
      this.story.tags = Array.isArray(this.story.tags) ? this.story.tags : [];
      return this.story.tags;
    },

    getTagLabel(value: string) {
      for (const tags of Object.values(this.categoryTags as Record<string, Array<{ title: string; value: string }>>)) {
        const found = tags.find((t) => t.value === value);
        if (found) return found.title;
      }
      return value;
    },

    isTagSelected(value: string) {
      return this.getSelectedCategoryTags().includes(value);
    },

    toggleTag(value: string) {
      const normalized = normalizeTags([value], this.categoryTags, this.story.category)[0] || value;
      const targetTags = this.getSelectedCategoryTags();
      const idx = targetTags.indexOf(normalized);
      if (idx >= 0) {
        targetTags.splice(idx, 1);
      } else {
        targetTags.push(normalized);
      }
      if (this.isParisCategory()) {
        this.story.parisSubCategories = normalizeTags(
          this.story.parisSubCategories,
          this.categoryTags,
          "paris",
        );
      } else {
        this.story.tags = normalizeTags(
          this.story.tags,
          this.categoryTags,
          this.story.category,
        );
      }
    },

    removeTag(value: string) {
      const targetTags = this.getSelectedCategoryTags();
      const idx = targetTags.indexOf(value);
      if (idx >= 0) targetTags.splice(idx, 1);
    },

    handleCategoryChange(value: string) {
      this.story.category = value;
      this.story.tags = normalizeTags(this.story.tags, this.categoryTags, value);
      this.story.parisSubCategories = normalizeTags(
        this.story.parisSubCategories,
        this.categoryTags,
        "paris",
      );
      this.story.parisDistrict = normalizeParisDistrict(this.story.parisDistrict);
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
      this.story.slides.push({
        imageUrl: "",
        contentType: "text",
        text: "",
        caption: "",
        quote: "",
        quoteAuthor: "",
      });
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

    async handleCoverImageUpload(event: Event) {
      const raw = (event.target as HTMLInputElement).files?.[0];
      if (!raw) return;

      this.uploading = true;
      this.uploadingSlideIndex = null;
      this.uploadProgress = 0;

      const file = await compressImage(raw);
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

    async handleSlideImageUpload(event: Event, slideIndex: number) {
      const raw = (event.target as HTMLInputElement).files?.[0];
      if (!raw) return;

      this.uploading = true;
      this.uploadingSlideIndex = slideIndex;
      this.uploadProgress = 0;

      const file = await compressImage(raw);
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
    getAvailableRelatedContentItems() {
      if (!this.selectedRelatedContentType) return [];
      return this.relatedContentLists[this.selectedRelatedContentType] ?? [];
    },
    getSelectedEntityRelatedContent(type) {
      return this.story?.relatedContent?.[type] ?? [];
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
      if (!type || !id) return;

      const normalized = sanitizeRelatedContent(this.story.relatedContent);
      if (this.storyId && type === "visualStory" && id === this.storyId) {
        window.Alpine?.store("ui")?.showToast?.(
          "Нельзя привязать текущую visual story к самой себе.",
          "error",
        );
        return;
      }
      if (normalized[type].includes(id)) {
        window.Alpine?.store("ui")?.showToast?.(
          "Этот материал уже добавлен.",
          "info",
        );
        return;
      }

      normalized[type] = [...normalized[type], id];
      this.story.relatedContent = normalized;
      this.selectedRelatedContentId = "";
    },
    removeRelatedContent(type, id) {
      const normalized = sanitizeRelatedContent(this.story.relatedContent);
      normalized[type] = normalized[type].filter((itemId) => itemId !== id);
      this.story.relatedContent = normalized;
    },

    init() {
      let previewState: any = null;
      if (typeof window !== "undefined") {
        try {
          const stored = window.localStorage?.getItem("visualStoryPreview");
          previewState = stored ? JSON.parse(stored) : null;
        } catch (error) {
          console.error("Failed to parse visual story preview draft:", error);
        }
      }

      const previewStory = previewState?.story && typeof previewState.story === "object"
        ? previewState.story
        : null;
      const storyDraft = this.isPreview && previewStory ? previewStory : initialStory;

      if (this.isPreview && previewState) {
        this.storyId = typeof previewState.storyId === "string" ? previewState.storyId : null;
        this.isEditMode = Boolean(previewState.isEditMode);
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
      }

      if (storyDraft) {
        const copy = JSON.parse(JSON.stringify(storyDraft));
        this.story.title = copy.title || "";
        this.story.lead = copy.lead || "";
        this.story.cardLead = copy.cardLead || "";
        this.story.imageUrl = copy.imageUrl || "";
        this.story.imageCaption =
          typeof copy.imageCaption === "string" ? copy.imageCaption : "";
        this.story.category = copy.category || "";
        this.story.tags = normalizeTags(copy.tags, this.categoryTags, copy.category);
        this.story.parisSubCategories = normalizeTags(
          copy.parisSubCategories ?? (copy.category === "paris" ? copy.tags : []),
          this.categoryTags,
          "paris",
        );
        this.story.parisDistrict = normalizeParisDistrict(copy.parisDistrict);
        this.story.binaryForGuide = Boolean(copy.binaryForGuide);
        this.story.isHotContent = Boolean(copy.isHotContent);
        this.story.paid = Boolean(copy.paid);
        this.story.published = Boolean(copy.published);
        this.story.publishedAt = copy.publishedAt ?? null;
        this.story.slides = Array.isArray(copy.slides)
          ? copy.slides.map((slide: Record<string, unknown>) =>
              normalizeSlide(slide),
            )
          : [];
        this.story.relatedContent = sanitizeRelatedContent(
          copy.relatedContent,
          "visualStory",
          this.storyId,
        );
        (this.story as any).author = copy.author;
        this.selectedAuthorId =
          this.selectedAuthorId ||
          (typeof copy.authorId === "string" ? copy.authorId : "");
      }
      this.story.tags = Array.isArray(this.story.tags) ? this.story.tags : [];
      this.story.parisSubCategories = normalizeTags(
        this.story.parisSubCategories,
        this.categoryTags,
        "paris",
      );
      this.story.parisDistrict = normalizeParisDistrict(this.story.parisDistrict);
      this.story.binaryForGuide = Boolean(this.story.binaryForGuide);
      this.story.relatedContent = sanitizeRelatedContent(
        this.story.relatedContent,
        "visualStory",
        this.storyId,
      );
      this.fetchContentLists();
      this.loadAuthors();
      this.syncCurrentContentCollection();
      this.loadContentCollections();
      this.loadLandingPlacements();
    },

    returnToEdit() {
      window.location.href =
        this.isEditMode && this.storyId
          ? `/dashboard/visual-story/${this.storyId}/edit`
          : "/dashboard/visual-story/create";
    },

    previewStory() {
      const previewState = {
        story: this.story,
        storyId: this.storyId,
        isEditMode: this.isEditMode,
        selectedAuthorId: this.selectedAuthorId,
        useNewAuthor: this.useNewAuthor,
        newAuthorFirstName: this.newAuthorFirstName,
        newAuthorLastName: this.newAuthorLastName,
      };
      localStorage.setItem("visualStoryPreview", JSON.stringify(previewState));
      window.location.href = "/dashboard/visual-story/preview";
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

      const invalidContentSlide = this.story.slides.findIndex((slide) =>
        slide.contentType === "quote"
          ? !slide.quote.trim()
          : !slide.text.trim(),
      );
      if (invalidContentSlide !== -1) {
        const slide = this.story.slides[invalidContentSlide];
        window.Alpine?.store("ui")?.showToast?.(
          slide.contentType === "quote"
            ? `Слайд ${invalidContentSlide + 1} без цитаты — добавь текст цитаты.`
            : `Слайд ${invalidContentSlide + 1} без текста — добавь текст справа.`,
          "error",
        );
        this.isSaving = false;
        return;
      }

      try {
        const resolvedAuthorId = await this.resolveAuthorId();
        const selectedCategoryTags = this.getSelectedCategoryTags();
        const tagsForDb = selectedCategoryTags.map((tag: string) => this.getTagLabel(tag));
        const isParisCategory = this.isParisCategory();
        const payload = {
          title: this.story.title,
          lead: this.story.lead,
          cardLead: this.story.cardLead,
          imageUrl: this.story.imageUrl || undefined,
          imageCaption: this.story.imageCaption || "",
          authorId: resolvedAuthorId,
          slides: this.story.slides.map((slide) => normalizeSlide(slide)),
          category: this.story.category,
          tags: tagsForDb,
          parisSubCategories: isParisCategory ? this.story.parisSubCategories : [],
          parisDistrict: isParisCategory ? this.story.parisDistrict || null : null,
          binaryForGuide: false,
          isHotContent: this.story.isHotContent,
          paid: this.story.paid,
          published: Boolean(this.story.published),
          relatedContent: sanitizeRelatedContent(
            this.story.relatedContent,
            "visualStory",
            this.storyId,
          ),
          contentCollectionId: normalizeContentCollectionId(
            this.story.contentCollectionId,
          ),
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
