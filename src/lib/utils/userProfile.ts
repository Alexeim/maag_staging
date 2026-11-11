import type { User } from "firebase/auth";
import { ApiError, usersApi, type UserProfileResponse } from "@/lib/api/api";

type ProfileSource = Pick<User, "uid" | "displayName" | "email">;

// First / last name for a Firestore profile, from what Firebase Auth knows:
// the displayName ("Ivan Petrov" → "Ivan" + "Petrov"), else the email's local
// part. lastName may be empty; the backend accepts that.
export const namesFromUser = (
  user: ProfileSource,
): { firstName: string; lastName: string } => {
  const [first = "", ...rest] = (user.displayName ?? "").trim().split(/\s+/);
  if (first) {
    return { firstName: first, lastName: rest.join(" ") };
  }

  return {
    firstName: (user.email ?? "").split("@")[0] || "User",
    lastName: "",
  };
};

// Sign-up creates the Firebase account and the Firestore profile in two
// separate requests; if the second one failed, the user can sign in but has
// no profile. Only a 404 creates it — any other error may hide an existing
// profile. POST /api/users is keyed by the token's uid and idempotent, so this
// can never produce a second profile or overwrite one.
export const loadOrCreateProfile = async (
  user: ProfileSource,
  token: string,
): Promise<UserProfileResponse> => {
  try {
    return await usersApi.get(user.uid, token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error;
    }

    return usersApi.create({ uid: user.uid, ...namesFromUser(user) }, token);
  }
};
