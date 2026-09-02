import type { Alpine } from 'alpinejs';
import { navbarStore } from '@/stores/navbarStore';
import { authStore } from '@/stores/authStore';
import { createUiStore } from '@/stores/uiStore';
import lazyLoadPlugin from '@/lib/alpine/plugins/lazyLoadPlugin';
import blockRichTextEditor from '@/lib/alpine/blockRichTextEditor';
import { auth, getIdToken } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { setAuthTokenProvider, usersApi } from "@/lib/api/api";

// Let every api.ts write call pick up the signed-in user's token automatically.
setAuthTokenProvider(getIdToken);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let isAuthProfileCreateInProgress = false;
const authProfileCreateWaiters: Array<() => void> = [];

document.addEventListener("auth-profile-create-start", () => {
  isAuthProfileCreateInProgress = true;
});

document.addEventListener("auth-profile-create-end", () => {
  isAuthProfileCreateInProgress = false;
  authProfileCreateWaiters.splice(0).forEach((resolve) => resolve());
});

const waitForAuthProfileCreate = async () => {
  if (!isAuthProfileCreateInProgress) {
    return;
  }

  await Promise.race([
    new Promise<void>((resolve) => authProfileCreateWaiters.push(resolve)),
    wait(3000),
  ]);
};

export default (Alpine: Alpine) => {
  console.log('Alpine entrypoint loaded!');
  
  Alpine.plugin(lazyLoadPlugin);
  Alpine.data('blockRichTextEditor', blockRichTextEditor);
  Alpine.store('navbar', navbarStore);
  Alpine.store('auth', authStore);
  Alpine.store('ui', createUiStore());
};

// Firebase Auth State Listener - Register ONLY ONCE outside the lifecycle-linked export
onAuthStateChanged(auth, async (user) => {
  // Use a slight delay or wait for Alpine to be available if needed, 
  // but since this is part of the entrypoint bundle, it's generally safe.
  // We need a way to access the store without the local 'Alpine' variable.
  // Fortunately, Alpine is usually global when using the integration.
  const getStore = () => (window as any).Alpine?.store('auth');

  if (user) {
    try {
      await waitForAuthProfileCreate();

      const store = getStore();
      if (store?.profile?.uid === user.uid) {
        store.setUser(user, store.profile);
      } else {
        const token = await user.getIdToken();
        const profileData = await usersApi.get(user.uid, token);
        store?.setUser(user, profileData);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      getStore()?.setUser(user);
    }

    try {
      const token = await user.getIdToken();
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      });
    } catch (error) {
      console.error("Failed to establish server session:", error);
    }
  } else {
    getStore()?.clearUser();
    fetch("/api/session", { method: "DELETE" }).catch(() => {});
  }
});
