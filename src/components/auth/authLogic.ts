import { auth } from "@/lib/firebase/client";
import { usersApi } from "@/lib/api/api";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  type UserCredential,
} from "firebase/auth";
import { AUTH_MESSAGES } from "@/lib/i18n/auth";
import { namesFromUser } from "@/lib/utils/userProfile";
import { documentLocale } from "@/lib/i18n/document";

const messages = () => AUTH_MESSAGES[documentLocale()];

// Firebase errors that mean the same thing for sign-in and sign-up, so they
// get a specific message instead of falling into "unexpected error".
const commonAuthErrorMessage = (err: unknown): string | null => {
  if (!(err instanceof FirebaseError)) return null;
  if (err.code === "auth/network-request-failed")
    return messages().networkError;
  if (err.code === "auth/too-many-requests") return messages().tooManyRequests;
  return null;
};

// With email enumeration protection on, Firebase answers both a wrong password
// and an unknown email with auth/invalid-credential instead of the older codes.
const WRONG_CREDENTIAL_ERRORS = new Set([
  "auth/invalid-credential",
  "auth/wrong-password",
  "auth/user-not-found",
]);

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

interface AuthInputChange {
  name: keyof AuthFormData;
  value: string;
}

const getAlpineStore = (name: string) => (globalThis as any).Alpine.store(name);

// Popup outcomes that mean "the user changed their mind", not an error.
const SILENT_GOOGLE_ERRORS = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
]);

// Names for the Firestore profile of a Google user. Google's own profile has
// given_name / family_name; family_name can be missing, and the backend
// accepts an empty last name.
const namesFromGoogle = (
  credential: UserCredential,
): { firstName: string; lastName: string } => {
  const profile = (getAdditionalUserInfo(credential)?.profile ?? {}) as {
    given_name?: unknown;
    family_name?: unknown;
  };
  const given =
    typeof profile.given_name === "string" ? profile.given_name.trim() : "";
  const family =
    typeof profile.family_name === "string" ? profile.family_name.trim() : "";

  if (given) {
    return { firstName: given, lastName: family };
  }

  return namesFromUser(credential.user);
};

export default function authModalLogic() {
  return {
    formData: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
    error: "",
    isLoading: false,

    init() {
      // Listen for the custom event from the store to reset local state
      document.addEventListener("auth-form-switched", () => {
        this.formData = {
          email: "",
          password: "",
          confirmPassword: "",
          firstName: "",
          lastName: "",
        };
        this.error = "";
      });
    },

    handleInputChange(detail: AuthInputChange) {
      if (detail.name in this.formData) {
        this.formData[detail.name] = detail.value;
      }
    },

    async forgotPassword() {
      if (!this.formData.email) {
        this.error = messages().enterEmailToReset;
        return;
      }
      try {
        await sendPasswordResetEmail(auth, this.formData.email);
        this.error = "";
        getAlpineStore("ui").showToast(
          messages().resetEmailSentTo + this.formData.email,
        );
      } catch {
        this.error = messages().resetEmailFailed;
      }
    },

    async signInWithGoogle() {
      if (this.isLoading) return;

      this.isLoading = true;
      this.error = "";

      // onAuthStateChanged (alpine-entrypoint.ts) fires before signInWithPopup
      // resolves; this makes it wait for the profile instead of getting a 404.
      document.dispatchEvent(new CustomEvent("auth-profile-create-start"));

      try {
        const credential = await signInWithPopup(
          auth,
          new GoogleAuthProvider(),
        );
        const { user } = credential;
        const token = await user.getIdToken();

        // Idempotent on the backend: a returning user gets their existing
        // profile back, nothing is overwritten.
        const profile = await usersApi.create(
          { uid: user.uid, ...namesFromGoogle(credential) },
          token,
        );

        if (getAdditionalUserInfo(credential)?.isNewUser) {
          getAlpineStore("ui").showToast(messages().signupSucceeded);
        }
        getAlpineStore("auth").setUser(user, profile);
        getAlpineStore("auth").closeAuthModal();
      } catch (error) {
        if (
          error instanceof FirebaseError &&
          SILENT_GOOGLE_ERRORS.has(error.code)
        ) {
          return;
        }

        this.error =
          error instanceof FirebaseError &&
          error.code === "auth/account-exists-with-different-credential"
            ? messages().accountExistsWithDifferentCredential
            : messages().googleSignInFailed;
        console.error("Google sign-in failed:", error);
      } finally {
        document.dispatchEvent(new CustomEvent("auth-profile-create-end"));
        this.isLoading = false;
      }
    },

    async handleSubmit() {
      this.isLoading = true;
      this.error = "";

      if (getAlpineStore("auth").formType === "login") {
        try {
          await signInWithEmailAndPassword(
            auth,
            this.formData.email,
            this.formData.password,
          );
          getAlpineStore("auth").closeAuthModal();
        } catch (err) {
          const commonMessage = commonAuthErrorMessage(err);
          if (commonMessage) {
            this.error = commonMessage;
          } else if (
            err instanceof FirebaseError &&
            WRONG_CREDENTIAL_ERRORS.has(err.code)
          ) {
            this.error = messages().wrongCredentials;
          } else {
            this.error = messages().unexpectedError;
            console.error(err);
          }
        }
      } else {
        // Signup
        if (this.formData.password !== this.formData.confirmPassword) {
          this.error = messages().passwordsMismatch;
          this.isLoading = false;
          return;
        }

        document.dispatchEvent(new CustomEvent("auth-profile-create-start"));

        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            this.formData.email,
            this.formData.password,
          );
          const user = userCredential.user;

          await updateProfile(user, {
            displayName:
              `${this.formData.firstName} ${this.formData.lastName}`.trim(),
          });

          const token = await user.getIdToken();

          // Create user document in our Firestore database via our backend
          const createdProfile = await usersApi.create(
            {
              uid: user.uid,
              firstName: this.formData.firstName,
              lastName: this.formData.lastName,
            },
            token,
          );

          getAlpineStore("ui").showToast(messages().signupSucceeded);
          getAlpineStore("auth").setUser(user, createdProfile);
          getAlpineStore("auth").closeAuthModal();
        } catch (err) {
          const commonMessage = commonAuthErrorMessage(err);
          if (commonMessage) {
            this.error = commonMessage;
          } else if (
            err instanceof FirebaseError &&
            err.code === "auth/email-already-in-use"
          ) {
            this.error = messages().emailAlreadyUsed;
          } else if (
            err instanceof FirebaseError &&
            err.code === "auth/weak-password"
          ) {
            this.error = messages().weakPassword;
          } else {
            this.error = messages().unexpectedSignupError;
            console.error(err);
          }
        } finally {
          document.dispatchEvent(new CustomEvent("auth-profile-create-end"));
        }
      }

      this.isLoading = false;
    },
  };
}
