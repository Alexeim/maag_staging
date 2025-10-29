import Alpine from 'alpinejs';

// Define a type for the profile object for clarity
interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  role: string;
  stripeSubscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  stripeCurrentPeriodEnd?: number;
  stripeCustomerId?: string;
}

export default () => ({
  isSubscribed: false,
  subscriptionStatus: '',
  subscriptionEndDate: '',
  backendUrl: import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:3000',

  init() {
    Alpine.effect(() => {
      const isLoaded = Alpine.store('auth').isProfileLoaded;
      if (isLoaded) {
        this.updateSubscriptionStatus();
      }
    });
  },

  updateSubscriptionStatus() {
    // THIS IS THE FIX: Read from .profile, not .user
    const profile: UserProfile | null = Alpine.store('auth').profile;
    
    if (profile && (profile.stripeSubscriptionStatus === 'active' || profile.stripeSubscriptionStatus === 'trialing')) {
      this.isSubscribed = true;
      this.subscriptionStatus = profile.stripeSubscriptionStatus;
      if (profile.stripeCurrentPeriodEnd) {
        const endDate = new Date(profile.stripeCurrentPeriodEnd * 1000); // Stripe timestamp is in seconds
        this.subscriptionEndDate = endDate.toLocaleDateString('ru-RU');
      }
    } else {
      this.isSubscribed = false;
      this.subscriptionStatus = profile?.stripeSubscriptionStatus || 'inactive';
      this.subscriptionEndDate = '';
    }
  },

  async forceRefresh() {
    const authStore = Alpine.store('auth');
    if (!authStore.isLoggedIn || !authStore.user?.uid) {
      alert('Пожалуйста, войдите в систему.');
      return;
    }
    
    try {
      const response = await fetch(`${this.backendUrl}/api/users/${authStore.user.uid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const profileData = await response.json();
      
      // Pass the existing user and the new profile to ensure both are correctly updated.
      authStore.setUser(authStore.user, profileData);
      
      // Use toast for notifications instead of alert
      const uiStore = Alpine.store('ui');
      uiStore?.showToast?.("Данные профиля обновлены!");

    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      const uiStore = Alpine.store('ui');
      uiStore?.showToast?.("Не удалось обновить данные профиля.", "error");
    }
  },

  async createSubscription() {
    const authStore = Alpine.store('auth');
    if (!authStore.isLoggedIn || !authStore.user?.uid) {
      alert('Пожалуйста, войдите, чтобы оформить подписку.');
      return;
    }

    const priceId = 'price_1SB1Z5EWdjhfESjTMMkvskxv'; // Your actual Stripe Price ID

    try {
      const response = await fetch(`${this.backendUrl}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: priceId, userId: authStore.user.uid }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Ошибка при создании сессии оплаты: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Ошибка при создании сессии оплаты:', error);
      alert('Произошла ошибка при попытке оформить подписку.');
    }
  },

  async manageSubscription() {
    const authStore = Alpine.store('auth');
    // THIS IS THE FIX: Read from .profile, not .user
    const profile: UserProfile | null = authStore.profile;
    if (!authStore.isLoggedIn || !profile?.stripeCustomerId) {
      alert('У вас нет активной подписки для управления.');
      return;
    }

    try {
      const response = await fetch(`${this.backendUrl}/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId: profile.stripeCustomerId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Ошибка при создании сессии портала: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Ошибка при создании сессии портала:', error);
      alert('Произошла ошибка при попытке управлять подпиской.');
    }
  },
});