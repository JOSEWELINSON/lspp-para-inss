'use client';
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage.
 *
 * @param storage The FirebaseStorage instance.
 * @param file The file to upload.
 * @param path The path where the file should be stored in Firebase Storage.
 * @returns A promise that resolves with the download URL of the uploaded file.
 */
export const uploadFile = async (storage: FirebaseStorage, file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  
  try {
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Upload failed", error);
    // Depending on your error handling strategy, you might want to throw the error
    // or return a specific error message.
    throw error;
  }
};
