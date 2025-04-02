import React, { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Plus, Search, User, UserPlus, Users } from "lucide-react";
import { Chats, ChatMembers } from "../type";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ChatListProps {
  workspaceId: string;
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
  selectedChatId?: string;
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
  onCreateChat?: (name: string, isGroup: boolean) => void;
  isCreatingChat?: boolean;
  createChatError?: string | null;
  userName?: string;
}

export const ChatList: React.FC<ChatListProps> = ({
  workspaceId,
  chats,
  isLoading,
  selectedChatId,
  onSelectChat,
  onCreateChat,
  isCreatingChat = false,
  createChatError = null,
  userName = "Bạn"
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredChats, setFilteredChats] = useState(chats);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [isGroup, setIsGroup] = useState(true);
  
  // Filter chats when search term or chats change
  useEffect(() => {
    if (!searchTerm) {
      setFilteredChats(chats);
      return;
    }
    
    const filtered = chats.filter(chat => 
      chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [searchTerm, chats]);

  const handleCreateChat = () => {
    if (!newChatName.trim() || !onCreateChat) return;
    
    onCreateChat(newChatName.trim(), isGroup);
    
    // Reset form
    setNewChatName("");
    setIsGroup(true);
    setDialogOpen(false);
  };
  
  if (isLoading) {
    return (
      <Card className="w-80 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Chats</h3>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }
  
  // Kiểm tra nếu chỉ có người dùng hiện tại trong workspace
  const hasOnlyCurrentUser = chats.length > 0 && 
    chats.some(chat => chat.isGroup && chat.members?.length === 1);

  return (
    <Card className="w-80 p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">Chats</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new chat</DialogTitle>
              <DialogDescription>
                Create a new chat or group conversation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Chat name</Label>
                <Input
                  id="name"
                  placeholder="Enter chat name"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isGroup" 
                  checked={isGroup}
                  onCheckedChange={() => setIsGroup(!isGroup)}
                />
                <Label htmlFor="isGroup" className="cursor-pointer">Group chat</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateChat}
                disabled={!newChatName.trim() || isCreatingChat}
              >
                {isCreatingChat ? "Creating..." : "Create Chat"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search chats..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {createChatError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {createChatError}
            </div>
          )}
          
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-medium mb-2">
                {searchTerm ? "Không tìm thấy chat nào" : "Bạn chưa có cuộc trò chuyện nào"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm 
                  ? "Thử tìm kiếm với từ khóa khác" 
                  : "Hãy tạo một cuộc trò chuyện mới để bắt đầu"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setDialogOpen(true)} className="mx-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo chat mới
                </Button>
              )}
            </div>
          ) : (
            filteredChats.map((chat) => {
              // Kiểm tra xem chat này có phải là workspace chat với chỉ một thành viên không
              const isSingleUserWorkspaceChat = 
                chat.isGroup && chat.members?.length === 1;
              
              return (
                <div
                  key={chat.$id}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors flex items-center gap-3",
                    selectedChatId === chat.$id && "bg-accent"
                  )}
                  onClick={() => onSelectChat(chat)}
                >
                  <div className="flex-shrink-0">
                    {chat.isGroup ? (
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{chat.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {isSingleUserWorkspaceChat 
                        ? `Chỉ có ${userName}`
                        : chat.members && chat.members.length > 0 && chat.members[0].memberDetails ? 
                          <span>{chat.members.slice(0, 2).map(m => m.memberDetails?.name || "").filter(Boolean).join(", ")}{chat.members.length > 2 ? "..." : ""}</span>
                          : null
                      }
                    </p>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};