import { contentCollectionsApi } from "@/lib/api/api";
import {
  fetchContentCollections,
  normalizeContentCollection,
  normalizeContentCollectionId,
  toContentCollectionOption,
} from "@/lib/utils/contentCollections";

const getEntity = (context: Record<string, any>, entityKey: string) => {
  const entity = context?.[entityKey];
  return entity && typeof entity === "object" ? entity : null;
};

export const createContentCollectionEditorState = (entityKey: string) => ({
  contentCollectionsLoading: false,
  availableContentCollections: [] as Array<{ id: string; title: string }>,
  contentCollection: null as { id: string; title: string } | null,
  selectedContentCollectionId: "",
  useNewContentCollection: false,
  newContentCollectionTitle: "",
  syncCurrentContentCollection() {
    const entity = getEntity(this, entityKey);
    if (!entity) {
      this.contentCollection = null;
      return;
    }

    const currentId = normalizeContentCollectionId(entity.contentCollectionId);

    if (!currentId) {
      entity.contentCollectionId = null;
      this.contentCollection = null;
      this.selectedContentCollectionId = "";
      return;
    }

    const matchedCollection = this.availableContentCollections.find(
      (collection) => collection.id === currentId,
    );

    entity.contentCollectionId = currentId;
    this.selectedContentCollectionId = currentId;
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
    const entity = getEntity(this, entityKey);
    if (!entity) {
      return;
    }

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

    entity.contentCollectionId = selectedCollection.id;
    this.contentCollection = { ...selectedCollection };
    this.selectedContentCollectionId = selectedCollection.id;
    this.useNewContentCollection = false;
    this.newContentCollectionTitle = "";
  },
  async createAndAssignContentCollection() {
    const entity = getEntity(this, entityKey);
    if (!entity) {
      return;
    }

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
      const normalizedCollection = normalizeContentCollection(createdCollection);

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

      entity.contentCollectionId = option.id;
      this.selectedContentCollectionId = option.id;
      this.contentCollection = option;
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
    const entity = getEntity(this, entityKey);
    if (!entity) {
      return;
    }

    entity.contentCollectionId = null;
    this.contentCollection = null;
    this.selectedContentCollectionId = "";
    this.useNewContentCollection = false;
    this.newContentCollectionTitle = "";
  },
});
