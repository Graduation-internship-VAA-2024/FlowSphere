"use client";
import React, { useState, useEffect } from "react";
import { ChatArea } from "./chat-area";
import { ChatList } from "./chat-list";
import { Chats, ChatMembers } from "../type";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Menu } from "lucide-react";
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
  
  // State to control sidebar visibility on mobile
  const [showChatList, setShowChatList] = useState(false);
  
  // Check viewport size to manage responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setShowChatList(window.innerWidth >= 768);
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
          <AlertTitle>Error connecting to server</AlertTitle>
          <AlertDescription>
            {error.includes("timeout") || error.includes("failed") ? 
              "Cannot connect to Appwrite server. Please check your network connection or try again later." : 
              error}
          </AlertDescription>
        </Alert>
        
        <div className="text-sm text-muted-foreground mb-4">
          <p>Possible reasons:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Unstable network connection</li>
            <li>Appwrite server is not responding</li>
            <li>Incorrect environment configuration</li>
          </ul>
        </div>
        
        <div className="mt-4 flex justify-center space-x-4">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Reload
          </Button>
          <Button onClick={onRetry}>
            Try again
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="flex h-[calc(100vh-120px)] p-4 gap-4 bg-gray-50 rounded-lg relative">
      {isLoading ? (
        <>
          <Skeleton className="hidden md:block w-[320px] h-full rounded-xl" />
          <Skeleton className="flex-1 h-full rounded-xl" />
        </>
      ) : (
        <>
          {/* Chat List - hidden on mobile when not shown */}
          <div 
            className={`
              ${showChatList ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
              fixed md:static inset-y-0 left-0 z-20
              w-[320px] h-full md:h-auto
              transition-transform duration-300 ease-in-out
              md:drop-shadow-md md:rounded-xl overflow-hidden
            `}
          >
            <div className="h-full bg-white rounded-xl border border-gray-100">
              <ChatList 
                workspaceId={workspaceId}
                chats={chats}
                isLoading={isChatsLoading}
                selectedChatId={selectedChat?.$id}
                onSelectChat={(chat) => {
                  onSelectChat(chat);
                  // Hide chat list on mobile after selecting a chat
                  if (window.innerWidth < 768) {
                    setShowChatList(false);
                  }
                }}
                currentMemberId={memberId}
              />
            </div>
          </div>
          
          {/* Main Chat Area - always visible */}
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden relative">
            {/* Toggle button to show chat list on mobile */}
            <Button
              variant="outline"
              size="icon"
              className={`absolute top-3 left-3 z-30 md:hidden bg-white shadow-sm hover:bg-gray-100 ${showChatList ? 'hidden' : ''}`}
              style={{ top: '15px', left: '10px' }}
              onClick={() => setShowChatList(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Overlay to close sidebar when clicking outside on mobile */}
            {showChatList && (
              <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10 md:hidden"
                onClick={() => setShowChatList(false)}
              />
            )}
            
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
          </div>
        </>
      )}
    </div>
  );
};

export default ChatUI;

