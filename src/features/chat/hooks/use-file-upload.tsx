import { useState } from 'react';
import { chatApi } from '../api';

interface UseFileUploadOptions {
  chatsId: string;
  memberId: string;
}

export function useFileUpload({ chatsId, memberId }: UseFileUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<{success: boolean, data?: any, error?: string}> => {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    if (!chatsId || !memberId) {
      return { success: false, error: 'Missing chat or member information' };
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await chatApi.uploadFile(file, chatsId, memberId);
      setIsUploading(false);
      return { success: true, data: response.data };
    } catch (err) {
      setIsUploading(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const resetState = () => {
    setIsUploading(false);
    setError(null);
  };

  return {
    uploadFile,
    isUploading,
    error,
    resetState
  };
} 