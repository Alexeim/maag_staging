import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { localizePath } from "@/lib/i18n/locales";
import { AUTH_MESSAGES } from "@/lib/i18n/auth";
import { documentLocale } from "@/lib/i18n/document";

export default () => ({
  async handleSignOut() {
    try {
      await signOut(auth);
      // Back to the homepage, in the language of the page the user was on
      globalThis.location.href = localizePath('/', documentLocale());
    } catch (error) {
      console.error("Error signing out: ", error);
      // Optionally, show an error message to the user
      alert(AUTH_MESSAGES[documentLocale()].signOutFailed);
    }
  }
});
