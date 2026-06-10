import { Request, Response } from "express";
import { getDb } from "../services/firebase";
import admin from "firebase-admin";

const BOOKMARK_CONTENT_TYPES = new Set([
  "article",
  "event",
  "flipper",
  "guide",
  "interview",
  "news",
  "photoOfTheDay",
  "tips",
  "visualStory",
]);

export interface UserBookmark {
  contentType: string;
  id: string;
  title: string;
  href: string;
  category?: string;
  tag?: string;
  imageUrl?: string;
  savedAt?: Date;
}

// Basic user interface
export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  role: "reader" | "author" | "admin";
  bookmarks: UserBookmark[];
  createdAt: Date;
}

const db = getDb();
const usersCollection = db.collection("users");

const isOwnProfileRequest = (req: Request, uid: string) =>
  (req as any).user?.uid === uid;

const normalizeBookmark = (value: unknown): UserBookmark | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Partial<UserBookmark>;
  const contentType = String(raw.contentType ?? "").trim();
  const id = String(raw.id ?? "").trim();
  const title = String(raw.title ?? "").trim();
  const href = String(raw.href ?? "").trim();
  const category =
    typeof raw.category === "string" && raw.category.trim()
      ? raw.category.trim()
      : undefined;
  const tag =
    typeof raw.tag === "string" && raw.tag.trim() ? raw.tag.trim() : undefined;
  const imageUrl =
    typeof raw.imageUrl === "string" && raw.imageUrl.trim()
      ? raw.imageUrl.trim()
      : undefined;

  if (!contentType || !id || !title || !href || !BOOKMARK_CONTENT_TYPES.has(contentType)) {
    return null;
  }

  return {
    contentType,
    id,
    title,
    href,
    ...(category ? { category } : {}),
    ...(tag ? { tag } : {}),
    ...(imageUrl ? { imageUrl } : {}),
  };
};

const normalizeStoredBookmarks = (bookmarks: unknown): UserBookmark[] => {
  if (!Array.isArray(bookmarks)) {
    return [];
  }

  return bookmarks
    .map((bookmark) => {
      const normalized = normalizeBookmark(bookmark);
      if (!normalized) {
        return null;
      }

      const savedAt =
        bookmark && typeof bookmark === "object"
          ? (bookmark as { savedAt?: Date }).savedAt
          : undefined;

      return {
        ...normalized,
        ...(savedAt ? { savedAt } : {}),
      };
    })
    .filter((bookmark): bookmark is UserBookmark => Boolean(bookmark));
};

/**
 * @description Create a new user profile in Firestore
 * @route POST /api/users
 */
export const createUserProfile = async (req: Request, res: Response) => {
  try {
    const { uid, firstName, lastName } = req.body;

    if (!uid || !firstName || !lastName) {
      return res
        .status(400)
        .json({ message: "UID, firstName, and lastName are required" });
    }

    const newUserProfile: Omit<UserProfile, "uid"> = {
      firstName,
      lastName,
      role: "reader", // Assign a default role
      bookmarks: [],
      createdAt: new Date(),
    };

    // Use the Firebase Auth UID as the document ID in Firestore
    await usersCollection.doc(uid).set(newUserProfile);

    res.status(201).json({ uid, ...newUserProfile });
  } catch (error) {
    console.error("Error creating user profile:", error);
    res
      .status(500)
      .json({ message: "Server error while creating user profile" });
  }
};

/**
 * @description Get a user profile by UID
 * @route GET /api/users/:uid
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const doc = await usersCollection.doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const profileData = doc.data();

    res.status(200).json({
      uid: doc.id,
      ...profileData,
      bookmarks: normalizeStoredBookmarks(profileData?.bookmarks),
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res
      .status(500)
      .json({ message: "Server error while getting user profile" });
  }
};

/**
 * @description Update a user profile
 * @route PUT /api/users/:uid
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { firstName, lastName } = req.body;

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ message: "First name and last name are required" });
    }

    const userRef = usersCollection.doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "User profile not found" });
    }

    await userRef.update({ firstName, lastName });

    const updatedDoc = await userRef.get();
    const updatedProfileData = updatedDoc.data();
    res.status(200).json({
      uid: updatedDoc.id,
      ...updatedProfileData,
      bookmarks: normalizeStoredBookmarks(updatedProfileData?.bookmarks),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ message: "Server error while updating user profile" });
  }
};

/**
 * @description Get the current user's saved bookmarks
 * @route GET /api/users/:uid/bookmarks
 */
