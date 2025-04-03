import React, { useRef, useState, useEffect } from "react";
import { Chats, ChatMembers, Messages } from "../type";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageCircle, UserPlus, User, Image, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatInput } from "./chat-input";
import { ChatHeader } from "./chat-header";
import { ChatMessage } from "./chat-message";
import { TypingIndicatorDisplay } from "./typing-indicator";
import Link from "next/link";

interface ChatAreaProps {
  chats?: Chats & { 
    members?: (ChatMembers & { 
      memberDetails?: { 
        name?: string;
        email?: string;
        userId?: string;
      } 
    })[];
    totalWorkspaceMembers?: number;
  };
  memberId: string;
  onSyncMembers: () => void;
  onAddAllMembers?: () => void;
  isSyncing: boolean;
  isAddingMembers?: boolean;
  messages?: Messages[];
  isLoading?: boolean;
  error?: any;
  onSendMessage: (content: string, file?: File) => void;
  isSending?: boolean;
  syncNotification?: string | null;
  isRealtimeConnected?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chats,
  memberId,
  onSyncMembers,
  onAddAllMembers,
  isSyncing,
  messages = [],
  isLoading = false,
  error = null,
  onSendMessage,
  isSending = false,
  syncNotification = null,
  isRealtimeConnected = false
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [addMembersNotification, setAddMembersNotification] = useState<string | null>(null);
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if the workspace only has the current user as member
  const hasOnlyCurrentUser = chats?.members?.length === 1 && chats.members[0].memberId === memberId;

  // Load members information
  useEffect(() => {
    if (chats?.members) {
      const newMembersMap: Record<string, string> = {};
      chats.members.forEach(member => {
        if (member.memberDetails?.name) {
          newMembersMap[member.memberId] = member.memberDetails.name;
        }
      });
      setMembersMap(newMembersMap);
    }
  }, [chats?.members]);

  // Scroll to bottom when the component mounts or messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll events to show/hide scroll button
  useEffect(() => {
    const scrollAreaElement = scrollRef.current;
    if (!scrollAreaElement) return;

    const handleScroll = () => {
      if (scrollAreaElement) {
        const { scrollHeight, scrollTop, clientHeight } = scrollAreaElement;
        const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 30;
        setIsAtBottom(atBottom);
        setShowScrollButton(!atBottom && messages.length > 4);
      }
    };

    scrollAreaElement.addEventListener('scroll', handleScroll);
    return () => {
      scrollAreaElement.removeEventListener('scroll', handleScroll);
    };
  }, [messages.length]);

  // Automatically scroll to bottom after sending a message
  useEffect(() => {
    if (!isSending) {
      scrollToBottom();
    }
  }, [isSending]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle manual scroll to bottom
  const handleScrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShowScrollButton(false);
      setIsAtBottom(true);
    }
  };

  // Function to add all workspace members to the current chat
  const handleAddAllMembers = async () => {
    if (!chats) return;
    
    setIsAddingMembers(true);
    setAddMembersNotification(null);
    
    try {
      const response = await fetch(`/api/chat/${chats.$id}/add-all-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: chats.workspaceId,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAddMembersNotification(data.message || "Đã thêm tất cả thành viên vào nhóm chat thành công.");
        // Reload the chat to reflect the changes after 1 second
        setTimeout(() => {
          onSyncMembers();
        }, 1000);
      } else {
        setAddMembersNotification(`Lỗi: ${data.error || "Không thể thêm thành viên"}`);
      }
    } catch (error) {
      setAddMembersNotification("Lỗi: Không thể kết nối đến máy chủ");
      console.error("Error adding all members:", error);
    } finally {
      setIsAddingMembers(false);
    }
  };

  if (!chats) {
    return (
      <Card className="flex-1 p-8 flex flex-col items-center justify-center">
        <div className="mb-4">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-xl font-medium mb-2">Chưa chọn cuộc trò chuyện</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Chọn một cuộc trò chuyện từ danh sách bên trái hoặc tạo một cuộc trò chuyện mới để bắt đầu.
        </p>
      </Card>
    );
  }

  // Hiển thị UI đặc biệt khi workspace chỉ có một thành viên
  if (hasOnlyCurrentUser && chats.isGroup) {
    return (
      <Card className="flex-1 p-8 flex flex-col items-center justify-center">
        <div className="mb-4">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h3 className="text-xl font-medium mb-2">Chỉ có bạn trong workspace này</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Hiện tại bạn là thành viên duy nhất trong workspace này. Hãy mời thêm thành viên để bắt đầu cuộc trò chuyện.
        </p>
        <Link href={`/workspaces/${chats.workspaceId}/settings`}>
          <Button variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Mời thành viên
          </Button>
        </Link>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="flex-1 p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading messages...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex-1 p-8 flex items-center justify-center">
        <p className="text-destructive">Error loading messages: {error instanceof Error ? error.message : error}</p>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col">
      {/* Chat header */}
      <ChatHeader 
        chats={chats} 
        onSyncMembers={onSyncMembers} 
        onAddAllMembers={onAddAllMembers}
        isSyncing={isSyncing} 
        isAddingMembers={isAddingMembers}
        isRealtimeConnected={isRealtimeConnected}
      />
      
      {/* Hiển thị thông báo đồng bộ */}
      {(syncNotification || addMembersNotification) && (
        <div className="px-4 py-2">
          <div className="p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-sm rounded-md">
            {syncNotification || addMembersNotification}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        <ScrollArea ref={scrollRef} className="flex-1 p-4 h-full overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-3 opacity-20" />
              <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {messages.map((msg) => (
                msg.isSystemMessage ? (
                  <div 
                    key={msg.$id}
                    className="mx-auto bg-muted/50 text-center max-w-[90%] italic rounded-lg p-3"
                  >
                    <p className="text-sm text-muted-foreground">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.$createdAt || msg.CreatedAt || '').toLocaleTimeString()}
                    </p>
                  </div>
                ) : (
                  <ChatMessage 
                    key={msg.$id || `temp-${Date.now()}-${Math.random()}`}
                    message={msg}
                    currentMemberId={memberId}
                    memberName={membersMap[msg.memberId] || msg.senderName}
                    chatsId={chats?.$id}
                    totalMembers={chats?.members?.length || 0}
                  />
                )
              ))}
              <div ref={messagesEndRef} id="messages-end" className="h-1" />

              {/* Hiển thị indicator đang nhập */}
              {chats && (
                <TypingIndicatorDisplay 
                  chatsId={chats.$id} 
                  memberId={memberId} 
                />
              )}
            </div>
          )}
        </ScrollArea>
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-4 right-4 rounded-full shadow-md z-10 p-2 w-8 h-8 bg-primary/80 text-white hover:bg-primary"
            onClick={handleScrollToBottom}
            title="Cuộn xuống tin nhắn mới nhất"
          >
            <ChevronDown size={16} />
          </Button>
        )}
      </div>

      {/* Message input */}
      <ChatInput 
        onSend={onSendMessage} 
        isLoading={isSending}
        chatsId={chats?.$id}
        memberId={memberId}
      />
    </Card>
  );
};