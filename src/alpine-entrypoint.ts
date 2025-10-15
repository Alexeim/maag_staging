import type { Alpine } from 'alpinejs';
import { navbarStore } from '@/stores/navbarStore';
import { authStore } from '@/stores/authStore';
import { createUiStore } from '@/stores/uiStore';
import lazyLoadPlugin from '@/lib/alpine/plugins/lazyLoadPlugin';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { usersApi } from "@/lib/api/api";

export default (Alpine: Alpine) => {
  console.log('Alpine entrypoint loaded!');
  
  Alpine.plugin(lazyLoadPlugin);
  Alpine.store('navbar', navbarStore);
  Alpine.store('auth', authStore);
  Alpine.store('ui', createUiStore());

  // Firebase Auth State Listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in, fetch their profile from our backend
      try {
        const profileData = await usersApi.get(user.uid);
        Alpine.store('auth').setUser(user, profileData);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        // Still set the auth user even if profile fetch fails
        Alpine.store('auth').setUser(user);
      }
    } else {
      // User is signed out
      Alpine.store('auth').clearUser();
    }
  });
};
