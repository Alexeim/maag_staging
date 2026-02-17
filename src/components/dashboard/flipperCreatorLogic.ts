import { flippersApi, authorsApi } from "@/lib/api/api";
import { app } from "../../lib/firebase/client";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

const storage = getStorage(app);

const slugifyTag = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export default function flipperCreatorLogic(initialState = {}) {
  const {
    initialFlipper = null,
    flipperId = null,
    isEditMode = false,
    onSaveRedirect = null,
    categoryTags = {},
  } = initialState as {
    initialFlipper?: any;
    flipperId?: string | null;
    isEditMode?: boolean;
    onSaveRedirect?: string | null;
    categoryTags?: Record<string, Array<{ title: string; value: string }>>;
  };

  const buildLegacyTagMap = (category?: string) => {
    if (!category) return {};
    const tags = categoryTags[category];
    if (!tags) return {};
    return Object.fromEntries(tags.map((tag) => [tag.title, tag.value]));
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

  return {
    flipper: {
      title: "",
      category: "",
      tags: [],
      techTags: [],
      carouselContent: [{ imageUrl: "", caption: "" }],
    },
    uploading: false,
    uploadProgress: 0,
    uploadingIndex: -1,
    flipperId,
    isEditMode,
    onSaveRedirect,
    categoryTags,
    newTagInput: "",
    authorsLoading: false,
    authors: [],
    selectedAuthorId: "",
    useNewAuthor: false,
    newAuthorFirstName: "",
    newAuthorLastName: "",

    init() {
      if (initialFlipper) {
        const flipperCopy = JSON.parse(JSON.stringify(initialFlipper));
        flipperCopy.tags = normalizeTags(flipperCopy.tags, flipperCopy.category);
        flipperCopy.techTags = normalizeTechTags(flipperCopy.techTags);
        this.flipper = { ...this.flipper, ...flipperCopy };
        if (!this.flipper.carouselContent || this.flipper.carouselContent.length === 0) {
          this.flipper.carouselContent = [{ imageUrl: "", caption: "" }];
        }
      }
      this.selectedAuthorId =
        typeof this.flipper.authorId === "string" ? this.flipper.authorId : "";
      this.ensureSelectedAuthorPresent();
      this.loadAuthors();
    },

    getAvailableTags() {
      if (!this.flipper?.category) return [];
      return this.categoryTags[this.flipper.category] || [];
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
      return this.flipper.tags.includes(value);
    },
    toggleTag(value: string) {
      const normalized = normalizeTags([value], this.flipper.category)[0] || value;
      const idx = this.flipper.tags.indexOf(normalized);
      if (idx >= 0) {
        this.flipper.tags.splice(idx, 1);
      } else {
        this.flipper.tags.push(normalized);
      }
      this.flipper.tags = normalizeTags(this.flipper.tags, this.flipper.category);
    },
    removeTag(value: string) {
      const idx = this.flipper.tags.indexOf(value);
      if (idx >= 0) {
        this.flipper.tags.splice(idx, 1);
      }
    },
    addCustomTag() {
      const slug = slugifyTag(this.newTagInput);
      if (!slug) {
        window.Alpine?.store("ui")?.showToast?.("Введи тег латиницей.", "error");
        return;
      }
      if (this.flipper.techTags.includes(slug)) {
        window.Alpine?.store("ui")?.showToast?.("Такой техтег уже есть.", "info");
        this.newTagInput = "";
        return;
      }
      this.flipper.techTags.push(slug);
      this.flipper.techTags = normalizeTechTags(this.flipper.techTags);
      this.newTagInput = "";
    },
    removeTechTag(value: string) {
      const idx = this.flipper.techTags.indexOf(value);
      if (idx >= 0) {
        this.flipper.techTags.splice(idx, 1);
      }
    },
    handleCategoryChange(value: string) {
      this.flipper.category = value;
      this.flipper.tags = normalizeTags(this.flipper.tags, value);
      this.flipper.techTags = normalizeTechTags(this.flipper.techTags);
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

    addCarouselItem() {
      this.flipper.carouselContent.push({ imageUrl: "", caption: "" });
    },
    removeCarouselItem(index: number) {
      this.flipper.carouselContent.splice(index, 1);
    },
    handleImageUpload(event, index) {
      const file = event.target.files[0];
      if (!file) return;
      this.uploading = true;
      this.uploadingIndex = index;
      this.uploadProgress = 0;
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
          this.flipper.carouselContent[index].imageUrl = downloadURL;
          window.Alpine.store("ui").showToast("Изображение успешно загружено!");
          this.uploading = false;
          this.uploadingIndex = -1;
        });
      });
    },

    async saveFlipper() {
      if (!this.flipper.title) {
        window.Alpine.store("ui").showToast("Заголовок обязателен.", "error");
        return;
      }
      if (this.flipper.carouselContent.some(item => !item.imageUrl)) {
        window.Alpine.store("ui").showToast("Для каждого слайда нужно загрузить изображение.", "error");
        return;
      }

      try {
        const resolvedAuthorId = await this.resolveAuthorId();
        const tagsForDb = this.flipper.tags.map((tag) => this.getTagLabel(tag));
        const payload = {
          ...this.flipper,
          authorId: resolvedAuthorId,
          tags: tagsForDb,
          techTags: normalizeTechTags(this.flipper.techTags),
        };

        if (this.isEditMode && this.flipperId) {
          await flippersApi.update(this.flipperId, payload);
          window.Alpine.store("ui").showToast("Листалка успешно обновлена!");
          if (this.onSaveRedirect) {
            window.location.href = this.onSaveRedirect;
          }
        } else {
          await flippersApi.create(payload);
          window.Alpine.store("ui").showToast("Листалка успешно создана!");
          window.location.href = `/dashboard/flippers`;
        }
      } catch (error) {
        console.error("Ошибка сохранения листалки:", error);
        const message = error instanceof Error ? error.message : "Произошла неизвестная ошибка.";
        window.Alpine.store("ui").showToast(message, "error");
      }
    },
  };
}
