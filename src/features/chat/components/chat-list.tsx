import React, { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Plus, Search, User, UserPlus, Users, MessageSquare, X } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { chatApi } from "../api";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { toast } from "sonner";

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
  userName = "Bạn",
  currentMemberId
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredChats, setFilteredChats] = useState(chats);
  const [activeTab, setActiveTab] = useState<string>("chats");
  
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

  // Filter theo searchTerm - Nếu tìm kiếm thì chuyển sang tab members
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      // Khi nhập tìm kiếm, tự động chuyển sang tab members
      setActiveTab("members");
    }
    
    // Logic lọc chats vẫn giữ nguyên cho trường hợp không có searchTerm
    if (!searchTerm) {
      const uniqueChats = Array.from(
        new Map(chats.map(chat => [chat.$id, chat])).values()
      );
      setFilteredChats(uniqueChats);
    } else {
      // Vẫn lọc chat để giữ chức năng hiện tại
      const uniqueChats = Array.from(
        new Map(chats.map(chat => [chat.$id, chat])).values()
      );
      const filtered = uniqueChats.filter(chat => 
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchTerm, chats]);

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
        <h3 className="font-medium text-lg">Chat</h3>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm thành viên trong nhóm..."
          className="pl-9"
          value={searchTerm}
          onChange={handleSearchChange}
          title="Nhập tên hoặc email để tìm kiếm thành viên"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            title="Xóa tìm kiếm"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <Tabs defaultValue="chats" className="flex-1 flex flex-col" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-2 mb-2">
          <TabsTrigger value="chats">Nhóm chat</TabsTrigger>
          <TabsTrigger value="members">Thành viên</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chats" className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full pr-2">
            <div className="space-y-2">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                      <MessageCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="font-medium mb-2">
                    {searchTerm ? "Không tìm thấy nhóm chat" : "Không có nhóm chat nào"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm 
                      ? "Hãy thử tìm kiếm với từ khóa khác" 
                      : "Nhóm chat sẽ được tạo tự động khi thêm thành viên vào workspace"}
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  // Bỏ qua các chat riêng tư
                  if (!chat.isGroup) return null;
                  
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
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{chat.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Nhóm chat
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
              {/* Hiển thị skeleton khi đang tải */}
              {isMembersLoading && (
                <div className="space-y-4">
                  {searchTerm ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">Đang tìm kiếm thành viên...</p>
                    </div>
                  ) : (
                    [1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Hiển thị khi không có thành viên nào */}
              {!isMembersLoading && membersData?.documents.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    Không có thành viên nào trong workspace
                  </p>
                </div>
              )}

              {/* Hiển thị danh sách thành viên */}
              {!isMembersLoading && membersData?.documents.length > 0 && (() => {
                const filteredMembers = membersData.documents.filter((member: Member) => {
                  if (!searchTerm) return true;
                  // Tìm kiếm trong tên và email
                  return (
                    (member.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                    (member.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
                  );
                });
                
                // Hiển thị thông báo nếu không có kết quả
                if (searchTerm && filteredMembers.length === 0) {
                  return (
                    <div className="p-8 text-center">
                      <div className="mb-4 flex justify-center">
                        <div className="h-14 w-14 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-7 w-7 text-muted-foreground" />
                        </div>
                      </div>
                      <h3 className="font-medium mb-2">Không tìm thấy thành viên</h3>
                      <p className="text-sm text-muted-foreground">
                        Không tìm thấy thành viên nào khớp với "{searchTerm}"
                      </p>
                    </div>
                  );
                }
                
                // Hiển thị danh sách thành viên được lọc
                return filteredMembers.map((member: Member) => {
                  // Highlight phần text khớp với từ khóa tìm kiếm
                  const highlightText = (text: string = "") => {
                    if (!searchTerm) return text;
                    const regex = new RegExp(`(${searchTerm})`, 'gi');
                    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900">$1</mark>');
                  };

                  return (
                    <div
                      key={member.$id}
                      className="p-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-3 cursor-pointer"
                      onClick={() => {
                        // Mở chat với thành viên này
                        const groupChat = chats.find(chat => chat.isGroup === true);
                        if (groupChat) {
                          onSelectChat(groupChat);
                          // Có thể thêm logic scroll đến tin nhắn của thành viên này trong tương lai
                        }
                        // Xóa từ khóa tìm kiếm sau khi đã chọn thành viên
                        setSearchTerm("");
                      }}
                    >
                      <div className="flex-shrink-0">
                        <Avatar className="h-10 w-10">
                          <div className="bg-primary/10 text-primary w-full h-full flex items-center justify-center font-medium uppercase">
                            {member.name?.charAt(0) || "U"}
                          </div>
                        </Avatar>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-medium truncate"
                          dangerouslySetInnerHTML={{ __html: highlightText(member.name) }}
                        />
                        <div className="text-xs text-muted-foreground truncate">
                          <span dangerouslySetInnerHTML={{ __html: highlightText(member.email) }} />
                          {member.$id === currentMemberId && " (Bạn)"}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
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
    prevProps.currentMemberId === nextProps.currentMemberId &&
    // Kiểm tra sâu hơn cho mảng chats bằng cách so sánh độ dài và id
    prevProps.chats.length === nextProps.chats.length &&
    prevProps.chats.every((chat, index) => 
      chat.$id === nextProps.chats[index].$id
    )
  );
});