
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
    this.profile = profile;
    this.isLoggedIn = !!user;
    this.isLoading = false;
  },

  clearUser() {
    this.user = null;
    this.profile = null;
    this.isLoggedIn = false;
    this.isLoading = false;
  }
};
