import React, { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Plus, Search, User, UserPlus, Users, MessageSquare } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { chatApi } from "../api";
import { useGetMembers } from "@/features/members/api/use-get-members";

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
  currentMemberId?: string;
}

// Thêm interface định nghĩa kiểu dữ liệu cho Member
interface Member {
  $id: string;
  name?: string;
  email?: string;
  userId?: string;
  workspaceId?: string;
  role?: string;
}

export const ChatList: React.FC<ChatListProps> = React.memo(({
  workspaceId,
  chats,
  isLoading,
  selectedChatId,
  onSelectChat,
  onCreateChat,
  isCreatingChat = false,
  createChatError = null,
  userName = "Bạn",
  currentMemberId
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredChats, setFilteredChats] = useState(chats);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [isGroup, setIsGroup] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("chats");
  const [isCreatingDirectChat, setIsCreatingDirectChat] = useState(false);
  
  // Tối ưu hook useGetMembers bằng cách thêm memo và tránh re-fetch
  const { data: membersData, isLoading: isMembersLoading } = useGetMembers({ 
    workspaceId,
    enabled: activeTab === "members" // Chỉ fetch khi tab members được chọn
  });
  
  // Filter chats when search term or chats change - tối ưu sử dụng useMemo
  useEffect(() => {
    if (!searchTerm) {
      // Loại bỏ các chat trùng lặp theo $id trước khi cập nhật state
      const uniqueChats = Array.from(
        new Map(chats.map(chat => [chat.$id, chat])).values()
      );
      setFilteredChats(uniqueChats);
      return;
    }
    
    // Lọc chat sau khi đã loại bỏ trùng lặp
    const uniqueChats = Array.from(
      new Map(chats.map(chat => [chat.$id, chat])).values()
    );
    const filtered = uniqueChats.filter(chat => 
      chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [searchTerm, chats]);

  // Tối ưu các hàm xử lý sự kiện bằng useCallback để tránh re-render không cần thiết
  const handleCreateChat = useCallback(() => {
    if (!newChatName.trim() || !onCreateChat) return;
    
    onCreateChat(newChatName.trim(), isGroup);
    
    // Reset form
    setNewChatName("");
    setIsGroup(true);
    setDialogOpen(false);
  }, [newChatName, isGroup, onCreateChat]);
  
  // Hàm tạo chat trực tiếp với một thành viên
  const handleCreateDirectChat = useCallback(async (member: Member) => {
    if (!member || !currentMemberId || isCreatingDirectChat) return;
    
    setIsCreatingDirectChat(true);
    console.log("Đang tạo chat trực tiếp với:", member.name);
    
    try {
      // Kiểm tra xem đã có chat trực tiếp giữa hai người dùng chưa
      const existingChat = chats.find(chat => {
        // Chat không phải là nhóm và chỉ có 2 thành viên
        if (!chat.isGroup && chat.members && chat.members.length === 2) {
          // Kiểm tra xem có cả hai thành viên trong chat không
          const hasBothMembers = chat.members.some(m => m.memberId === currentMemberId) &&
                                  chat.members.some(m => m.memberId === member.$id);
          return hasBothMembers;
        }
        return false;
      });
      
      if (existingChat) {
        // Nếu chat đã tồn tại, chọn chat đó
        console.log("Đã tìm thấy chat hiện có, chuyển đến chat");
        onSelectChat(existingChat);
        // Chuyển về tab chat sau khi chọn
        setActiveTab("chats");
      } else {
        // Nếu chưa có, tạo chat mới
        const chatName = `${userName} & ${member.name || "Người dùng"}`;
        console.log("Tạo chat mới:", chatName);
        
        // Gọi API tạo chat
        if (onCreateChat) {
          onCreateChat(chatName, false);
          // Chuyển về tab chat sau khi tạo
          setActiveTab("chats");
        } else {
          console.error("Không thể tạo chat: onCreateChat không được định nghĩa");
        }
      }
    } catch (error) {
      console.error("Lỗi khi tạo chat trực tiếp:", error);
      alert("Có lỗi xảy ra khi tạo chat trực tiếp, vui lòng thử lại sau");
    } finally {
      setIsCreatingDirectChat(false);
    }
  }, [chats, currentMemberId, isCreatingDirectChat, onCreateChat, onSelectChat, userName]);
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);
  
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
          onChange={handleSearchChange}
        />
      </div>
      
      <Tabs defaultValue="chats" className="flex-1 flex flex-col" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-2 mb-2">
          <TabsTrigger value="chats">Nhóm chat</TabsTrigger>
          <TabsTrigger value="members">Thành viên</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chats" className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full pr-2">
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
                        <div className="font-medium truncate">{chat.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {chat.isGroup
                            ? `${chat.members?.length || 0} thành viên`
                            : "Tin nhắn riêng tư"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="members" className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full pr-2">
            <div className="space-y-2">
              {isMembersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : membersData?.documents.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    Không có thành viên nào trong workspace
                  </p>
                </div>
              ) : (
                membersData?.documents.map((member: Member) => {
                  // Bỏ qua thành viên hiện tại
                  if (member.$id === currentMemberId) return null;
                  
                  return (
                    <div
                      key={member.$id}
                      className="p-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                    >
                      <div className="flex-shrink-0">
                        <Avatar className="h-10 w-10">
                          <div className="bg-primary/10 text-primary w-full h-full flex items-center justify-center font-medium uppercase">
                            {member.name?.charAt(0) || "U"}
                          </div>
                        </Avatar>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{member.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </div>
                      </div>
                      
                      {/* Nút nhắn tin riêng */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateDirectChat(member);
                        }}
                        disabled={isCreatingDirectChat}
                        title="Nhắn tin riêng"
                      >
                        {isCreatingDirectChat ? (
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Cải tiến kiểm tra cập nhật để tránh re-render không cần thiết
  return (
    prevProps.workspaceId === nextProps.workspaceId &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.selectedChatId === nextProps.selectedChatId &&
    prevProps.isCreatingChat === nextProps.isCreatingChat &&
    prevProps.createChatError === nextProps.createChatError &&
    prevProps.currentMemberId === nextProps.currentMemberId &&
    // Kiểm tra sâu hơn cho mảng chats bằng cách so sánh độ dài và id
    prevProps.chats.length === nextProps.chats.length &&
    prevProps.chats.every((chat, index) => 
      chat.$id === nextProps.chats[index].$id
    )
  );
});