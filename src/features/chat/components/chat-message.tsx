import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Messages } from "../type";
import { useMemo, useEffect, useState } from "react";
import { FileText, Image as ImageIcon } from "lucide-react";
import { MessageReadStatus } from "./message-read-status";

interface ChatMessageProps {
  message: Messages;
  currentMemberId: string;
  memberName?: string;
  totalMembers?: number;
  chatsId?: string;
}

export const ChatMessage = ({ 
  message, 
  currentMemberId, 
  memberName,
  totalMembers = 1,
  chatsId
}: ChatMessageProps) => {
  const [senderName, setSenderName] = useState<string>(memberName || "");
  const isCurrentUser = useMemo(() => {
    return message.memberId === currentMemberId;
  }, [message.memberId, currentMemberId]);

  // Format date for message timestamp
  const formattedTime = useMemo(() => {
    const dateToFormat = message.createdAt || message.CreatedAt || message.$createdAt;
    if (!dateToFormat) return "";
    
    try {
      return format(new Date(dateToFormat), 'HH:mm', { locale: vi });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  }, [message.createdAt, message.CreatedAt, message.$createdAt]);

  useEffect(() => {
    if (!memberName && message.memberId && !isCurrentUser) {
      const fetchMemberName = async () => {
        try {
          const response = await fetch(`/api/members/${message.memberId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.name) {
              setSenderName(data.data.name);
            } else {
              setSenderName("Người dùng");
            }
          }
        } catch (error) {
          console.error("Error fetching member details:", error);
          setSenderName("Người dùng");
        }
      };

      fetchMemberName();
    } else if (isCurrentUser) {
      setSenderName("Bạn");
    } else if (memberName) {
      setSenderName(memberName);
    }
  }, [message.memberId, memberName, isCurrentUser]);

  // Xác định trạng thái ban đầu của tin nhắn
  const getInitialMessageStatus = () => {
    // Nếu là tin nhắn tạm thời (đang gửi)
    if (message.$id?.startsWith('temp-')) {
      return 'sending';
    }
    // Nếu có $id thật nghĩa là đã gửi thành công
    return 'sent';
  };

  return (
    <div className={cn(
      "flex gap-2 mb-4",
      isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className="flex-shrink-0 mt-1">
        <Avatar className="h-8 w-8">
          <div className="bg-primary text-white w-full h-full flex items-center justify-center text-xs font-medium uppercase">
            {senderName?.charAt(0) || "U"}
          </div>
        </Avatar>
      </div>
      
      <div className={cn(
        "flex flex-col max-w-[75%]",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        {/* Tên người gửi chỉ hiển thị với tin nhắn từ người khác */}
        {!isCurrentUser && (
          <span className="text-xs font-semibold mb-1 text-muted-foreground px-1">{senderName}</span>
        )}
        
        <div className={cn(
          "rounded-lg p-3 shadow-sm",
          isCurrentUser 
            ? "bg-primary text-primary-foreground rounded-tr-none" 
            : "bg-muted rounded-tl-none"
        )}>
          {/* Nội dung tin nhắn */}
          {message.content && (
            <div className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}
          
          {/* Hiển thị ảnh đính kèm */}
          {message.imageUrl && (
            <div className="mt-2 relative">
              <div className="relative rounded-md overflow-hidden max-w-[300px]">
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
                  <ImageIcon className="h-6 w-6 text-white animate-pulse" />
                </div>
                <img 
                  src={message.imageUrl} 
                  alt="Hình ảnh đính kèm" 
                  className="w-full h-auto object-contain z-20 relative"
                  onLoad={(e) => {
                    // Ẩn icon loading khi ảnh đã tải xong
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      const overlay = parent.querySelector('div');
                      if (overlay) overlay.style.display = 'none';
                    }
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Hiển thị file đính kèm */}
          {message.fileUrl && !message.imageUrl && (
            <div className="mt-2">
              <a 
                href={message.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 text-sm p-2 rounded",
                  isCurrentUser ? "text-primary-foreground hover:bg-primary-foreground/20" : "text-primary hover:bg-muted-foreground/10"
                )}
              >
                <FileText className="h-4 w-4" />
                <span className="underline truncate max-w-[200px]">
                  {message.fileName || "Xem tệp đính kèm"}
                </span>
              </a>
            </div>
          )}
        </div>
        
        {/* Thời gian gửi tin nhắn và trạng thái */}
        <div className="flex items-center text-[10px] text-muted-foreground mt-1 px-1">
          <span>{formattedTime}</span>
          
          {/* Hiển thị trạng thái chỉ cho tin nhắn của người dùng hiện tại */}
          {isCurrentUser && chatsId && (
            <MessageReadStatus 
              messageId={message.$id || ''}
              chatsId={chatsId}
              memberId={currentMemberId}
              totalMembers={totalMembers}
              createdAt={(message.CreatedAt || message.$createdAt || new Date().toISOString()).toString()}
              status={getInitialMessageStatus() as "read" | "sent" | "delivered" | undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};