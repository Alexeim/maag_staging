import { usersApi } from "@/lib/api/api";
import { auth } from "@/lib/firebase/client";
import type { UiStore } from "@/stores/uiStore";
import type { AuthStore } from "@/stores/authStore";

declare const Alpine: any;

export default () => ({
  form: {
    firstName: "",
    lastName: "",
  },

  init() {
    // Populate form with data from the auth store when component initializes.
    // This is now safe because the parent Astro component waits for `isProfileLoaded`
    // to be true before rendering the component that uses this logic.
    const authStore = Alpine.store('auth') as AuthStore;
    if (authStore.profile) {
      this.form.firstName = authStore.profile.firstName || '';
      this.form.lastName = authStore.profile.lastName || '';
    }
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
      const token = await currentUser.getIdToken(true); // Force refresh for security
      
      const updatedProfile = await usersApi.update(
        currentUser.uid,
        this.form,
        token
      );
      
      // THIS IS THE ORIGINAL, CORRECT WAY TO UPDATE THE STORE
      authStore.setUser(authStore.user, updatedProfile);

      uiStore?.showToast?.("Изменения успешно сохранены!");

    } catch (error) {
      console.error("Failed to save profile:", error);
      uiStore?.showToast?.("Не удалось сохранить изменения.", "error");
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