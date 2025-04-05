import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, ImageIcon, Smile, Send, X, FileText, File as FileIcon, Images, Search } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { useTypingStatus } from "./typing-indicator";
import { bytesToSize } from "@/lib/utils";
import { FileUploadPreview } from "./file-upload-preview";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string, file?: File) => void;
  onFileUpload?: (file: File) => void;
  isLoading?: boolean;
  chatsId?: string;
  memberId?: string;
  onToggleMediaGallery?: () => void;
  mediaGalleryOpen?: boolean;
  onOpenSearch?: () => void;
}

export const ChatInput = ({ 
  onSend, 
  onFileUpload, 
  isLoading, 
  chatsId, 
  memberId,
  onToggleMediaGallery,
  mediaGalleryOpen,
  onOpenSearch
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const { handleTyping } = useTypingStatus(chatsId || '', memberId || '');

  const handleSend = async () => {
    if (message.trim() || selectedFile) {
      if (selectedFile) {
        setIsUploading(true);
      }
      
      onSend(message, selectedFile || undefined);
      setMessage("");
      setSelectedFile(null);
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (chatsId && memberId) {
      handleTyping();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleFileClear = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Xử lý phím tắt Ctrl+F để mở tìm kiếm
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Kiểm tra Ctrl+F (hoặc Command+F trên macOS)
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault(); // Ngăn chặn hành vi mặc định của trình duyệt
      if (onOpenSearch) {
        onOpenSearch();
      }
    }
  };

  return (
    <div className="p-4 border-t">
      {selectedFile && (
        <FileUploadPreview 
          file={selectedFile}
          onClear={handleFileClear}
          isUploading={isUploading}
        />
      )}
      
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading}
            className="flex items-center gap-1 h-10 px-3"
          >
            <Paperclip className="h-4 w-4" />
            <span className="hidden sm:inline">Tệp</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            disabled={isLoading || isUploading}
            className="flex items-center gap-1 h-10 px-3"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Ảnh</span>
          </Button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv,.json"
          />
          
          <input 
            type="file" 
            ref={imageInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/*"
          />
        </div>
        
        {onToggleMediaGallery && (
          <Button 
            variant={mediaGalleryOpen ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleMediaGallery}
            className={cn(
              "flex items-center gap-1 h-10 px-3",
              mediaGalleryOpen ? "bg-primary/10" : ""
            )}
          >
            <Images className="h-4 w-4" />
            <span className="hidden sm:inline">Thư viện</span>
          </Button>
        )}
        
        {onOpenSearch && (
          <Button 
            variant="outline"
            size="sm"
            onClick={onOpenSearch}
            className="flex items-center gap-1 h-10 px-3"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Tìm kiếm</span>
          </Button>
        )}
        
        <Input 
          value={message}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            handleKeyDown(e);
            if (e.key === 'Enter' && !e.shiftKey) handleSend();
          }}
          placeholder="Nhập tin nhắn..." 
          className="flex-1"
          disabled={isLoading || isUploading}
        />
        
        <Button 
          variant="primary"
          size="icon"
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || isLoading || isUploading}
          className="h-10 w-10"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};