import { auth } from "@/lib/firebase/client";
import { usersApi } from "@/lib/api/api";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

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

const getAlpineStore = (name: string) => (window as any).Alpine.store(name);

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
        this.error = "Введите email чтобы сбросить пароль.";
        return;
      }
      try {
        await sendPasswordResetEmail(auth, this.formData.email);
        this.error = "";
        getAlpineStore("ui").showToast(
          "Письмо отправлено на " + this.formData.email,
        );
      } catch {
        this.error = "Не удалось отправить письмо. Проверьте email.";
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
          if (
            err instanceof FirebaseError &&
            (err.code === "auth/wrong-password" ||
              err.code === "auth/user-not-found")
          ) {
            this.error = "Неверный email или пароль.";
          } else {
            this.error = "Произошла непредвиденная ошибка.";
            console.error(err);
          }
        }
      } else {
        // Signup
        if (this.formData.password !== this.formData.confirmPassword) {
          this.error = "Пароли не совпадают";
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

          getAlpineStore("ui").showToast(
            "Регистрация прошла успешно!",
          );
          getAlpineStore("auth").setUser(user, createdProfile);
          getAlpineStore("auth").closeAuthModal();
        } catch (err) {
          if (
            err instanceof FirebaseError &&
            err.code === "auth/email-already-in-use"
          ) {
            this.error = "Этот email уже зарегистрирован.";
          } else if (
            err instanceof FirebaseError &&
            err.code === "auth/weak-password"
          ) {
            this.error = "Пароль должен содержать минимум 6 символов";
          } else {
            this.error = "Произошла непредвиденная ошибка при регистрации.";
            // TODO remove the console log
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
