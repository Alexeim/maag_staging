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

const NO_BG_AVATAR_WIDTH = 239;
const NO_BG_AVATAR_HEIGHT = 278;

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не удалось прочитать изображение."));
    };
    img.src = url;
  });
}

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
    noBgAvatar: initialState.initialAuthor?.noBgAvatar ?? "",
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
  uploadingNoBgAvatar: false,
  noBgAvatarUploadProgress: 0,
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

  async handleNoBgAvatarUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.type !== "image/png") {
      (window as any).Alpine.store("ui").showToast(
        "Нужен файл в формате PNG (с прозрачным фоном).",
        "error",
      );
      input.value = "";
      return;
    }

    const { width, height } = await readImageSize(file);
    if (width !== NO_BG_AVATAR_WIDTH || height !== NO_BG_AVATAR_HEIGHT) {
      (window as any).Alpine.store("ui").showToast(
        `Нужен PNG ровно ${NO_BG_AVATAR_WIDTH}×${NO_BG_AVATAR_HEIGHT}px, а этот — ${width}×${height}px.`,
        "error",
      );
      input.value = "";
      return;
    }

    this.uploadingNoBgAvatar = true;
    this.noBgAvatarUploadProgress = 0;

    // Uploaded as-is (no compressImage): that pipeline re-encodes to lossy
    // WebP, which smears the cutout's alpha edges and drops the .png name.
    const storageRef = ref(
      storage,
      `authorsAvatars/noBackground/${Date.now()}-${file.name}`,
    );
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        this.noBgAvatarUploadProgress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      },
      (error) => {
        console.error("Upload failed:", error);
        (window as any).Alpine.store("ui").showToast(
          `Проблема загрузки портрета: ${error.message}`,
          "error",
        );
        this.uploadingNoBgAvatar = false;
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          this.author.noBgAvatar = downloadURL;
          this.uploadingNoBgAvatar = false;
          (window as any).Alpine.store("ui").showToast(
            "Портрет для «от первого лица» загружен!",
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
      noBgAvatar: this.author.noBgAvatar,
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
