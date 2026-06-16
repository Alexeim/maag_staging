import { photosOfTheDayApi, authorsApi } from "@/lib/api/api";
import { app } from "@/lib/firebase/client";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { compressImage } from "@/lib/images/compressImage";
import type { UiStore } from "@/stores/uiStore";

declare const Alpine: any;

const storage = getStorage(app);

export default function photoOfTheDayCreatorLogic(initialState: Record<string, unknown> = {}) {
  const {
    initialPhoto = null,
    photoId = null,
    isEditMode = false,
    onSaveRedirect = null,
    isPreview = false,
  } = initialState as {
    initialPhoto?: any;
    photoId?: string | null;
    isEditMode?: boolean;
    onSaveRedirect?: string | null;
    isPreview?: boolean;
  };

  let previewState: any = null;
  if (typeof window !== "undefined" && isPreview) {
    try {
      const stored = window.localStorage?.getItem("photoOfTheDayPreview");
      previewState = stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Failed to parse photo preview draft:", error);
    }
  }

  const photoDraft = isPreview && previewState?.photo ? previewState.photo : initialPhoto;

  return {
    photo: {
      title: (photoDraft?.title as string) || "",
      imageUrl: (photoDraft?.imageUrl as string) || "",
      caption: (photoDraft?.caption as string) || "",
      published: Boolean(photoDraft?.published),
      publishedAt: photoDraft?.publishedAt || null,
    },
    photoId: (isPreview ? previewState?.photoId : photoId) as string | null,
    isEditMode: (isPreview ? Boolean(previewState?.isEditMode) : isEditMode) as boolean,
    isPreview: isPreview as boolean,
    onSaveRedirect: onSaveRedirect as string | null,

    authors: [] as any[],
    authorsLoading: false,
    selectedAuthorId:
      (isPreview ? previewState?.selectedAuthorId : photoDraft?.authorId) || "",

    uploading: false,
    uploadProgress: 0,
    isSaving: false,

    getUiStore(): UiStore | null {
      return Alpine.store("ui");
    },

    notify(message: string, type: "success" | "error" = "success") {
      const store = this.getUiStore();
      if (store?.showToast) {
        store.showToast(message, type);
      } else {
        window.alert(message);
      }
    },

    getAuthorLabel(author: any) {
      if (!author) return "";
      return `${author.firstName || ""} ${author.lastName || ""}`.trim();
    },

    async init() {
      await this.loadAuthors();
    },

    returnToEdit() {
      window.location.href =
        this.isEditMode && this.photoId
          ? `/dashboard/photo-of-the-day/${this.photoId}/edit`
          : "/dashboard/photo-of-the-day/create";
    },

    previewPhoto() {
      const previewState = {
        photo: this.photo,
        photoId: this.photoId,
        isEditMode: this.isEditMode,
        selectedAuthorId: this.selectedAuthorId,
      };
      localStorage.setItem("photoOfTheDayPreview", JSON.stringify(previewState));
      window.location.href = "/dashboard/photo-of-the-day/preview";
    },

    async loadAuthors() {
      this.authorsLoading = true;
      try {
        this.authors = await authorsApi.list();
        if (!this.selectedAuthorId && this.authors.length > 0) {
          this.selectedAuthorId = this.authors[0].id;
        }
      } catch (e) {
        console.error("Failed to load authors", e);
      } finally {
        this.authorsLoading = false;
      }
    },

    async handleImageUpload(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      this.uploading = true;
      this.uploadProgress = 0;

      try {
        const compressed = await compressImage(file);
        const storageRef = ref(storage, `photos-of-the-day/${Date.now()}-${file.name}`);
        const task = uploadBytesResumable(storageRef, compressed);

        await new Promise<void>((resolve, reject) => {
          task.on(
            "state_changed",
            (snap) => {
              this.uploadProgress = (snap.bytesTransferred / snap.totalBytes) * 100;
            },
            reject,
            async () => {
              this.photo.imageUrl = await getDownloadURL(task.snapshot.ref);
              resolve();
            },
          );
        });
      } catch (e) {
        console.error("Image upload failed", e);
        this.notify("Ошибка загрузки изображения", "error");
      } finally {
        this.uploading = false;
      }
    },

    async savePhoto() {
      if (!this.photo.title.trim()) {
        this.notify("Введи заголовок", "error");
        return;
      }
      if (!this.photo.imageUrl) {
        this.notify("Загрузи изображение", "error");
        return;
      }
      if (!this.selectedAuthorId) {
        this.notify("Выбери автора", "error");
        return;
      }

      this.isSaving = true;
      try {
        const payload = {
          title: this.photo.title.trim(),
          imageUrl: this.photo.imageUrl,
          caption: this.photo.caption.trim(),
          authorId: this.selectedAuthorId,
          published: Boolean(this.photo.published),
        };

        if (this.isEditMode && this.photoId) {
          await photosOfTheDayApi.update(this.photoId, payload);
          this.notify("Фото дня обновлено");
        } else {
          await photosOfTheDayApi.create(payload);
          this.notify("Фото дня создано");
        }

        setTimeout(() => {
          window.location.href = this.onSaveRedirect || "/dashboard/photo-of-the-day";
        }, 1000);
      } catch (e) {
        console.error("Save failed", e);
        this.notify("Не удалось сохранить. Попробуй ещё раз.", "error");
      } finally {
        this.isSaving = false;
      }
    },

    async deletePhoto() {
      if (!this.photoId) return;
      const uiStore = this.getUiStore();
      const doDelete = async () => {
        try {
          await photosOfTheDayApi.delete(this.photoId!);
          this.notify("Фото дня удалено");
          setTimeout(() => {
            window.location.href = "/dashboard/photo-of-the-day";
          }, 1000);
        } catch (e) {
          console.error("Delete failed", e);
          this.notify("Не удалось удалить. Попробуй ещё раз.", "error");
        }
      };

      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation("Удалить фото дня? Это действие необратимо.", doDelete);
      } else {
        await doDelete();
      }
    },
  };
}
