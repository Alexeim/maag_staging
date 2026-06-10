import { usersApi, type UserBookmark, type BookmarkContentType } from "@/lib/api/api";
import { auth } from "@/lib/firebase/client";
import type { AuthStore } from "@/stores/authStore";
import type { UiStore } from "@/stores/uiStore";

declare const Alpine: any;

interface ContentActionsState {
  contentType: BookmarkContentType;
  id: string;
  title: string;
  href: string;
  category?: string;
  tag?: string;
  imageUrl?: string;
}

const toAbsoluteUrl = (href: string) => new URL(href, window.location.origin).toString();

export default (initialState: ContentActionsState) => ({
  contentType: initialState.contentType,
  id: initialState.id,
  title: initialState.title,
  href: initialState.href,
  category: initialState.category,
  tag: initialState.tag,
  imageUrl: initialState.imageUrl,
  isSharing: false,
  isBookmarking: false,
  isBookmarked: false,
  bookmarkLabel: "В закладки",
  shareLabel: "Поделиться",

  init() {
    this.syncBookmarkState();
    this.syncLabels();

    Alpine.effect(() => {
      const authStore = Alpine.store("auth") as AuthStore;
      authStore.profile?.bookmarks;
      this.syncBookmarkState();
      this.syncLabels();
    });
  },

  buildBookmark(): UserBookmark {
    return {
      contentType: this.contentType,
      id: this.id,
      title: this.title,
      href: this.href,
      ...(this.category ? { category: this.category } : {}),
      ...(this.tag ? { tag: this.tag } : {}),
      ...(this.imageUrl ? { imageUrl: this.imageUrl } : {}),
    };
  },

  syncBookmarkState() {
    const authStore = Alpine.store("auth") as AuthStore;
    this.isBookmarked = Boolean(
      authStore.profile?.bookmarks?.some(
        (bookmark) =>
          bookmark.contentType === this.contentType && bookmark.id === this.id,
      ),
    );
  },

  syncLabels() {
    this.shareLabel = this.isSharing ? "Копируем..." : "Поделиться";

    if (this.isBookmarking) {
      this.bookmarkLabel = "Сохраняем...";
      return;
    }

    this.bookmarkLabel = this.isBookmarked ? "В закладках" : "В закладки";
  },

  async shareContent() {
    const uiStore = Alpine.store("ui") as UiStore;
    const url = toAbsoluteUrl(this.href);

    this.isSharing = true;
    this.syncLabels();

    try {
      if (navigator.share) {
        await navigator.share({
          title: this.title,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      uiStore?.showToast?.("Ссылка скопирована");
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        console.error("Failed to share content:", error);
        uiStore?.showToast?.("Не удалось поделиться ссылкой", "error");
      }
    } finally {
      this.isSharing = false;
      this.syncLabels();
    }
  },

  async toggleBookmark() {
    const authStore = Alpine.store("auth") as AuthStore;
    const uiStore = Alpine.store("ui") as UiStore;
    const currentUser = auth.currentUser;

    if (!authStore.isLoggedIn || !currentUser) {
      authStore.openAuthModal();
      uiStore?.showToast?.("Войдите, чтобы сохранять материалы", "error");
      return;
    }

    this.isBookmarking = true;
    this.syncLabels();

    try {
      const shouldRemoveBookmark = this.isBookmarked;
      const token = await currentUser.getIdToken();
      const bookmarks = shouldRemoveBookmark
        ? await usersApi.removeBookmark(
            currentUser.uid,
            this.contentType,
            this.id,
            token,
          )
        : await usersApi.addBookmark(currentUser.uid, this.buildBookmark(), token);

      authStore.setBookmarks(bookmarks);
      this.syncBookmarkState();
      uiStore?.showToast?.(
        shouldRemoveBookmark ? "Материал удален из закладок" : "Материал сохранен",
      );
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      uiStore?.showToast?.("Не удалось обновить закладку", "error");
    } finally {
      this.isBookmarking = false;
      this.syncBookmarkState();
      this.syncLabels();
    }
  },
});
