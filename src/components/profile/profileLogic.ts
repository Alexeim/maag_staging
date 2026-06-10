import { usersApi } from "@/lib/api/api";
import { auth } from "@/lib/firebase/client";
import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import type { UiStore } from "@/stores/uiStore";
import type { AuthStore } from "@/stores/authStore";
import type { UserBookmark } from "@/lib/api/api";

declare const Alpine: any;

const BOOKMARK_TYPE_LABELS: Record<string, string> = {
  article: "Статьи",
  news: "Новости",
  guide: "Гиды",
  event: "События",
  tips: "Подборки",
  interview: "Интервью",
  flipper: "Листалки",
  photoOfTheDay: "Фото дня",
  visualStory: "Визуальные истории",
};

const BOOKMARK_TYPE_ORDER = [
  "article",
  "news",
  "guide",
  "event",
  "tips",
  "interview",
  "flipper",
  "photoOfTheDay",
  "visualStory",
];

export default () => ({
  form: {
    firstName: "",
    lastName: "",
  },
  bookmarks: [] as UserBookmark[],
  bookmarksLoading: false,
  loadedBookmarksForUid: "",
  bookmarkGroups: [] as Array<{
    contentType: string;
    label: string;
    items: UserBookmark[];
  }>,

  init() {
    // Use Alpine.effect to reactively update the form.
    // It runs once on init and then again whenever authStore.profile changes.
    // This solves the race condition where the component initializes
    // before the user's profile data has been fetched from the server.
    Alpine.effect(() => {
      const authStore = Alpine.store('auth') as AuthStore;
      if (authStore.profile) {
        console.log('Alpine.effect triggered, profile data is now available:', authStore.profile);
        this.form.firstName = authStore.profile.firstName || '';
        this.form.lastName = authStore.profile.lastName || '';
        this.bookmarks = authStore.profile.bookmarks ?? [];
        this.syncBookmarkGroups();
        this.refreshBookmarks();
      } else {
        this.bookmarks = [];
        this.bookmarkGroups = [];
        this.loadedBookmarksForUid = "";
      }
    });
  },

  async refreshBookmarks() {
    const authStore = Alpine.store('auth') as AuthStore;
    const currentUser = auth.currentUser;

    if (!authStore.isLoggedIn || !currentUser) {
      return;
    }

    if (this.bookmarksLoading || this.loadedBookmarksForUid === currentUser.uid) {
      return;
    }

    this.bookmarksLoading = true;

    try {
      const token = await currentUser.getIdToken();
      const bookmarks = await usersApi.getBookmarks(currentUser.uid, token);
      this.loadedBookmarksForUid = currentUser.uid;
      this.bookmarks = bookmarks;
      this.syncBookmarkGroups();
      authStore.setBookmarks(bookmarks);
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
    } finally {
      this.bookmarksLoading = false;
    }
  },

  syncBookmarkGroups() {
    const groups = new Map<string, UserBookmark[]>();

    this.bookmarks.forEach((bookmark) => {
      const currentItems = groups.get(bookmark.contentType) ?? [];
      currentItems.push(bookmark);
      groups.set(bookmark.contentType, currentItems);
    });

    this.bookmarkGroups = Array.from(groups.entries())
      .sort(([leftType], [rightType]) => {
        const leftIndex = BOOKMARK_TYPE_ORDER.indexOf(leftType);
        const rightIndex = BOOKMARK_TYPE_ORDER.indexOf(rightType);
        const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
        const normalizedRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

        if (normalizedLeftIndex !== normalizedRightIndex) {
          return normalizedLeftIndex - normalizedRightIndex;
        }

        return leftType.localeCompare(rightType);
      })
      .map(([contentType, items]) => ({
        contentType,
        label: BOOKMARK_TYPE_LABELS[contentType] ?? contentType,
        items,
      }));
  },

  async saveChanges() {
    const authStore = Alpine.store('auth') as AuthStore;
    const uiStore = Alpine.store('ui') as UiStore;
    
    const currentUser = auth.currentUser;

    if (!currentUser) {
      uiStore?.showToast?.("Вы не авторизованы.", "error");
      return;
    }

    try {
      const token = await currentUser.getIdToken(true);

      const [updatedProfile] = await Promise.all([
        usersApi.update(currentUser.uid, this.form, token),
        updateProfile(currentUser, {
          displayName: `${this.form.firstName} ${this.form.lastName}`.trim(),
        }),
      ]);

      authStore.setUser(authStore.user, updatedProfile);

      uiStore?.showToast?.("Изменения успешно сохранены!");

    } catch (error) {
      console.error("Failed to save profile:", error);
      uiStore?.showToast?.("Не удалось сохранить изменения.", "error");
    }
  },

  async changePassword() {
    const uiStore = Alpine.store('ui') as UiStore;
    const email = auth.currentUser?.email;

    if (!email) {
      uiStore?.showToast?.("Не удалось определить email.", "error");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      uiStore?.showToast?.("Письмо со ссылкой отправлено на " + email);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      uiStore?.showToast?.("Не удалось отправить письмо.", "error");
    }
  },

  async removeBookmark(bookmark: UserBookmark) {
    const authStore = Alpine.store('auth') as AuthStore;
    const uiStore = Alpine.store('ui') as UiStore;
    const currentUser = auth.currentUser;

    if (!currentUser) {
      uiStore?.showToast?.("Вы не авторизованы.", "error");
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      const bookmarks = await usersApi.removeBookmark(
        currentUser.uid,
        bookmark.contentType,
        bookmark.id,
        token,
      );

      authStore.setBookmarks(bookmarks);
      this.bookmarks = bookmarks;
      this.syncBookmarkGroups();
      uiStore?.showToast?.("Материал удалён из закладок");
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
      uiStore?.showToast?.("Не удалось удалить закладку.", "error");
    }
  },

  deleteAccount() {
    const uiStore = Alpine.store('ui') as UiStore;
    
    const performDelete = () => {
      console.log("Deleting account");
      // Add actual deletion logic here, e.g., call an API endpoint
      uiStore?.showToast?.("Аккаунт удалён (демо)");
    };

    const message = "Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.";
    
    if (uiStore?.showConfirmation) {
      uiStore.showConfirmation(message, performDelete);
    } else {
      // Fallback for safety
      if (confirm(message)) {
        performDelete();
      }
    }
  },
});
