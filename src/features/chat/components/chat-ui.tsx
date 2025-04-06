"use client";
import React from "react";
import { ChatArea } from "./chat-area";
import { ChatList } from "./chat-list";
import { Chats, ChatMembers } from "../type";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ChatUIProps {
  workspaceId: string;
  selectedChat: Chats & { 
    members?: (ChatMembers & { 
      memberDetails?: { 
        name?: string;
        email?: string;
        userId?: string;
      } 
    })[];
    totalWorkspaceMembers?: number;
  } | null;
  memberId: string;
  chats: (Chats & { 
    members?: (ChatMembers & { 
      memberDetails?: { 
        name?: string;
        email?: string;
        userId?: string;
      } 
    })[];
    totalWorkspaceMembers?: number;
  })[];
  isLoading: boolean;
  isChatsLoading: boolean;
  error: string | null;
  syncNotification?: string | null;
  onSelectChat: (chat: Chats & { 
    members?: (ChatMembers & { 
      memberDetails?: { 
        name?: string;
        email?: string;
        userId?: string;
      } 
    })[];
    totalWorkspaceMembers?: number;
  }) => void;
  onRetry: () => void;
  onSendMessage: (content: string, file?: File) => void;
  messages?: any[];
  isSending?: boolean;
  isRealtimeConnected?: boolean;
  onCreateChat?: (name: string, isGroup: boolean) => void;
  isCreatingChat?: boolean;
  createChatError?: string | null;
  highlightedMessage?: string | null;
  onJumpToMessage?: (messageId: string) => void;
}

export const ChatUI: React.FC<ChatUIProps> = ({
  workspaceId,
  selectedChat,
  memberId,
  chats,
  isLoading,
  isChatsLoading,
  error,
  syncNotification,
  onSelectChat,
  onRetry,
  onSendMessage,
  messages = [],
  isSending = false,
  isRealtimeConnected = false,
  onCreateChat,
  isCreatingChat,
  createChatError,
  highlightedMessage,
  onJumpToMessage
}) => {
  // Tạo ref để theo dõi vị trí cuộn
  const scrollPositionRef = React.useRef<number | null>(null);
  
  // Sử dụng prop onJumpToMessage nếu có, nếu không thì tạo một fallback function
  const handleJumpToMessage = (messageId: string) => {
    if (onJumpToMessage) {
      onJumpToMessage(messageId);
    } else {
      console.log("Jump to message function not provided:", messageId);
    }
  };

  if (!workspaceId) {
    return (
      <Card className="p-8 text-center">
        <p>Please select a workspace to access the chat feature.</p>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="p-8">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Lỗi kết nối đến máy chủ</AlertTitle>
          <AlertDescription>
            {error.includes("timeout") || error.includes("failed") ? 
              "Không thể kết nối đến máy chủ Appwrite. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau." : 
              error}
          </AlertDescription>
        </Alert>
        
        <div className="text-sm text-muted-foreground mb-4">
          <p>Nguyên nhân có thể là:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Kết nối mạng không ổn định</li>
            <li>Máy chủ Appwrite không phản hồi</li>
            <li>Cấu hình môi trường không chính xác</li>
          </ul>
        </div>
        
        <div className="mt-4 flex justify-center space-x-4">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Tải lại
          </Button>
          <Button onClick={onRetry}>
            Thử lại
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {isLoading && (
        <>
          <Skeleton className="w-80 h-full" />
          <Skeleton className="flex-1 h-full" />
        </>
      )}
      
      {!isLoading && (
        <>
          <ChatList 
            workspaceId={workspaceId}
            chats={chats}
            isLoading={isChatsLoading}
            selectedChatId={selectedChat?.$id}
            onSelectChat={onSelectChat}
            currentMemberId={memberId}
          />
          
          <ChatArea 
            chats={selectedChat || undefined}
            memberId={memberId}
            onSendMessage={onSendMessage}
            messages={messages}
            isSending={isSending}
            syncNotification={syncNotification}
            isRealtimeConnected={isRealtimeConnected}
            onJumpToMessage={handleJumpToMessage}
            scrollPositionRef={scrollPositionRef}
            highlightedMessage={highlightedMessage}
          />
        </>
      )}
    </div>
  );
};

export default ChatUI;

