import type { Alpine } from 'alpinejs';
import { navbarStore } from '@/stores/navbarStore';
import { authStore } from '@/stores/authStore';
import { createUiStore } from '@/stores/uiStore';
import lazyLoadPlugin from '@/lib/alpine/plugins/lazyLoadPlugin';
import blockRichTextEditor from '@/lib/alpine/blockRichTextEditor';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { usersApi } from "@/lib/api/api";

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
      const token = await user.getIdToken();
      const profileData = await usersApi.get(user.uid, token);
      getStore()?.setUser(user, profileData);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      getStore()?.setUser(user);
    }
  } else {
    getStore()?.clearUser();
  }
});
