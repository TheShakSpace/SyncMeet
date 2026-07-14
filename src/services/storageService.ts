import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export const storageService = {
  // Upload any meeting artifact file to Firebase Storage
  async uploadFile(meetingId: string, file: File): Promise<{ downloadUrl: string, name: string, size: string }> {
    try {
      if (storage) {
        const fileRef = ref(storage, `meetings/${meetingId}/files/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        return {
          downloadUrl,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
        };
      }
    } catch (err) {
      console.warn("Firebase Storage upload failed or not provisioned, falling back to local object URL:", err);
    }

    // Fallback if Storage is not fully active or throws an error (e.g. offline sandbox preview)
    const localUrl = URL.createObjectURL(file);
    return {
      downloadUrl: localUrl,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
    };
  }
};
