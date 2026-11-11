import { beforeEach, expect, test, vi } from "vitest";

const usersApi = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn() }));

// Keep the real ApiError: loadOrCreateProfile checks `instanceof ApiError`.
vi.mock("@/lib/api/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/api")>()),
  usersApi,
}));

import { ApiError } from "@/lib/api/api";
import { loadOrCreateProfile, namesFromUser } from "@/lib/utils/userProfile";

const user = { uid: "u1", displayName: "Ivan Petrov", email: "ivan@example.com" };
const profile = { uid: "u1", firstName: "Ivan", lastName: "Petrov", role: "reader" };

beforeEach(() => {
  usersApi.get.mockReset();
  usersApi.create.mockReset();
});

test("returns the existing profile and never creates one", async () => {
  usersApi.get.mockResolvedValue(profile);

  await expect(loadOrCreateProfile(user, "t")).resolves.toBe(profile);
  expect(usersApi.create).not.toHaveBeenCalled();
});

test("creates the missing profile on 404, from the display name", async () => {
  usersApi.get.mockRejectedValue(new ApiError("not found", 404, "Not Found", null));
  usersApi.create.mockResolvedValue(profile);

  await expect(loadOrCreateProfile(user, "t")).resolves.toBe(profile);
  expect(usersApi.create).toHaveBeenCalledWith(
    { uid: "u1", firstName: "Ivan", lastName: "Petrov" },
    "t",
  );
});

test("does not create on other errors (the profile may exist)", async () => {
  const serverError = new ApiError("boom", 500, "Server Error", null);
  usersApi.get.mockRejectedValue(serverError);

  await expect(loadOrCreateProfile(user, "t")).rejects.toBe(serverError);
  expect(usersApi.create).not.toHaveBeenCalled();
});

test("does not create on a network error", async () => {
  usersApi.get.mockRejectedValue(new ApiError("Network error", 0, "FETCH_ERROR", null));

  await expect(loadOrCreateProfile(user, "t")).rejects.toBeInstanceOf(ApiError);
  expect(usersApi.create).not.toHaveBeenCalled();
});

test("names fall back to the email when there is no display name", () => {
  expect(namesFromUser({ uid: "u1", displayName: null, email: "anna@example.com" })).toEqual({
    firstName: "anna",
    lastName: "",
  });
  expect(namesFromUser({ uid: "u1", displayName: "  Anna  ", email: null })).toEqual({
    firstName: "Anna",
    lastName: "",
  });
});
