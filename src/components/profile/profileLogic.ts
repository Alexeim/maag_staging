import { usersApi } from "@/lib/api/api";
export default function profileLogic() {
  return {
    form: {
      firstName: '',
      lastName: '',
    },
    init() {
      // Use a watcher to reactively populate the form when the profile loads
      this.$watch('$store.auth.profile', (newProfile) => {
        if (newProfile) {
          this.form.firstName = newProfile.firstName;
          this.form.lastName = newProfile.lastName;
        }
      });
      // Initial population in case the profile is already loaded
      if (this.$store.auth.profile) {
        this.form.firstName = this.$store.auth.profile.firstName;
        this.form.lastName = this.$store.auth.profile.lastName;
      }
    },

    async saveChanges() {
      const uid = window.Alpine.store('auth').user?.uid;
      if (!uid) {
        window.Alpine.store('ui').showToast('Error: Not logged in.', 'error');
        return;
      }

      try {
        const updatedProfile = await usersApi.update(uid, this.form);
        window.Alpine.store('auth').setUser(window.Alpine.store('auth').user, updatedProfile);
        window.Alpine.store('ui').showToast('Profile updated successfully!');
      } catch (error) {
        console.error('Failed to save changes:', error);
        window.Alpine.store('ui').showToast('An error occurred.', 'error');
      }
    },

    deleteAccount() {
      window.Alpine.store('ui').showConfirmation(
        "Are you sure you want to delete your account? This cannot be undone.",
        () => {
          console.log("Deleting account...");
          // Actual deletion logic would go here
          window.Alpine.store('ui').showToast('Account deleted (not really)!', 'error');
        }
      );
    },
  };
}
