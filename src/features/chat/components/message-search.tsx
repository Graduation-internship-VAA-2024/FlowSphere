import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Messages } from "../type";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, ArrowUp, ArrowDown, MessageSquare, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface MessageSearchProps {
  messages: Messages[];
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
  onSearch?: (term: string) => Promise<void>;
  results?: any[];
  isSearching?: boolean;
  searchTerm?: string;
  setSearchTerm?: React.Dispatch<React.SetStateAction<string>>;
}

interface SearchResult extends Messages {
  senderName?: string;
}

export const MessageSearch = ({ 
  messages,
  onClose,
  onJumpToMessage
}: MessageSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  // Auto focus trên input khi component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Tải tên của các thành viên
  useEffect(() => {
    const uniqueMemberIds = Array.from(new Set(messages.map(msg => msg.memberId))).filter(Boolean);
    
    const fetchMemberNames = async () => {
      const names: Record<string, string> = {};
      
      for (const memberId of uniqueMemberIds) {
        if (!memberId) continue;
        
        try {
          const response = await fetch(`/api/members/${memberId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.name) {
              names[memberId] = data.data.name;
            }
          }
        } catch (error) {
          console.error("Error fetching member name:", error);
        }
      }
      
      setMemberNames(names);
    };
    
    if (uniqueMemberIds.length > 0) {
      fetchMemberNames();
    }
  }, [messages]);

  // Thực hiện tìm kiếm khi searchTerm thay đổi
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const filteredMessages = messages.filter(message => {
      // Tìm kiếm trong nội dung tin nhắn (bỏ qua các tin nhắn hệ thống và tin nhắn chỉ có ảnh/file)
      if (message.content) {
        return message.content.toLowerCase().includes(searchTerm.toLowerCase());
      }
      // Tìm kiếm trong tên file
      if (message.fileName) {
        return message.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    }).map(message => ({
      ...message,
      senderName: message.memberId ? memberNames[message.memberId] || "User" : "System"
    }));

    // Sắp xếp kết quả theo thời gian để tin nhắn mới nhất lên đầu
    filteredMessages.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.CreatedAt || a.$createdAt || 0);
      const dateB = new Date(b.createdAt || b.CreatedAt || b.$createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    setSearchResults(filteredMessages);
    setSelectedIndex(0); // Reset vị trí chọn khi có kết quả mới
  }, [searchTerm, messages, memberNames]);

  // Nhảy đến tin nhắn tiếp theo
  const goToNext = () => {
    if (searchResults.length > 0) {
      setSelectedIndex((prevIndex: number) => (prevIndex + 1) % searchResults.length);
    }
  };

  // Nhảy đến tin nhắn trước đó
  const goToPrevious = () => {
    if (searchResults.length > 0) {
      setSelectedIndex((prevIndex: number) => prevIndex === 0 ? searchResults.length - 1 : prevIndex - 1);
    }
  };

  // Xử lý khi nhấn Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchResults.length > 0 && searchResults[selectedIndex].$id) {
        onJumpToMessage(searchResults[selectedIndex].$id!);
      }
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      goToNext();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      goToPrevious();
    }
  };

  // Format và rút gọn nội dung tin nhắn
  const formatMessageContent = (content: string | undefined, term: string) => {
    if (!content) return "";
    
    const maxLength = 60;
    const lowerContent = content.toLowerCase();
    const lowerTerm = term.toLowerCase();
    
    // Tìm vị trí của từ khóa trong nội dung
    const index = lowerContent.indexOf(lowerTerm);
    if (index === -1) return content.length > maxLength ? content.substring(0, maxLength) + "..." : content;
    
    // Xác định đoạn cần hiển thị
    let start = Math.max(0, index - 20);
    let end = Math.min(content.length, index + term.length + 20);
    
    // Thêm dấu "..." nếu cần
    const prefix = start > 0 ? "..." : "";
    const suffix = end < content.length ? "..." : "";
    
    return prefix + content.substring(start, end) + suffix;
  };

  // Format thời gian gửi tin nhắn
  const formatDate = (date?: string | Date) => {
    if (!date) return "";
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, "HH:mm - dd/MM/yyyy", { locale: vi });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  return (
    <div className="w-full border-b p-2 bg-muted/20">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search messages..."
            className="pl-8 pr-8"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToPrevious}
            disabled={searchResults.length === 0}
            title="Previous message"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToNext}
            disabled={searchResults.length === 0}
            title="Next message"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-1"
            onClick={onClose}
            title="Close search"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {searchResults.length > 0 && (
        <div className="bg-background border rounded-md mb-1 overflow-hidden">
          <ScrollArea className="max-h-60">
            <div className="py-1">
              {searchResults.map((message, index) => (
                <div
                  key={message.$id}
                  className={cn(
                    "px-3 py-2 hover:bg-muted/50 cursor-pointer flex flex-col gap-1",
                    selectedIndex === index && "bg-primary/10"
                  )}
                  onClick={() => {
                    setSelectedIndex(index);
                    if (message.$id) onJumpToMessage(message.$id);
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="text-sm truncate flex-1">
                      {message.content ? (
                        formatMessageContent(message.content, searchTerm)
                      ) : (
                        <span className="italic text-muted-foreground">
                          {message.fileName ? `File: ${message.fileName}` : "No text content"}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground ml-6">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{message.senderName}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        {formatDate(message.createdAt || message.CreatedAt || message.$createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-2 text-xs text-muted-foreground border-t">
            Found {searchResults.length} results • Use ↑/↓ to navigate and Enter to jump to a message
          </div>
        </div>
      )}
      
      {searchTerm.length >= 2 && searchResults.length === 0 && (
        <div className="p-3 text-center text-sm text-muted-foreground">
          No messages found for "{searchTerm}"
        </div>
      )}
    </div>
  );
}; 