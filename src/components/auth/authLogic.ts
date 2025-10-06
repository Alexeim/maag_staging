import { auth } from '@/lib/firebase/client';
import { PUBLIC_API_BASE_URL } from "../../lib/utils/constants";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

export default function authModalLogic() {
  return {
    formData: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
    error: '',
    isLoading: false,

    init() {
      // Listen for the custom event from the store to reset local state
      document.addEventListener('auth-form-switched', () => {
        this.formData = {
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
        };
        this.error = '';
      });
    },

    handleInputChange(detail) {
      if (detail.name in this.formData) {
        this.formData[detail.name] = detail.value;
      }
    },

    async handleSubmit() {
      this.isLoading = true;
      this.error = '';

      if (window.Alpine.store('auth').formType === 'login') {
        try {
          await signInWithEmailAndPassword(auth, this.formData.email, this.formData.password);
          window.Alpine.store('auth').closeAuthModal();
        } catch (err) {
          if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
            this.error = 'Invalid email or password.';
          } else {
            this.error = 'An unexpected error occurred.';
            console.error(err);
          }
        }
      } else {
        // Signup
        if (this.formData.password !== this.formData.confirmPassword) {
          this.error = 'Passwords do not match';
          this.isLoading = false;
          return;
        }
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, this.formData.email, this.formData.password);
          const user = userCredential.user;

          await updateProfile(user, { 
            displayName: `${this.formData.firstName} ${this.formData.lastName}`.trim() 
          });

          // Create user document in our Firestore database via our backend
          const response = await fetch(`${PUBLIC_API_BASE_URL}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              firstName: this.formData.firstName,
              lastName: this.formData.lastName,
            }),
          });

          if (!response.ok) {
            console.error('Failed to create user profile in database.');
            this.error = 'Could not create user profile.';
            this.isLoading = false;
            return;
          }

          window.Alpine.store('ui').showToast('Signup successful! Please log in.');
          window.Alpine.store('auth').switchTo('login');

        } catch (err) {
          if (err.code === 'auth/email-already-in-use') {
            this.error = 'This email is already registered.';
          } else {
            this.error = 'An unexpected error occurred during signup.';
            console.error(err);
          }
        }
      }

      this.isLoading = false;
    }
  };
}