import React, { useRef, useState } from "react";
import { Chats, ChatMembers, Messages } from "../type";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageCircle, UserPlus, User, Image, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatInput } from "./chat-input";
import { ChatHeader } from "./chat-header";
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
  isSyncing: boolean;
  messages?: Messages[];
  isLoading?: boolean;
  error?: any;
  onSendMessage: (content: string, file?: File) => void;
  isSending?: boolean;
  syncNotification?: string | null;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chats,
  memberId,
  onSyncMembers,
  isSyncing,
  messages = [],
  isLoading = false,
  error = null,
  onSendMessage,
  isSending = false,
  syncNotification = null
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [addMembersNotification, setAddMembersNotification] = useState<string | null>(null);
  
  // Check if the workspace only has the current user as member
  const hasOnlyCurrentUser = chats?.members?.length === 1 && chats.members[0].memberId === memberId;

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
        onAddAllMembers={handleAddAllMembers}
        isSyncing={isSyncing} 
        isAddingMembers={isAddingMembers}
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
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.$id}
              className={cn(
                "max-w-[80%] rounded-lg p-3",
                msg.isSystemMessage 
                  ? "mx-auto bg-muted/50 text-center max-w-[90%] italic" 
                  : msg.memberId === memberId
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
              )}
            >
              {msg.content && (
                <p className={cn(
                  "text-sm",
                  msg.isSystemMessage && "text-muted-foreground"
                )}>
                  {msg.content}
                </p>
              )}
              
              {/* Display file attachments */}
              {msg.fileUrl && (
                <div className="mt-2">
                  <a 
                    href={msg.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm underline"
                  >
                    <FileText className="h-4 w-4" />
                    Attached File
                  </a>
                </div>
              )}
              
              {/* Display image attachments */}
              {msg.imageUrl && (
                <div className="mt-2">
                  <a 
                    href={msg.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <div className="relative aspect-square max-w-[200px] overflow-hidden rounded-md">
                      <Image className="h-8 w-8 absolute inset-0 m-auto animate-pulse" />
                      <img 
                        src={msg.imageUrl} 
                        alt="Attached image" 
                        className="h-full w-full object-cover"
                        onLoad={(e) => {
                          // Hide the placeholder after image loads
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent) {
                            const placeholder = parent.querySelector("svg");
                            if (placeholder) placeholder.style.display = "none";
                          }
                        }}
                      />
                    </div>
                  </a>
                </div>
              )}
              
              <p className="text-xs mt-1 opacity-70">
                {new Date(msg.$createdAt).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message input */}
      <div className="p-4 border-t">
        <ChatInput 
          onSend={onSendMessage} 
          isLoading={isSending} 
        />
      </div>
    </Card>
  );
};