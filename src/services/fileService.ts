import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { storageService } from './storageService';

export const fileService = {
  // Upload a file and save its metadata to Firestore
  async uploadAndRegisterFile(
    meetingId: string, 
    file: File, 
    uploaderName: string
  ): Promise<void> {
    try {
      // 1. Upload to storage
      const uploadResult = await storageService.uploadFile(meetingId, file);

      // 2. Save metadata to Firestore
      const filesRef = collection(db, 'meetings', meetingId, 'files');
      
      // Guess type
      let type = 'document';
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.includes('pdf')) {
        type = 'pdf';
      }

      await addDoc(filesRef, {
        name: uploadResult.name,
        size: uploadResult.size,
        downloadUrl: uploadResult.downloadUrl,
        uploader: uploaderName,
        type,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Error in uploadAndRegisterFile:", err);
      throw err;
    }
  },

  // Listen for real-time file updates
  listenToFiles(
    meetingId: string, 
    onUpdate: (files: any[]) => void
  ): () => void {
    const filesRef = collection(db, 'meetings', meetingId, 'files');
    const q = query(filesRef, orderBy('timestamp', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const filesList: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        filesList.push({
          id: doc.id,
          name: data.name,
          size: data.size,
          downloadUrl: data.downloadUrl,
          uploader: data.uploader,
          type: data.type || 'document',
          previewUrl: data.type === 'image' ? data.downloadUrl : '',
          date: data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      });
      onUpdate(filesList);
    }, (err) => {
      console.error("Files snapshot listener error:", err);
    });
  }
};
