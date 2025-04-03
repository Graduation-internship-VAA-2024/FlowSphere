import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, ImageIcon, Smile, Send, X } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { useTypingStatus } from "./typing-indicator";

interface ChatInputProps {
  onSend: (message: string, file?: File) => void;
  onFileUpload?: (file: File) => void;
  isLoading?: boolean;
  chatsId?: string;
  memberId?: string;
}

export const ChatInput = ({ onSend, onFileUpload, isLoading, chatsId, memberId }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const { handleTyping } = useTypingStatus(chatsId || '', memberId || '');

  const handleSend = () => {
    if (message.trim() || selectedFile) {
      onSend(message, selectedFile || undefined);
      setMessage("");
      setSelectedFile(null);
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
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileClear = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  return (
    <div className="p-4 border-t">
      {selectedFile && (
        <div className="mb-2 p-2 bg-muted/30 rounded flex items-center justify-between">
          <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={handleFileClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <Tooltip content="Attach file">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </Tooltip>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          accept=".pdf,.doc,.docx,.txt"
        />
        
        <Tooltip content="Attach image">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            disabled={isLoading}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
        </Tooltip>
        
        <input 
          type="file" 
          ref={imageInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          accept="image/*"
        />
        
        <Input 
          value={message}
          onChange={handleInputChange}
          placeholder="Type a message..." 
          className="flex-1"
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        
        <Tooltip content="Emoji (coming soon)">
          <Button 
            variant="ghost" 
            size="icon"
            disabled={isLoading}
          >
            <Smile className="h-5 w-5" />
          </Button>
        </Tooltip>
        
        <Button 
          size="icon"
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || isLoading}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};