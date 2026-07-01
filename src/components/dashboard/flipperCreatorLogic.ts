import { flippersApi, authorsApi } from "@/lib/api/api";
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

const createCarouselItem = (item: Record<string, unknown> = {}) => ({
  imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : "",
  caption: typeof item.caption === "string" ? item.caption : "",
  _dashboardUid:
    typeof item._dashboardUid === "string"
      ? item._dashboardUid
      : globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
});

const stripCarouselItemUiState = (item: Record<string, unknown> = {}) => ({
  imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : "",
  caption: typeof item.caption === "string" ? item.caption : "",
});

export default function flipperCreatorLogic(initialState = {}) {
  const {
    initialFlipper = null,
    initialAuthors = [],
    flipperId = null,
    isEditMode = false,
    isPreview = false,
    onSaveRedirect = null,
    categoryTags = {},
    parisDistrictOptions = [],
  } = initialState as {
    initialFlipper?: any;
    initialAuthors?: Array<Record<string, unknown>>;
    flipperId?: string | null;
    isEditMode?: boolean;
    isPreview?: boolean;
    onSaveRedirect?: string | null;
    categoryTags?: Record<string, Array<{ title: string; value: string }>>;
    parisDistrictOptions?: Array<{ title: string; value: string }>;
  };

  const buildLegacyTagMap = (category?: string) => {
    if (!category) return {};
    const tags = normalizeTagOptions(categoryTags[category]);
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

  const buildParisDistrictMap = () =>
    Object.fromEntries(
      parisDistrictOptions.flatMap((district) => [
        [district.value.toLowerCase(), district.value],
        [district.title.toLowerCase(), district.value],
      ]),
    );

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

  const normalizeLoadedFlipper = (data: any) => {
    if (!data || typeof data !== "object") {
      return null;
    }
    const copy = JSON.parse(JSON.stringify(data));
    const normalizedCategory =
      typeof copy.category === "string" ? copy.category.trim() : "";
    const isHotContentLegacy =
      Boolean(copy.isHotContent) || normalizedCategory === "hotContent";
    copy.category =
      isHotContentLegacy && normalizedCategory === "hotContent"
        ? ""
        : normalizedCategory;
    copy.isHotContent = isHotContentLegacy;
    copy.isNotebookContent = Boolean(copy.isNotebookContent);
    copy.isMaagChoice = Boolean(copy.isMaagChoice);
    copy.paid = Boolean(copy.paid);
    copy.published = Boolean(copy.published);
    copy.publishedAt = copy.publishedAt ?? null;
    copy.lead = copy.lead ?? "";
    copy.cardLead = copy.cardLead ?? "";
    copy.tags = normalizeTags(copy.tags, copy.category);
    copy.parisSubCategories = normalizeTags(
      copy.parisSubCategories ?? (copy.category === "paris" ? copy.tags : []),
      "paris",
    );
    copy.parisDistrict = normalizeParisDistrict(copy.parisDistrict);
    copy.binaryForGuide = Boolean(copy.binaryForGuide);
    copy.relatedContent = sanitizeRelatedContent(copy.relatedContent);
    copy.carouselContent = Array.isArray(copy.carouselContent)
      ? copy.carouselContent.map((item: Record<string, unknown>) =>
          createCarouselItem(item),
        )
      : [createCarouselItem()];
    return copy;
  };

  return {
    flipper: {
      title: "",
      lead: "",
      cardLead: "",
      category: "",
      isHotContent: false,
      isNotebookContent: false,
      isMaagChoice: false,
      paid: false,
      published: false,
      publishedAt: null,
      tags: [],
      parisSubCategories: [],
      parisDistrict: "",
      binaryForGuide: false,
      carouselContent: [createCarouselItem()],
      relatedContent: createEmptyRelatedContent(),
      contentCollectionId: null as string | null,
    },
    uploading: false,
    uploadProgress: 0,
    uploadingIndex: -1,
    isSaving: false,
    contentListsLoading: false,
    relatedContentLists: createEmptyRelatedContentLists(),
    relatedContentTypeOptions: RELATED_CONTENT_TYPE_OPTIONS,
    selectedRelatedContentType: "article",
    selectedRelatedContentId: "",
    ...createContentCollectionEditorState("flipper"),
    flipperId,
    isEditMode,
    onSaveRedirect,
    categoryTags,
    parisDistrictOptions,
    authorsLoading: false,
    authors: initialAuthors,
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
        return this.flipperId;
      },
      getMainHeroTarget() {
        return this.flipperId ? { type: "flipper", id: this.flipperId } : null;
      },
      getCategoryHeroTarget() {
        const cat = (this.flipper?.category || "").trim().toLowerCase();
        if (!this.flipperId || (cat !== "culture" && cat !== "paris")) return null;
        return { type: "flipper", id: this.flipperId, category: cat as "culture" | "paris" };
      },
    }),

    init() {
      type PreviewState = {
        flipper?: unknown;
        flipperId?: string | null;
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
        const stored = window.localStorage?.getItem("flipperPreview");
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed && typeof parsed === "object") {
          previewState = parsed as PreviewState;
        }
      } catch (error) {
        console.error("Failed to load flipper preview draft:", error);
      }

      if (initialFlipper) {
        const flipperCopy = normalizeLoadedFlipper(initialFlipper);
        this.flipper = { ...this.flipper, ...flipperCopy };
        if (!this.flipper.carouselContent || this.flipper.carouselContent.length === 0) {
          this.flipper.carouselContent = [createCarouselItem()];
        }
      }

      const shouldApplyPreview = (() => {
        if (!previewState?.flipper) return false;
        if (isPreview) return true;
        const previewId =
          typeof previewState.flipperId === "string" && previewState.flipperId
            ? previewState.flipperId
            : null;
        const isPreviewEdit = Boolean(previewState.isEditMode);
        const isSameEdit =
          this.isEditMode && previewId !== null && previewId === this.flipperId;
        const isCreateDraft = !this.isEditMode && !previewId && !isPreviewEdit;
        return isSameEdit || isCreateDraft;
      })();

      if (shouldApplyPreview && previewState?.flipper) {
        const flipperCopy = normalizeLoadedFlipper(previewState.flipper);
        if (flipperCopy) {
          this.flipper = { ...this.flipper, ...flipperCopy };
          if (isPreview) {
            this.flipperId =
              typeof previewState.flipperId === "string"
                ? previewState.flipperId
                : null;
            this.isEditMode = Boolean(previewState.isEditMode);
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

      this.flipper.relatedContent = sanitizeRelatedContent(
        this.flipper.relatedContent,
        "flipper",
        this.flipperId,
      );
      if (!restoredPreviewAuthorState) {
        this.selectedAuthorId =
          typeof this.flipper.authorId === "string" ? this.flipper.authorId : "";
      }
      this.ensureSelectedAuthorPresent();
      this.fetchContentLists();
      this.loadAuthors();
      this.syncCurrentContentCollection();
      this.loadContentCollections();
      this.loadLandingPlacements();
    },

    getCategoryLabel(value?: string) {
      if (!value) return "Листалка";
      const categoryLabels: Record<string, string> = {
        culture: "Культура",
        paris: "Париж",
        hotContent: "Самое Читаемое",
      };
      return categoryLabels[value] || this.getTagLabel(value);
    },

    returnToEdit() {
      window.location.href =
        this.isEditMode && this.flipperId
          ? `/dashboard/flippers/edit/${this.flipperId}`
          : "/dashboard/flippers/create";
    },

    previewFlipper() {
      if (this.uploading) {
        window.Alpine.store("ui").showToast(
          "Подожди — загрузка картинки ещё не завершилась.",
          "error",
        );
        return;
      }

      const authorDisplay = this.getSelectedAuthorDisplay();
      const previewState = {
        flipper: this.flipper,
        flipperId: this.flipperId,
        isEditMode: this.isEditMode,
        selectedAuthorId: this.selectedAuthorId,
        useNewAuthor: this.useNewAuthor,
        newAuthorFirstName: this.newAuthorFirstName,
        newAuthorLastName: this.newAuthorLastName,
        authorDisplay,
      };
      window.localStorage.setItem("flipperPreview", JSON.stringify(previewState));
      window.location.href = "/dashboard/flippers/preview";
    },

    getAvailableTags() {
      if (!this.flipper?.category) return [];
      return normalizeTagOptions(this.categoryTags[this.flipper.category]);
    },
    isParisCategory() {
      return this.flipper?.category === "paris";
    },
    getSelectedCategoryTags() {
      if (this.isParisCategory()) {
        this.flipper.parisSubCategories = Array.isArray(
          this.flipper.parisSubCategories,
        )
          ? this.flipper.parisSubCategories
          : [];
        return this.flipper.parisSubCategories;
      }
      this.flipper.tags = Array.isArray(this.flipper.tags)
        ? this.flipper.tags
        : [];
      return this.flipper.tags;
    },
    getTagLabel(value: string) {
      const availableForCurrent = this.getAvailableTags();
      const match = availableForCurrent.find((tag) => tag.value === value);
      if (match) return match.title;
      for (const tags of Object.values(this.categoryTags)) {
        const found = tags.find((tag) => tag.value === value);
        if (found) return found.title;
      }
      return value;
    },
    isTagSelected(value: string) {
      return this.getSelectedCategoryTags().includes(value);
    },
    toggleTag(value: string) {
      const normalized = normalizeTags([value], this.flipper.category)[0] || value;
      const targetTags = this.getSelectedCategoryTags();
      const idx = targetTags.indexOf(normalized);
      if (idx >= 0) {
        targetTags.splice(idx, 1);
      } else {
        targetTags.push(normalized);
      }
      if (this.isParisCategory()) {
        this.flipper.parisSubCategories = normalizeTags(
          this.flipper.parisSubCategories,
          "paris",
        );
      } else {
        this.flipper.tags = normalizeTags(this.flipper.tags, this.flipper.category);
      }
    },
    removeTag(value: string) {
      const targetTags = this.getSelectedCategoryTags();
      const idx = targetTags.indexOf(value);
      if (idx >= 0) {
        targetTags.splice(idx, 1);
      }
    },
    handleCategoryChange(value: string) {
      this.flipper.category = value;
      this.flipper.tags = normalizeTags(this.flipper.tags, value);
      this.flipper.parisSubCategories = normalizeTags(
        this.flipper.parisSubCategories,
        "paris",
      );
      this.flipper.parisDistrict = normalizeParisDistrict(this.flipper.parisDistrict);
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

      const fallbackAuthor = this.flipper?.author;
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
      const fallbackAuthor = this.flipper?.author;
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
      if (!this.selectedRelatedContentType) {
        return [];
      }
      return this.relatedContentLists[this.selectedRelatedContentType] ?? [];
    },
    getSelectedEntityRelatedContent(type) {
      return this.flipper?.relatedContent?.[type] ?? [];
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

      const normalized = sanitizeRelatedContent(this.flipper.relatedContent);
      if (this.flipperId && type === "flipper" && id === this.flipperId) {
        window.Alpine?.store("ui")?.showToast?.(
          "Нельзя привязать текущий флиппер к самому себе.",
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
      this.flipper.relatedContent = normalized;
      this.selectedRelatedContentId = "";
    },
    removeRelatedContent(type, id) {
      const normalized = sanitizeRelatedContent(this.flipper.relatedContent);
      normalized[type] = normalized[type].filter((itemId) => itemId !== id);
      this.flipper.relatedContent = normalized;
    },

    addCarouselItem() {
      if (this.uploading) return;
      this.flipper.carouselContent.push(createCarouselItem());
    },
    removeCarouselItem(index: number) {
      if (this.uploading) return;
      this.flipper.carouselContent.splice(index, 1);
    },
    async handleImageUpload(event, itemUid?: string) {
      const raw = event.target.files[0];
      if (!raw) return;
      if (this.uploading) {
        window.Alpine.store("ui").showToast(
          "Подожди — текущая загрузка ещё не завершилась.",
          "error",
        );
        return;
      }

      const index = this.flipper.carouselContent.findIndex(
        (item) => item._dashboardUid === itemUid,
      );
      if (index === -1) return;

      this.uploading = true;
      this.uploadingIndex = index;
      this.uploadProgress = 0;
      const file = await compressImage(raw);
      const storageRef = ref(storage, `flippers/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on("state_changed", (snapshot) => {
        this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      }, (error) => {
        console.error("Upload failed:", error);
        window.Alpine.store("ui").showToast("Ошибка загрузки изображения.", "error");
        this.uploading = false;
        this.uploadingIndex = -1;
      }, () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          const target = this.flipper.carouselContent.find(
            (item) => item._dashboardUid === itemUid,
          );
          if (target) {
            target.imageUrl = downloadURL;
          }
          window.Alpine.store("ui").showToast("Изображение успешно загружено!");
          this.uploading = false;
          this.uploadingIndex = -1;
        });
      });
    },

    async saveFlipper() {
      // Block save while a slide image is still uploading
      if (this.uploading) {
        window.Alpine.store("ui").showToast(
          "Подожди — загрузка картинки ещё не завершилась.",
          "error",
        );
        return;
      }

      // Guard against double-submit
      if (this.isSaving) return;
      this.isSaving = true;

      const normalizedCategory =
        typeof this.flipper.category === "string"
          ? this.flipper.category.trim()
          : "";
      const isHotContentFlag =
        Boolean(this.flipper.isHotContent) ||
        normalizedCategory === "hotContent";
      this.flipper.isHotContent = isHotContentFlag;
      this.flipper.category =
        isHotContentFlag && normalizedCategory === "hotContent"
          ? ""
          : normalizedCategory;
      this.flipper.tags = normalizeTags(this.flipper.tags, this.flipper.category);
      this.flipper.parisSubCategories = normalizeTags(
        this.flipper.parisSubCategories,
        "paris",
      );
      this.flipper.parisDistrict = normalizeParisDistrict(this.flipper.parisDistrict);

      if (!this.flipper.title) {
        window.Alpine.store("ui").showToast("Заголовок обязателен.", "error");
        this.isSaving = false;
        return;
      }
      if (this.flipper.carouselContent.some(item => !item.imageUrl)) {
        window.Alpine.store("ui").showToast("Для каждого слайда нужно загрузить изображение.", "error");
        this.isSaving = false;
        return;
      }

      const selectedCategoryTags = this.getSelectedCategoryTags();
      if (!Array.isArray(selectedCategoryTags) || selectedCategoryTags.length === 0) {
        window.Alpine.store("ui").showToast(
          "Добавь хотя бы один тег — без него листалка не сохранится.",
          "error",
        );
        this.isSaving = false;
        return;
      }

      try {
        const resolvedAuthorId = await this.resolveAuthorId();
        const tagsForDb = selectedCategoryTags.map((tag) => this.getTagLabel(tag));
        const isParisCategory = this.isParisCategory();
        const payload = {
          ...this.flipper,
          authorId: resolvedAuthorId,
          carouselContent: this.flipper.carouselContent.map(stripCarouselItemUiState),
          lead: this.flipper.lead,
          cardLead: this.flipper.cardLead,
          tags: tagsForDb,
          parisSubCategories: isParisCategory ? this.flipper.parisSubCategories : [],
          parisDistrict: isParisCategory ? this.flipper.parisDistrict || null : null,
          binaryForGuide: false,
          isHotContent: Boolean(this.flipper.isHotContent),
          isNotebookContent: Boolean(this.flipper.isNotebookContent),
          isMaagChoice: Boolean(this.flipper.isMaagChoice),
          paid: Boolean(this.flipper.paid),
          relatedContent: sanitizeRelatedContent(
            this.flipper.relatedContent,
            "flipper",
            this.flipperId,
          ),
          contentCollectionId: normalizeContentCollectionId(
            this.flipper.contentCollectionId,
          ),
        };

        if (this.isEditMode && this.flipperId) {
          await flippersApi.update(this.flipperId, payload);
          window.localStorage.removeItem("flipperPreview");
          window.Alpine.store("ui").showToast("Листалка успешно обновлена!");
          const redirectTo = this.onSaveRedirect || `/dashboard/flippers`;
          setTimeout(() => { globalThis.location.href = redirectTo; }, 1500);
        } else {
          await flippersApi.create(payload);
          window.localStorage.removeItem("flipperPreview");
          window.Alpine.store("ui").showToast("Листалка успешно создана!");
          setTimeout(() => { globalThis.location.href = `/dashboard/flippers`; }, 1500);
        }
      } catch (error) {
        console.error("Ошибка сохранения листалки:", error);
        const message = error instanceof Error ? error.message : "Произошла неизвестная ошибка.";
        window.Alpine.store("ui").showToast(message, "error");
        this.isSaving = false;
      }
    },

    deleteFlipper() {
      if (!this.flipperId) return;

      const performDelete = async () => {
        try {
          await flippersApi.delete(this.flipperId);
          window.Alpine.store("ui").showToast("Листалка удалена");
          setTimeout(() => {
            window.location.href = this.onSaveRedirect || "/dashboard/flippers";
          }, 1000);
        } catch (error) {
          console.error("Delete flipper failed:", error);
          window.Alpine.store("ui").showToast("Не удалось удалить листалку.", "error");
        }
      };

      const uiStore = window.Alpine?.store?.("ui");
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation("Удалить листалку? Это действие необратимо.", performDelete);
      } else {
        performDelete();
      }
    },
  };
}
