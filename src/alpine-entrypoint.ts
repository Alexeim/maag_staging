import type { Alpine } from 'alpinejs';
import { PUBLIC_API_BASE_URL } from "./lib/utils/constants";
import { navbarStore } from '@/stores/navbarStore';
import { authStore } from '@/stores/authStore';
import { uiStore } from '@/stores/uiStore';
import lazyLoadPlugin from '@/lib/alpine/plugins/lazyLoadPlugin';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';

export default (Alpine: Alpine) => {
  console.log('Alpine entrypoint loaded!');
  
  Alpine.plugin(lazyLoadPlugin);
  Alpine.store('navbar', navbarStore);
  Alpine.store('auth', authStore);
  Alpine.store('ui', uiStore);

  // Firebase Auth State Listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in, fetch their profile from our backend
      try {
        const response = await fetch(`${PUBLIC_API_BASE_URL}/api/users/${user.uid}`);
        if (response.ok) {
          const profileData = await response.json();
          Alpine.store('auth').setUser(user, profileData);
        } else {
          // Profile not found or other error, still set the auth user
          Alpine.store('auth').setUser(user);
        }
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
