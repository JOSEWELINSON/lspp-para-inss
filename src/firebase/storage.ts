
'use client';
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage.
 *
 * @param storage The FirebaseStorage instance.
 * @param file The file to upload.
 * @param path The path where the file should be stored in Firebase Storage.
 * @returns A promise that resolves with an object containing the file name and download URL.
 */
export const uploadFile = async (
  storage: FirebaseStorage, 
  file: File, 
  path: string
): Promise<{ name: string, url: string }> => {
  if (!storage) {
    throw new Error("Firebase Storage service is not available.");
  }

  try {
    const storageRef = ref(storage, path);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { name: file.name, url: downloadURL };
  } catch (error) {
    console.error("Upload failed", error);
    throw error;
  }
};

    