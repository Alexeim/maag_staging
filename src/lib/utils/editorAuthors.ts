import type { AuthorResponse } from "@/lib/api/api";

// What the dashboard author picker reads. The list is authorsApi.list(), plus
// an entry rebuilt from the loaded material's author when that one is missing
// from it (so no createdAt).
export type EditorAuthor = Pick<
  AuthorResponse,
  "id" | "firstName" | "lastName" | "role" | "avatar" | "noBgAvatar"
>;

// Present on a material loaded from the API (the editors copy the response
// as-is) but not on the empty initial state their type is inferred from.
export type LoadedAuthorFields = {
  author?: {
    firstName?: string;
    lastName?: string;
    role?: string;
    avatar?: string;
  } | null;
  authorId?: unknown;
};
