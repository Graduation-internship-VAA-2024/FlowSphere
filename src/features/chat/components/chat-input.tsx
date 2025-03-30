import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, ImageIcon, Smile, Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <div className="p-4 border-t">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Paperclip className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <ImageIcon className="h-5 w-5" />
        </Button>
        <Input 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..." 
          className="flex-1"
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        <Button variant="ghost" size="icon">
          <Smile className="h-5 w-5" />
        </Button>
        <Button 
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
