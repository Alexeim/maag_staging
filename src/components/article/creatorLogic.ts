import { articlesApi, authorsApi, contentCollectionsApi } from "@/lib/api/api";
import { app } from "../../lib/firebase/client";
import { getInitialRichTextHtml } from "@/lib/utils/richText";
import {
  fetchContentCollections,
  normalizeContentCollection,
  normalizeContentCollectionId,
  toContentCollectionOption,
} from "@/lib/utils/contentCollections";
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
import { isLegacyParisTag } from "@/content/tags/parisTags";
import {
  getBlockSummary as buildBlockSummary,
  getBlockTypeLabel as resolveBlockTypeLabel,
  getColumnTypeLabel as resolveColumnTypeLabel,
  getLinkedBlockTitle as resolveLinkedBlockTitle,
  getLinkedContentTypeLabel as resolveLinkedContentTypeLabel,
  truncatePreviewText,
} from "@/lib/utils/contentBlockPreview";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { createLandingPlacementManager } from "@/components/dashboard/landingPlacementManager";
import { compressImage } from "@/lib/images/compressImage";

const storage = getStorage(app);

const generateBlockId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `block-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const withBlockMeta = (block: Record<string, unknown>, position: number) => {
  const existingId =
    typeof block.id === "string" && block.id.trim() ? block.id.trim() : "";
  return {
    ...block,
    id: existingId || generateBlockId(),
    position,
  };
};

const reindexContentBlocks = (blocks?: unknown) => {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks
    .filter(
      (block): block is Record<string, unknown> =>
        Boolean(block) && typeof block === "object",
    )
    .map((block, index) => withBlockMeta(block, index));
};

const syncContentBlockOrder = (blocks?: unknown) => {
  if (!Array.isArray(blocks)) {
    return [];
  }

  const sortableBlocks = blocks
    .filter(
      (block): block is Record<string, unknown> =>
        Boolean(block) && typeof block === "object",
    )
    .map((block, index) => {
      const rawPosition = block.position;
      const position =
        typeof rawPosition === "number" && Number.isFinite(rawPosition)
          ? rawPosition
          : index;
      return {
        block,
        position,
        originalIndex: index,
      };
    })
    .sort((left, right) => {
      if (left.position === right.position) {
        return left.originalIndex - right.originalIndex;
      }
      return left.position - right.position;
    });

  return reindexContentBlocks(sortableBlocks.map(({ block }) => block));
};

// Helper to create a new block object
const createBlock = (type, data, position = 0) =>
  withBlockMeta({ type, ...data }, position);
const TIP_TYPES = [
  "location",
  "time",
  "money",
  "idea",
  "like",
  "dislike",
  "link",
] as const;
type TipType = (typeof TIP_TYPES)[number];
type TipItem = { type: TipType; text: string; url?: string };

export default function articleCreatorLogic(initialState = {}) {
  const {
    categoryTags = {},
    parisDistrictOptions = [],
    initialArticle = null,
    initialAuthors = [],
    articleId = null,
    isEditMode = false,
    onSaveRedirect = null,
    createSuccessRedirect = null,
    articleType = "standard",
    editRouteBase = "/dashboard/article",
    createRoute = "/dashboard/article/create",
    ...restInitialState
  } = initialState as {
    categoryTags?: Record<string, Array<{ title: string; value: string }>>;
    parisDistrictOptions?: Array<{ title: string; value: string }>;
    initialArticle?: Record<string, unknown> | null;
    initialAuthors?: Array<Record<string, unknown>>;
    articleId?: string | null;
    isEditMode?: boolean;
    onSaveRedirect?: string | null;
    createSuccessRedirect?: string | null;
    articleType?: "standard" | "tips" | "le_saviez_vous";
    editRouteBase?: string;
    createRoute?: string;
  };

  const categoryLabels: Record<string, string> = {
    culture: "Культура",
    paris: "Париж",
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
    const tags = normalizeTagOptions(categoryTags[category]);
    return Object.fromEntries(tags.map((tag) => [tag.title, tag.value]));
  };

  const normalizeTagOptions = (tags?: unknown) => {
    if (!Array.isArray(tags)) {
      return [];
    }
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
      if (!value || seen.has(value)) {
        continue;
      }
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
      if (category === "paris" && isLegacyParisTag(trimmed)) {
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

  const normalizeContentBlocks = (blocks?: unknown) => {
    const orderedBlocks = syncContentBlockOrder(blocks);
    return orderedBlocks.map((block) =>
      (block as { type?: string }).type === "video"
        ? withBlockMeta(
            normalizeVideoBlock(block as any) as Record<string, unknown>,
            Number(block.position) || 0,
          )
        : block,
    );
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
    copy.isNotebookContent = Boolean(copy.isNotebookContent);
    copy.isMaagChoice = Boolean(copy.isMaagChoice);
    const blocks = Array.isArray(copy.content)
      ? copy.content
      : Array.isArray(copy.contentBlocks)
        ? copy.contentBlocks
        : [];
    copy.contentBlocks = normalizeContentBlocks(blocks);
    copy.content = copy.contentBlocks;
    copy.tags = normalizeTags(copy.tags, copy.category);
    copy.parisSubCategories = normalizeTags(
      copy.parisSubCategories ?? (copy.category === "paris" ? copy.tags : []),
      "paris",
    );
    copy.parisDistrict = normalizeParisDistrict(copy.parisDistrict);
    copy.binaryForGuide = Boolean(copy.binaryForGuide);
    copy.paid = Boolean(copy.paid);
    copy.published = Boolean(copy.published);
    copy.publishedAt = copy.publishedAt ?? null;
    copy.tips = normalizeTips(copy.tips);
    copy.imageCaption = copy.imageCaption ?? "";
    copy.cardLead = copy.cardLead ?? "";
    copy.heroOrientation = copy.heroOrientation === "image-left" ? "image-left" : "image-right";
    copy.relatedContent = sanitizeRelatedContent(copy.relatedContent);
    copy.contentCollectionId = normalizeContentCollectionId(
      copy.contentCollectionId,
    );
    return copy;
  };

  const normalizeTips = (tips?: unknown): TipItem[] => {
    if (!Array.isArray(tips)) {
      return [];
    }
    const deduped = new Set<TipType>();
    const normalized: TipItem[] = [];
    for (const rawItem of tips) {
      if (!rawItem || typeof rawItem !== "object") {
        continue;
      }
      const typeValue = (rawItem as { type?: string }).type;
      if (!typeValue || !TIP_TYPES.includes(typeValue as TipType)) {
        continue;
      }
      const type = typeValue as TipType;
      if (deduped.has(type)) {
        continue;
      }
      const text =
        typeof (rawItem as { text?: string }).text === "string"
          ? (rawItem as { text?: string }).text!.trim()
          : "";
      if (!text) {
        continue;
      }
      deduped.add(type);
      const url =
        type === "link" && typeof (rawItem as { url?: string }).url === "string"
          ? (rawItem as { url?: string }).url!.trim()
          : undefined;
      normalized.push({ type, text, ...(url !== undefined ? { url } : {}) });
    }
    return normalized;
  };

  return {
    article: {
      title: "",
      lead: "", // Вводка — краткое описание под заголовком
      cardLead: "",
      articleType,
      imageUrl: "",
      imageCaption: "", // <-- Added caption for the main image
      heroOrientation: "image-right" as "image-left" | "image-right",
      // --- REFACTORED: from 'paragraphs' to 'contentBlocks' ---
      contentBlocks: [],
      tags: [],
      parisSubCategories: [],
      parisDistrict: "",
      binaryForGuide: false,
      tips: [] as TipItem[],
      category: "", // <-- Added category
      isHotContent: false,
      isNotebookContent: false,
      isMaagChoice: false,
      isMainInCategory: false,
      paid: false,
      published: false,
      publishedAt: null,
      relatedContent: createEmptyRelatedContent(),
      contentCollectionId: null as string | null,
    },

    // --- State for managing content lists for link blocks ---
    contentListsLoading: false,
    relatedContentLists: createEmptyRelatedContentLists(),
    relatedContentTypeOptions: RELATED_CONTENT_TYPE_OPTIONS,
    materialLinkTypeOptions: MATERIAL_LINK_TYPE_OPTIONS,
    selectedRelatedContentType: "article",
    selectedRelatedContentId: "",
    contentCollectionsLoading: false,
    availableContentCollections: [] as Array<{ id: string; title: string }>,
    contentCollection: null as { id: string; title: string } | null,
    selectedContentCollectionId: "",
    useNewContentCollection: false,
    newContentCollectionTitle: "",
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
        return this.articleId;
      },
      getMainHeroTarget() {
        return this.articleId ? { type: "article", id: this.articleId } : null;
      },
      getCategoryHeroTarget() {
        const cat = (this.article?.category || "").trim().toLowerCase();
        if (!this.articleId || (cat !== "culture" && cat !== "paris"))
          return null;
        return {
          type: "article",
          id: this.articleId,
          category: cat as "culture" | "paris",
        };
      },
    }),

    // --- State for managing the block creation UI ---
    showBlockOptions: false,

    // --- State for editing a specific block ---
    editingIndex: null,
    editingBlock: null, // Will hold a copy of the block being edited
    draggedBlockId: null,
    dragOverBlockId: null,

    isEditingTitle: false,
    editingTitleText: "",

    // --- State for editing the main image caption ---
    isEditingCaption: false,
    editingCaptionText: "",

    uploading: false,
    uploadProgress: 0,
    isSaving: false,

    categoryTags,
    articleId,
    isEditMode,
    onSaveRedirect,
    createSuccessRedirect,
    editRouteBase,
    createRoute,
    parisDistrictOptions,

    categoryLabels,
    getRichTextInitialHtml(block) {
      return getInitialRichTextHtml(block);
    },
    getColumnRichTextInitialHtml(column) {
      return getInitialRichTextHtml({
        html: column?.html,
        text: column?.content,
      });
    },
    tipOptions: [
      { type: "location" as TipType, label: "Локация" },
      { type: "time" as TipType, label: "Время" },
      { type: "money" as TipType, label: "Стоимость" },
      { type: "idea" as TipType, label: "Идея" },
      { type: "like" as TipType, label: "Плюсы" },
      { type: "dislike" as TipType, label: "Минусы" },
      { type: "link" as TipType, label: "Ссылка" },
    ],
    getCategoryLabel(value?: string) {
      if (!value) {
        return "Category";
      }
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
        resolveLinkedTitle: (currentBlock) =>
          this.getLinkedBlockTitle(currentBlock),
      });
    },
    normalizeContentBlocks(blocks) {
      return normalizeContentBlocks(blocks);
    },
    syncContentBlockOrder(blocks = this.article.contentBlocks) {
      this.article.contentBlocks = reindexContentBlocks(blocks);
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
    normalizeEditableVideoBlock(block) {
      return normalizeVideoBlock(block);
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
    getAvailableTags() {
      if (!this.article?.category) {
        return [];
      }
      return normalizeTagOptions(this.categoryTags[this.article.category]);
    },
    isParisCategory() {
      return this.article?.category === "paris";
    },
    getSelectedCategoryTags() {
      if (this.isParisCategory()) {
        this.article.parisSubCategories = Array.isArray(
          this.article.parisSubCategories,
        )
          ? this.article.parisSubCategories
          : [];
        return this.article.parisSubCategories;
      }
      this.article.tags = Array.isArray(this.article.tags)
        ? this.article.tags
        : [];
      return this.article.tags;
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
      return this.getSelectedCategoryTags().includes(value);
    },
    toggleTag(value: string) {
      const normalized =
        normalizeTags([value], this.article.category)[0] || value;
      const targetTags = this.getSelectedCategoryTags();
      const idx = targetTags.indexOf(normalized);
      if (idx >= 0) {
        targetTags.splice(idx, 1);
      } else {
        targetTags.push(normalized);
      }
      if (this.isParisCategory()) {
        this.article.parisSubCategories = normalizeTags(
          this.article.parisSubCategories,
          "paris",
        );
      } else {
        this.article.tags = normalizeTags(
          this.article.tags,
          this.article.category,
        );
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
      this.article.category = value;
      this.article.tags = normalizeTags(this.article.tags, value);
      this.article.parisSubCategories = normalizeTags(
        this.article.parisSubCategories,
        "paris",
      );
      this.article.parisDistrict = normalizeParisDistrict(
        this.article.parisDistrict,
      );
    },
    isTipSelected(type: TipType) {
      return this.article.tips.some((tip: TipItem) => tip.type === type);
    },
    toggleTip(type: TipType) {
      const idx = this.article.tips.findIndex(
        (tip: TipItem) => tip.type === type,
      );
      if (idx >= 0) {
        this.article.tips.splice(idx, 1);
      } else {
        this.article.tips.push(
          type === "link" ? { type, text: "", url: "" } : { type, text: "" },
        );
      }
    },
    getTipText(type: TipType) {
      const tip = this.article.tips.find((item: TipItem) => item.type === type);
      return tip?.text ?? "";
    },
    setTipText(type: TipType, value: string) {
      const idx = this.article.tips.findIndex(
        (tip: TipItem) => tip.type === type,
      );
      if (idx < 0) return;
      this.article.tips[idx].text = value;
    },
    getTipUrl(type: TipType) {
      const tip = this.article.tips.find((item: TipItem) => item.type === type);
      return (tip as any)?.url ?? "";
    },
    setTipUrl(type: TipType, value: string) {
      const idx = this.article.tips.findIndex(
        (tip: TipItem) => tip.type === type,
      );
      if (idx < 0) return;
      (this.article.tips[idx] as any).url = value;
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
      const alreadyExists = this.authors.some(
        (author: any) => author.id === this.selectedAuthorId,
      );
      if (alreadyExists) {
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
    syncCurrentContentCollection() {
      const currentId = normalizeContentCollectionId(
        this.article?.contentCollectionId,
      );

      if (!currentId) {
        this.article.contentCollectionId = null;
        this.contentCollection = null;
        return;
      }

      const matchedCollection = this.availableContentCollections.find(
        (collection) => collection.id === currentId,
      );

      this.article.contentCollectionId = currentId;
      this.contentCollection = matchedCollection
        ? { ...matchedCollection }
        : { id: currentId, title: currentId };
    },
    async loadContentCollections() {
      this.contentCollectionsLoading = true;
      try {
        const collections = await fetchContentCollections();
        this.availableContentCollections = collections.map((collection) =>
          toContentCollectionOption(collection),
        );
        this.syncCurrentContentCollection();
      } catch (error) {
        console.error("Failed to fetch content collections:", error);
        window.Alpine?.store("ui")?.showToast?.(
          "Не удалось загрузить content collections.",
          "error",
        );
      } finally {
        this.contentCollectionsLoading = false;
      }
    },
    assignSelectedContentCollection() {
      const collectionId = normalizeContentCollectionId(
        this.selectedContentCollectionId,
      );

      if (!collectionId) {
        window.Alpine?.store("ui")?.showToast?.(
          "Сначала выбери collection из списка.",
          "error",
        );
        return;
      }

      const selectedCollection = this.availableContentCollections.find(
        (collection) => collection.id === collectionId,
      );

      if (!selectedCollection) {
        window.Alpine?.store("ui")?.showToast?.(
          "Выбранная collection не найдена.",
          "error",
        );
        return;
      }

      this.article.contentCollectionId = selectedCollection.id;
      this.contentCollection = { ...selectedCollection };
      this.selectedContentCollectionId = "";
      this.useNewContentCollection = false;
      this.newContentCollectionTitle = "";
    },
    async createAndAssignContentCollection() {
      const title = this.newContentCollectionTitle.trim();

      if (!title) {
        window.Alpine?.store("ui")?.showToast?.(
          "Введи название новой collection.",
          "error",
        );
        return;
      }

      try {
        const createdCollection = await contentCollectionsApi.create({ title });
        const normalizedCollection =
          normalizeContentCollection(createdCollection);

        if (!normalizedCollection) {
          throw new Error("Не удалось нормализовать созданную collection.");
        }

        const option = toContentCollectionOption(normalizedCollection);
        const exists = this.availableContentCollections.some(
          (collection) => collection.id === option.id,
        );

        this.availableContentCollections = exists
          ? this.availableContentCollections.map((collection) =>
              collection.id === option.id ? option : collection,
            )
          : [...this.availableContentCollections, option].sort((left, right) =>
              left.title.localeCompare(right.title, "ru"),
            );

        this.article.contentCollectionId = option.id;
        this.contentCollection = option;
        this.selectedContentCollectionId = "";
        this.useNewContentCollection = false;
        this.newContentCollectionTitle = "";

        window.Alpine?.store("ui")?.showToast?.(
          "Новая collection создана и выбрана.",
        );
      } catch (error) {
        console.error("Failed to create content collection:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось создать новую collection.";
        window.Alpine?.store("ui")?.showToast?.(message, "error");
      }
    },
    removeContentCollection() {
      this.article.contentCollectionId = null;
      this.contentCollection = null;
      this.selectedContentCollectionId = "";
      this.useNewContentCollection = false;
      this.newContentCollectionTitle = "";
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
      return this.article?.relatedContent?.[type] ?? [];
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

      const normalized = sanitizeRelatedContent(this.article.relatedContent);
      const currentIds = normalized[type] ?? [];

      if (this.articleId && type === "article" && id === this.articleId) {
        window.Alpine?.store("ui")?.showToast?.(
          "Нельзя привязать текущий материал к самому себе.",
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
      this.article.relatedContent = normalized;
      this.selectedRelatedContentId = "";
    },
    removeRelatedContent(type, id) {
      const normalized = sanitizeRelatedContent(this.article.relatedContent);
      normalized[type] = normalized[type].filter((itemId) => itemId !== id);
      this.article.relatedContent = normalized;
    },
    init() {
      type PreviewState = {
        article?: unknown;
        articleId?: string | null;
        isEditMode?: boolean;
        editRouteBase?: string;
        createRoute?: string;
        createSuccessRedirect?: string | null;
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
          const stored = window.localStorage?.getItem("articlePreview");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === "object") {
              if (
                "article" in parsed ||
                "articleId" in parsed ||
                "isEditMode" in parsed
              ) {
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
        const isCreateDraft = !this.isEditMode && !previewId && !isPreviewEdit;
        return isSameEdit || isCreateDraft;
      })();

      if (shouldApplyPreview && previewState?.article) {
        const normalizedPreview = normalizeLoadedArticle(previewState.article);
        if (normalizedPreview) {
          if (this.isPreview) {
            this.article = normalizedPreview;
            if (
              typeof previewState.articleId === "string" &&
              previewState.articleId
            ) {
              this.articleId = previewState.articleId;
            }
            if (typeof previewState.isEditMode === "boolean") {
              this.isEditMode = previewState.isEditMode;
            }
          } else {
            Object.assign(this.article, normalizedPreview);
          }
        }
        if (
          typeof previewState.editRouteBase === "string" &&
          previewState.editRouteBase
        ) {
          this.editRouteBase = previewState.editRouteBase;
        }
        if (
          typeof previewState.createRoute === "string" &&
          previewState.createRoute
        ) {
          this.createRoute = previewState.createRoute;
        }
        if ("createSuccessRedirect" in previewState) {
          this.createSuccessRedirect =
            previewState.createSuccessRedirect ?? null;
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
      } else if (previewState) {
        try {
          window.localStorage?.removeItem("articlePreview");
        } catch (error) {
          console.warn("Failed to cleanup mismatched preview draft:", error);
        }
      }

      this.article.tags = this.article.tags ?? [];
      this.article.parisSubCategories = normalizeTags(
        this.article.parisSubCategories,
        "paris",
      );
      this.article.parisDistrict = normalizeParisDistrict(
        this.article.parisDistrict,
      );
      this.article.binaryForGuide = Boolean(this.article.binaryForGuide);
      this.article.tips = normalizeTips(this.article.tips);
      this.article.lead = this.article.lead ?? "";
      this.article.cardLead = this.article.cardLead ?? "";
      this.article.heroOrientation = this.article.heroOrientation === "image-left" ? "image-left" : "image-right";
      this.article.articleType =
        this.article.articleType ?? articleType ?? "standard";
      this.article.isHotContent = Boolean(this.article.isHotContent);
      this.article.isNotebookContent = Boolean(this.article.isNotebookContent);
      this.article.isMaagChoice = Boolean(this.article.isMaagChoice);
      this.article.isMainInCategory = Boolean(this.article.isMainInCategory);
      this.article.relatedContent = sanitizeRelatedContent(
        this.article.relatedContent,
        "article",
        this.articleId,
      );
      this.article.contentCollectionId = normalizeContentCollectionId(
        this.article.contentCollectionId,
      );
      this.article.contentBlocks = Array.isArray(this.article.contentBlocks)
        ? normalizeContentBlocks(this.article.contentBlocks)
        : [];
      if (!restoredPreviewAuthorState) {
        this.selectedAuthorId =
          typeof this.article.authorId === "string" ? this.article.authorId : "";
      }
      this.ensureSelectedAuthorPresent();
      this.syncCurrentContentCollection();

      this.fetchContentLists();
      this.loadContentCollections();
      this.loadAuthors();
      this.loadLandingPlacements();
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
              } else if (
                ["two-columns", "three-columns"].includes(
                  this.editingBlock.type,
                ) &&
                column
              ) {
                this.editingBlock[column].content = downloadURL;
                this.editingBlock[column].type = "image"; // Ensure type is image
              } else if (
                ["one-big-one-small", "collage"].includes(
                  this.editingBlock.type,
                ) &&
                imageField
              ) {
                this.editingBlock[imageField] = downloadURL;
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

      const storageRef = ref(storage, `articles/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          this.uploading = true;
          this.uploadProgress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          console.error("Upload failed:", error);
          window.Alpine.store("ui").showToast(
            `Проблема загрузки видео: ${error.message}`,
            "error",
          );
          this.uploading = false;
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            if (
              blockIndex !== null &&
              this.editingBlock &&
              this.editingBlock.type === "video"
            ) {
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
            if (this.editingBlock?.slides?.[slideIndex] !== undefined) {
              this.editingBlock.slides[slideIndex].imageUrl = downloadURL;
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
          newBlockData = { text: "", html: "" };
          break;
        case "h2":
        case "h3":
        case "quote":
          newBlockData = { text: "", quoteAuthor: "" };
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
            left: { type: "text", content: "", html: "", caption: "", quoteAuthor: "" },
            right: { type: "text", content: "", html: "", caption: "", quoteAuthor: "" },
          };
          break;
        case "three-columns":
          newBlockData = {
            left: { type: "text", content: "", html: "", caption: "", quoteAuthor: "" },
            center: { type: "text", content: "", html: "", caption: "", quoteAuthor: "" },
            right: { type: "text", content: "", html: "", caption: "", quoteAuthor: "" },
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
        case "collage":
          newBlockData = {
            leftPortraitImageUrl: "",
            leftPortraitImageCaption: "",
            topLandscapeImageUrl: "",
            topLandscapeImageCaption: "",
            mainLandscapeImageUrl: "",
            mainLandscapeImageCaption: "",
            rightPortraitImageUrl: "",
            rightPortraitImageCaption: "",
          };
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
      if (this.editingBlock?.type === "video") {
        this.editingBlock = normalizeVideoBlock(this.editingBlock);
      }
    },

    // Saves the changes to the block
    updateBlock() {
      if (this.editingIndex !== null) {
        if (this.editingBlock?.type === "video") {
          this.editingBlock = normalizeVideoBlock(this.editingBlock);
          if (!this.validateVideoBlock(this.editingBlock)) {
            return;
          }
        }
        this.article.contentBlocks[this.editingIndex] = this.editingBlock;
        this.syncContentBlockOrder();
        this.cancelEdit();
      }
    },

    // Cancels the editing of a block
    cancelEdit() {
      this.editingIndex = null;
      this.editingBlock = null;
    },

    prepareBlocksForAction() {
      if (this.uploading) {
        window.Alpine.store("ui").showToast(
          "Подожди — загрузка файла ещё не завершилась.",
          "error",
        );
        return false;
      }

      if (this.editingIndex !== null) {
        this.updateBlock();
        if (this.editingIndex !== null) return false;
      }

      return true;
    },

    startBlockDrag(index) {
      if (this.editingIndex !== null || this.uploading) {
        return;
      }
      const block = this.article.contentBlocks[index];
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
      const block = this.article.contentBlocks[index];
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

      const fromIndex = this.article.contentBlocks.findIndex(
        (block) => block?.id === this.draggedBlockId,
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

    // Deletes a block
    deleteBlock(index) {
      const removeBlock = () => {
        this.article.contentBlocks.splice(index, 1);
        this.syncContentBlockOrder();
      };

      const uiStore = window.Alpine?.store?.("ui");
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation(
          "Ты точно хочешь удалить этот блок?",
          removeBlock,
        );
      } else {
        console.warn("UI store недоступен, удаляем блок без подтверждения");
        removeBlock();
      }
    },

    // For Preview Page
    returnToEdit() {
      const target =
        this.isEditMode && this.articleId
          ? `${this.editRouteBase}/${this.articleId}/edit`
          : this.createRoute;
      window.location.href = target;
    },

    // --- Preview and Save methods ---
    previewArticle() {
      if (!this.prepareBlocksForAction()) return;

      const authorDisplay = this.getSelectedAuthorDisplay();
      const previewState = {
        article: this.article,
        articleId: this.articleId,
        isEditMode: this.isEditMode,
        editRouteBase: this.editRouteBase,
        createRoute: this.createRoute,
        createSuccessRedirect: this.createSuccessRedirect,
        selectedAuthorId: this.selectedAuthorId,
        useNewAuthor: this.useNewAuthor,
        newAuthorFirstName: this.newAuthorFirstName,
        newAuthorLastName: this.newAuthorLastName,
        authorDisplay,
      };
      localStorage.setItem("articlePreview", JSON.stringify(previewState));
      window.location.href = "/dashboard/article/preview";
    },

    async saveArticle() {
      if (!this.prepareBlocksForAction()) return;

      // Guard against double-submit
      if (this.isSaving) return;
      this.isSaving = true;

      const normalizedCategory = normalizeCategory(this.article.category) || "";
      const isHotContentFlag =
        Boolean(this.article.isHotContent) ||
        normalizedCategory === "hotContent";
      this.article.isHotContent = isHotContentFlag;
      this.article.category =
        isHotContentFlag && normalizedCategory === "hotContent"
          ? ""
          : normalizedCategory;
      this.article.contentBlocks = reindexContentBlocks(
        this.article.contentBlocks,
      );
      this.article.tags = normalizeTags(
        this.article.tags,
        this.article.category,
      );
      this.article.parisSubCategories = normalizeTags(
        this.article.parisSubCategories,
        "paris",
      );
      this.article.parisDistrict = normalizeParisDistrict(
        this.article.parisDistrict,
      );
      this.article.tips = normalizeTips(this.article.tips);

      const hasInvalidVideoBlock = this.article.contentBlocks.some(
        (block) => !this.validateVideoBlock(block),
      );
      if (hasInvalidVideoBlock) {
        this.isSaving = false;
        return;
      }

      if (!this.article.category && !this.article.isHotContent) {
        window.Alpine.store("ui").showToast(
          "Выбери категорию перед сохранением — это обязательное поле.",
          "error",
        );
        this.isSaving = false;
        return;
      }

      const selectedCategoryTags = this.getSelectedCategoryTags();
      if (
        !Array.isArray(selectedCategoryTags) ||
        selectedCategoryTags.length === 0
      ) {
        window.Alpine.store("ui").showToast(
          "Добавь хотя бы один тег — без него статья не сохранится.",
          "error",
        );
        this.isSaving = false;
        return;
      }

      if (!this.article.imageUrl) {
        window.Alpine.store("ui").showToast(
          "Загрузи оболожку статьи - обязательно!!!",
          "error",
        );
        this.isSaving = false;
        return;
      }

      try {
        const resolvedAuthorId = await this.resolveAuthorId();
        const tagsForDb = selectedCategoryTags.map((tag) =>
          this.getTagLabel(tag),
        );
        const isParisCategory = this.isParisCategory();
        const payload = {
          title: this.article.title,
          lead: this.article.lead,
          cardLead: this.article.cardLead,
          articleType: this.article.articleType || articleType || "standard",
          imageUrl: this.article.imageUrl,
          imageCaption: this.article.imageCaption,
          heroOrientation: this.article.heroOrientation === "image-left" ? "image-left" : "image-right",
          authorId: resolvedAuthorId,
          content: this.article.contentBlocks,
          category: this.article.category,
          tags: tagsForDb,
          parisSubCategories: isParisCategory
            ? this.article.parisSubCategories
            : [],
          parisDistrict: isParisCategory
            ? this.article.parisDistrict || null
            : null,
          binaryForGuide: false,
          tips: this.article.tips,
          isHotContent: this.article.isHotContent,
          isNotebookContent: Boolean(this.article.isNotebookContent),
          isMaagChoice: Boolean(this.article.isMaagChoice),
          isMainInCategory: this.article.isMainInCategory,
          paid: this.article.paid,
          published: Boolean(this.article.published),
          contentCollectionId: normalizeContentCollectionId(
            this.article.contentCollectionId,
          ),
          relatedContent: sanitizeRelatedContent(
            this.article.relatedContent,
            "article",
            this.articleId,
          ),
        };

        if (this.isEditMode && this.articleId) {
          await articlesApi.update(this.articleId, payload);
          localStorage.removeItem("articlePreview");
          window.Alpine.store("ui").showToast("Статья успешно обновлена!");
          const redirectTo = this.onSaveRedirect || `/dashboard`;
          setTimeout(() => {
            globalThis.location.href = redirectTo;
          }, 1500);
        } else {
          const result = await articlesApi.create(payload);
          localStorage.removeItem("articlePreview");
          window.Alpine.store("ui").showToast(
            "Статья успешно создана! Молодец!",
          );
          const redirectTo = this.createSuccessRedirect || `/dashboard`;
          setTimeout(() => {
            globalThis.location.href = redirectTo;
          }, 1500);
        }
      } catch (error) {
        console.error("Проблемка сохранения:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Во время сохранения статьи возникла ошибочка.";
        window.Alpine.store("ui").showToast(message, "error");
        this.isSaving = false;
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
            window.location.href = redirectUrl || "/dashboard";
          }, 1500);
        } catch (error) {
          console.error(error);
          window.Alpine.store("ui").showToast(
            "Не удалось удалить статью.",
            "error",
          );
        }
      };

      const uiStore = window.Alpine?.store?.("ui");
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation(
          `Удалить статью «${this.article.title}»? Это действие необратимо.`,
          performDelete,
        );
      } else {
        if (confirm("Вы уверены, что хотите удалить эту статью?")) {
          performDelete();
        }
      }
    },
  };
}
