import { useState, useEffect, useCallback } from 'react';
import { fileService } from '../services/fileService';

interface UseFilesProps {
  meetingId: string | undefined;
  uploaderName: string | undefined;
  onToast?: (message: string) => void;
  isFirebaseEnabled?: boolean;
}

export interface SharedFile {
  id: string;
  name: string;
  size: string;
  uploader: string;
  date: string;
  type: string;
  previewUrl?: string;
  downloadUrl?: string;
}

export function useFiles({
  meetingId,
  uploaderName,
  onToast,
  isFirebaseEnabled
}: UseFilesProps) {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Synchronize files list with Firestore
  useEffect(() => {
    if (!isFirebaseEnabled || !meetingId) return;

    const unsubscribe = fileService.listenToFiles(meetingId, (syncedFiles) => {
      setFiles(syncedFiles);
    });

    return () => {
      unsubscribe();
    };
  }, [meetingId, isFirebaseEnabled]);

  // Upload file
  const uploadFile = useCallback(async (file: File) => {
    if (!meetingId || !uploaderName) return;

    setIsUploading(true);
    try {
      if (isFirebaseEnabled) {
        await fileService.uploadAndRegisterFile(meetingId, file, uploaderName);
      } else {
        // Local simulation fallback
        const localUrl = URL.createObjectURL(file);
        const newFile: SharedFile = {
          id: `file-sim-${Date.now()}`,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          uploader: uploaderName,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'document',
          previewUrl: file.type.startsWith('image/') ? localUrl : '',
          downloadUrl: localUrl
        };
        setFiles(prev => [newFile, ...prev]);
      }

      if (onToast) {
        onToast(`File "${file.name}" uploaded and shared successfully!`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      if (onToast) {
        onToast(`Failed to share file: ${file.name}`);
      }
    } finally {
      setIsUploading(false);
    }
  }, [meetingId, uploaderName, onToast, isFirebaseEnabled]);

  return {
    files,
    isUploading,
    uploadFile
  };
}
