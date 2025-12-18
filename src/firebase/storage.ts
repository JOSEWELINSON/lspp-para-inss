'use client';
import { ref, uploadBytesResumable, getDownloadURL, FirebaseStorage, UploadTaskSnapshot } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage with progress tracking.
 *
 * @param storage The FirebaseStorage instance.
 * @param file The file to upload.
 * @param path The path where the file should be stored in Firebase Storage.
 * @param onProgress A callback function that receives the upload progress percentage.
 * @returns A promise that resolves with the download URL of the uploaded file.
 */
export const uploadFile = (
  storage: FirebaseStorage, 
  file: File, 
  path: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!storage) {
        reject(new Error("Firebase Storage service is not available."));
        return;
    }

    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot: UploadTaskSnapshot) => {
        // Observe state change events such as progress, pause, and resume
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      }, 
      (error) => {
        // Handle unsuccessful uploads
        console.error("Upload failed", error);
        reject(error);
      }, 
      () => {
        // Handle successful uploads on complete
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        }).catch(reject);
      }
    );
  });
};
