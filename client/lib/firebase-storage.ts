import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";

/**
 * Upload file to Firebase Storage
 */
export const uploadFile = async (
  uid: string,
  folder: string,
  file: File
): Promise<string> => {
  try {
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `users/${uid}/${folder}/${fileName}`);

    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);

    return downloadUrl;
  } catch (error) {
    console.error("Upload file error:", error);
    throw error;
  }
};

/**
 * Upload document to Firebase Storage
 */
export const uploadDocument = async (
  uid: string,
  file: File
): Promise<string> => {
  return uploadFile(uid, "documents", file);
};

/**
 * Upload image to Firebase Storage
 */
export const uploadImage = async (
  uid: string,
  file: File
): Promise<string> => {
  return uploadFile(uid, "images", file);
};

/**
 * Delete file from Firebase Storage
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Delete file error:", error);
    throw error;
  }
};
