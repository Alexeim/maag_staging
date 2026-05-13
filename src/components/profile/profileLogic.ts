import { usersApi } from "@/lib/api/api";
import { auth } from "@/lib/firebase/client";
import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import type { UiStore } from "@/stores/uiStore";
import type { AuthStore } from "@/stores/authStore";

declare const Alpine: any;

export default () => ({
  form: {
    firstName: "",
    lastName: "",
  },

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
      }
    });
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