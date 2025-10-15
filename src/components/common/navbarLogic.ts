import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default () => ({
  async handleSignOut() {
    try {
      await signOut(auth);
      // Redirect to homepage or show a message after sign out
      window.location.href = '/';
    } catch (error) {
      console.error("Error signing out: ", error);
      // Optionally, show an error message to the user
      alert("Не удалось выйти. Пожалуйста, попробуйте еще раз.");
    }
  }
});
