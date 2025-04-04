import React, { useRef, useState, useEffect } from "react";
import { Chats, ChatMembers, Messages } from "../type";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageCircle, UserPlus, User, Image, FileText, ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatInput } from "./chat-input";
import { ChatHeader } from "./chat-header";
import { ChatMessage } from "./chat-message";
import { TypingIndicatorDisplay } from "./typing-indicator";
import Link from "next/link";
import { chatApi } from "../api";

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
  isSyncing?: boolean;
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
  isSyncing = false,
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
  const [localIsSyncing, setLocalIsSyncing] = useState(false); // Local syncing state
  
  // Check if the workspace only has the current user as member
  const hasOnlyCurrentUser = chats?.members?.length === 1 && 
    chats.members[0].memberId === memberId && 
    chats.isGroup; // Chỉ áp dụng cho nhóm chat
  
  console.log("ChatArea Check:", {
    memberId,
    chatId: chats?.$id,
    membersCount: chats?.members?.length || 0,
    members: chats?.members?.map(m => ({
      id: m.memberId,
      isCurrentUser: m.memberId === memberId
    })),
    hasOnlyCurrentUser
  });

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

  // Tự động đánh dấu tin nhắn đã đọc khi người dùng đang xem cuộc trò chuyện
  useEffect(() => {
    if (chats && messages.length > 0) {
      // Lọc các tin nhắn chưa đọc và không phải do người dùng hiện tại gửi
      const unreadMessages = messages.filter(msg => msg.memberId !== memberId);
      
      // Đánh dấu tất cả tin nhắn chưa đọc là đã đọc
      unreadMessages.forEach(msg => {
        if (msg.$id) {
          chatApi.markMessageAsRead(chats.$id, msg.$id);
        }
      });
    }
  }, [messages, chats, memberId]);

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

  // Auto sync members when chat loads if necessary
  useEffect(() => {
    if (chats && chats.isGroup && !isSyncing && !localIsSyncing) {
      // Check if the chat needs member sync
      const chatMembersCount = chats.members?.length || 0;
      const workspaceMembersCount = chats.totalWorkspaceMembers || 0;
      
      // If there's a significant difference, suggest syncing
      if (workspaceMembersCount > 0 && 
          (chatMembersCount === 0 || 
           Math.abs(chatMembersCount - workspaceMembersCount) > 2)) {
        setAddMembersNotification("Phát hiện thay đổi thành viên. Bạn nên cập nhật lại danh sách thành viên chat.");
      }
    }
  }, [chats, isSyncing, localIsSyncing]);

  // Function to sync all workspace members to the current chat
  const handleSyncMembers = async () => {
    if (!chats) return;
    
    setLocalIsSyncing(true);
    
    try {
      const response = await chatApi.syncMembers(chats.$id, chats.workspaceId);
      const { added, removed, kept, total } = response.data;
      
      let statusMessage = `Đã đồng bộ thành viên: ${total} thành viên tổng cộng.`;
      if (added > 0) statusMessage += ` Thêm ${added} thành viên mới.`;
      if (removed > 0) statusMessage += ` Xóa ${removed} thành viên không hợp lệ.`;
      
      // Gọi callback để refresh dữ liệu từ parent component
      onSyncMembers();
      
      // Hiển thị thông báo chi tiết
      setAddMembersNotification(statusMessage);
      
      // Ẩn thông báo sau 5 giây
      setTimeout(() => {
        setAddMembersNotification(null);
      }, 5000);
    } catch (error) {
      console.error("Error syncing members:", error);
      setAddMembersNotification("Lỗi: Không thể đồng bộ thành viên");
    } finally {
      setLocalIsSyncing(false);
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
  if (hasOnlyCurrentUser) {
    console.log("🚨 Hiển thị giao diện chỉ có một thành viên", chats);
    return (
      <Card className="flex-1 p-8 flex flex-col items-center justify-center">
        <div className="mb-4">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h3 className="text-xl font-medium mb-2">Chỉ có bạn trong nhóm chat này</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Hiện tại bạn là thành viên duy nhất trong nhóm chat này. Hãy mời thêm thành viên để bắt đầu cuộc trò chuyện.
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
    <Card className="flex-1 flex flex-col h-full">
      <ChatHeader 
        chats={chats} 
        onSyncMembers={handleSyncMembers} 
        isSyncing={isSyncing || localIsSyncing}
        isRealtimeConnected={isRealtimeConnected}
      />

      {/* Thông báo đồng bộ */}
      {syncNotification && (
        <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-2 text-sm text-center">
          {syncNotification}
        </div>
      )}
      
      {/* Thông báo hướng dẫn đồng bộ thành viên */}
      {chats.isGroup && chats.members && chats.members.length > 0 && (
        <>
          {addMembersNotification && (
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-2 text-sm text-center border-t border-b border-blue-200 dark:border-blue-800/50">
              <div className="flex items-center justify-center">
                {localIsSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-2" />
                )}
                <p className="font-medium">{addMembersNotification}</p>
              </div>
            </div>
          )}
          
          {!addMembersNotification && chats.totalWorkspaceMembers && chats.members.length !== chats.totalWorkspaceMembers && (
            <div className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-2 text-sm text-center border-t border-b border-amber-200 dark:border-amber-800/50">
              <div className="flex items-center justify-center">
                <p className="font-medium">
                  Phát hiện sự khác biệt giữa thành viên workspace ({chats.totalWorkspaceMembers}) 
                  và thành viên chat ({chats.members.length}). 
                  <Button variant="primary" size="sm" onClick={handleSyncMembers} className="px-1 h-auto">
                    Cập nhật ngay
                  </Button>
                </p>
              </div>
            </div>
          )}
        </>
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