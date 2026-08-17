import { authorsApi, type AuthorResponse } from "@/lib/api/api";
import { app } from "../../lib/firebase/client";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { compressImage } from "@/lib/images/compressImage";

const storage = getStorage(app);

interface AuthorCreatorInitialState {
  initialAuthor?: AuthorResponse | null;
  authorId?: string | null;
  isEditMode?: boolean;
}

export default (initialState: AuthorCreatorInitialState) => ({
  author: {
    firstName: initialState.initialAuthor?.firstName ?? "",
    lastName: initialState.initialAuthor?.lastName ?? "",
    avatar: initialState.initialAuthor?.avatar ?? "",
    bio: initialState.initialAuthor?.bio ?? "",
    socialLinks: {
      instagram: initialState.initialAuthor?.socialLinks?.instagram ?? "",
      linkedin: initialState.initialAuthor?.socialLinks?.linkedin ?? "",
      facebook: initialState.initialAuthor?.socialLinks?.facebook ?? "",
      telegram: initialState.initialAuthor?.socialLinks?.telegram ?? "",
      site: initialState.initialAuthor?.socialLinks?.site ?? "",
    },
  },
  authorId: initialState.authorId ?? null,
  authorRole: initialState.initialAuthor?.role ?? "",
  isEditMode: Boolean(initialState.isEditMode),
  uploading: false,
  uploadProgress: 0,
  isSaving: false,

  async handleAvatarUpload(event: Event) {
    const raw = (event.target as HTMLInputElement).files?.[0];
    if (!raw) return;

    this.uploading = true;
    this.uploadProgress = 0;

    const file = await compressImage(raw);
    const storageRef = ref(
      storage,
      `authorsAvatars/${Date.now()}-${file.name}`,
    );
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        this.uploadProgress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      },
      (error) => {
        console.error("Upload failed:", error);
        (window as any).Alpine.store("ui").showToast(
          `Проблема загрузки аватара: ${error.message}`,
          "error",
        );
        this.uploading = false;
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          this.author.avatar = downloadURL;
          this.uploading = false;
          (window as any).Alpine.store("ui").showToast(
            "Аватар успешно загружен!",
          );
        });
      },
    );
  },

  async saveAuthor() {
    const firstName = this.author.firstName.trim();
    const lastName = this.author.lastName.trim();

    if (!firstName || !lastName) {
      (window as any).Alpine.store("ui").showToast(
        "Укажи имя и фамилию автора.",
        "error",
      );
      return;
    }

    this.isSaving = true;

    const payload = {
      firstName,
      lastName,
      avatar: this.author.avatar,
      bio: this.author.bio.trim(),
      socialLinks: this.author.socialLinks,
    };

    try {
      if (this.isEditMode && this.authorId) {
        await authorsApi.update(this.authorId, payload);
      } else {
        const created = await authorsApi.create(payload);
        this.authorId = created.id;
      }
      (window as any).Alpine.store("ui").showToast("Автор сохранён!");
      setTimeout(() => {
        window.location.href = "/dashboard/authors";
      }, 1500);
    } catch (error) {
      console.error("Failed to save author", error);
      (window as any).Alpine.store("ui").showToast(
        "Не удалось сохранить автора. Попробуй ещё раз.",
        "error",
      );
    } finally {
      this.isSaving = false;
    }
  },

  deleteAuthor(redirectUrl: string) {
    if (!this.authorId) return;

    const performDelete = async () => {
      try {
        await authorsApi.delete(this.authorId!);
        (window as any).Alpine.store("ui").showToast("Автор удалён");
        setTimeout(() => {
          window.location.href = redirectUrl || "/dashboard/authors";
        }, 1500);
      } catch (error) {
        console.error(error);
        (window as any).Alpine.store("ui").showToast(
          "Не удалось удалить автора.",
          "error",
        );
      }
    };

    const authorName = `${this.author.firstName} ${this.author.lastName}`.trim();
    const uiStore = (window as any).Alpine?.store?.("ui");
    if (uiStore?.showConfirmation) {
      uiStore.showConfirmation(
        `Удалить автора «${authorName}»? Это необратимо.`,
        performDelete,
      );
    } else {
      if (confirm("Удалить автора?")) performDelete();
    }
  },
});
