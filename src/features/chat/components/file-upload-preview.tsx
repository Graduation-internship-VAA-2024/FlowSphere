import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileIcon, FileText, FileArchive, File, ImageIcon, X } from 'lucide-react';
import { bytesToSize } from '@/lib/utils';

interface FileUploadPreviewProps {
  file: File;
  onClear: () => void;
  uploadProgress?: number;
  isUploading?: boolean;
}

// Function to get appropriate icon based on file type
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
  if (fileType.startsWith('video/')) return <FileIcon className="h-5 w-5" />;
  if (fileType.startsWith('audio/')) return <FileIcon className="h-5 w-5" />;
  
  if (fileType.includes('pdf')) return <FileIcon className="h-5 w-5" />;
  if (fileType.includes('word') || fileType.includes('doc')) return <FileText className="h-5 w-5" />;
  if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('csv')) return <FileText className="h-5 w-5" />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) return <FileArchive className="h-5 w-5" />;
  if (fileType.includes('json') || fileType.includes('javascript') || fileType.includes('html') || fileType.includes('css')) return <FileIcon className="h-5 w-5" />;
  
  return <FileIcon className="h-5 w-5" />;
};

export function FileUploadPreview({ file, onClear, isUploading = false }: FileUploadPreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);
  
  // Generate image preview if it's an image
  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    
    return () => {
      // Clean up preview URL when component unmounts
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file]);
  
  return (
    <div className="mb-3 p-3 bg-muted/30 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {preview ? (
            <div className="w-10 h-10 rounded overflow-hidden">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
              {getFileIcon(file.type)}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
            <span className="text-xs text-muted-foreground">{bytesToSize(file.size)}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8" 
          onClick={onClear}
          disabled={isUploading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Preview for images */}
      {preview && (
        <div className="mt-2 rounded-md overflow-hidden max-h-[150px] flex items-center justify-center bg-black/5">
          <img src={preview} alt="Preview" className="max-h-[150px] object-contain" />
        </div>
      )}
      
      {/* Upload status indicator */}
      {isUploading && (
        <div className="mt-2">
          <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
            <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Uploading file...
          </p>
        </div>
      )}
    </div>
  );
} 