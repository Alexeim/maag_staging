
interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  role: string;
  // Add any other fields from your Firestore document
}

interface AuthStore {
  isAuthModalOpen: boolean;
  formType: 'login' | 'signup';
  user: User | null;
  profile: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean; // To know when Firebase is checking the auth state
  isProfileLoaded: boolean; // To know when the backend profile is fetched
  readonly initials: string;
  openAuthModal(): void;
  closeAuthModal(): void;
  switchTo(type: 'login' | 'signup'): void;
  setUser(user: User | null, profile?: UserProfile | null): void;
  clearUser(): void;
}

export const authStore: AuthStore = {
  isAuthModalOpen: false,
  formType: 'login',
  user: null,
  profile: null,
  isLoggedIn: false,
  isLoading: true,
  isProfileLoaded: false,
  
  get initials() {
    if (this.profile) {
      return `${this.profile.firstName[0] || ''}${this.profile.lastName[0] || ''}`.toUpperCase();
    }
    return '';
  },

  openAuthModal() {
    this.isAuthModalOpen = true;
    this.formType = 'login'; // Reset to login form every time it opens
  },

  closeAuthModal() {
    this.isAuthModalOpen = false;
  },

  switchTo(type) {
    this.formType = type;
    // Dispatch a custom event that the Alpine component can listen to
    document.dispatchEvent(new CustomEvent('auth-form-switched'));
  },

  setUser(user, profile = null) {
    this.user = user;
    this.isLoggedIn = !!user;
    this.isLoading = false; // Firebase auth check is done
    
    if (profile) {
      this.profile = profile;
      this.isProfileLoaded = true; // Backend profile is now loaded
    } else if (user) {
      // User is logged in, but we don't have profile data yet.
      // This can happen on initial page load.
      this.isProfileLoaded = false;
    } else {
      // User is logged out.
      this.isProfileLoaded = false;
    }
  },

  clearUser() {
    this.user = null;
    this.profile = null;
    this.isLoggedIn = false;
    this.isLoading = false;
    this.isProfileLoaded = false;
  }
};