export const getUserBookmarks = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    if (!isOwnProfileRequest(req, uid)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const doc = await usersCollection.doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "User profile not found" });
    }

    res.status(200).json(normalizeStoredBookmarks(doc.data()?.bookmarks));
  } catch (error) {
    console.error("Error getting user bookmarks:", error);
    res
      .status(500)
      .json({ message: "Server error while getting user bookmarks" });
  }
};

/**
 * @description Add or update a saved bookmark for the current user
 * @route POST /api/users/:uid/bookmarks
 */
export const addUserBookmark = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    if (!isOwnProfileRequest(req, uid)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const bookmark = normalizeBookmark(req.body);

    if (!bookmark) {
      return res.status(400).json({
        message: "contentType, id, title, and href are required",
      });
    }

    const userRef = usersCollection.doc(uid);
    const nextBookmark = {
      ...bookmark,
      savedAt: admin.firestore.Timestamp.now(),
    };

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(userRef);

      if (!doc.exists) {
        throw new Error("USER_PROFILE_NOT_FOUND");
      }

      const existingBookmarks = normalizeStoredBookmarks(doc.data()?.bookmarks);
      const filteredBookmarks = existingBookmarks.filter(
        (item) =>
          !(item.contentType === bookmark.contentType && item.id === bookmark.id),
      );

      transaction.update(userRef, {
        bookmarks: [nextBookmark, ...filteredBookmarks],
      });
    });

    const updatedDoc = await userRef.get();
    res.status(200).json(normalizeStoredBookmarks(updatedDoc.data()?.bookmarks));
  } catch (error) {
    if ((error as Error).message === "USER_PROFILE_NOT_FOUND") {
      return res.status(404).json({ message: "User profile not found" });
    }

    console.error("Error adding user bookmark:", error);
    res.status(500).json({ message: "Server error while adding bookmark" });
  }
};

/**
 * @description Remove a saved bookmark for the current user
 * @route DELETE /api/users/:uid/bookmarks/:contentType/:contentId
 */
export const removeUserBookmark = async (req: Request, res: Response) => {
  try {
    const { uid, contentType, contentId } = req.params;

    if (!isOwnProfileRequest(req, uid)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!BOOKMARK_CONTENT_TYPES.has(contentType) || !contentId) {
      return res.status(400).json({ message: "Invalid bookmark target" });
    }

    const userRef = usersCollection.doc(uid);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(userRef);

      if (!doc.exists) {
        throw new Error("USER_PROFILE_NOT_FOUND");
      }

      const nextBookmarks = normalizeStoredBookmarks(doc.data()?.bookmarks).filter(
        (item) => !(item.contentType === contentType && item.id === contentId),
      );

      transaction.update(userRef, {
        bookmarks: nextBookmarks,
      });
    });

    const updatedDoc = await userRef.get();
    res.status(200).json(normalizeStoredBookmarks(updatedDoc.data()?.bookmarks));
  } catch (error) {
    if ((error as Error).message === "USER_PROFILE_NOT_FOUND") {
      return res.status(404).json({ message: "User profile not found" });
    }

    console.error("Error removing user bookmark:", error);
    res.status(500).json({ message: "Server error while removing bookmark" });
  }
};

/**
 * @description Modify a user role
 * route PUT /api/users/:uid
 */
export const modifyUserRole = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    if (!uid) {
      return res.status(400).json({ message: "Uid is required" });
    }

    const userRef = usersCollection.doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "User profile not found" });
    }

    await userRef.update(role);

    const updatedDoc = await userRef.get();
    res.status(200).json({ uid: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    console.error("Error updaring user role:", error);

    res
      .status(500)
      .json({ messaga: "Server error while updating user profile" });
  }
};
