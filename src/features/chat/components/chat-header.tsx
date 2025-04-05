import React, { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, Users, RefreshCw, UserPlus, Wifi, WifiOff, Image as ImageIcon, Search } from "lucide-react";
import { Chats, ChatMembers } from "../type";
import { RealtimeIndicator } from "./realtime-indicator";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Định nghĩa đơn giản cho indicator realtime
const LiveStatusIndicator = ({ isConnected }: { isConnected: boolean }) => (
  <div className={cn(
    "px-1.5 py-0.5 rounded-full flex items-center gap-1 text-xs ml-2",
    isConnected
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
  )}>
    {isConnected ? (
      <>
        <Wifi className="h-3 w-3" />
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
      </>
    ) : (
      <>
        <WifiOff className="h-3 w-3" />
      </>
    )}
    <span className="text-xs">
      {isConnected ? "Live" : "Offline"}
    </span>
  </div>
);

interface ChatHeaderProps {
  chats?: Chats & { 
    members?: ChatMembers[];
    totalWorkspaceMembers?: number;
  };
  onSyncMembers: () => void;
  onAddAllMembers?: () => void;
  isSyncing: boolean;
  isAddingMembers?: boolean;
  isRealtimeConnected?: boolean;
  onOpenMediaGallery?: () => void;
  onOpenSearch?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chats,
  onSyncMembers,
  onAddAllMembers,
  isSyncing,
  isAddingMembers,
  isRealtimeConnected = false,
  onOpenMediaGallery,
  onOpenSearch
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!chats) return null;

  // Get up to 3 member names to display
  const memberNames = chats.members
    ?.filter(m => m.memberDetails?.name)
    .slice(0, 3)
    .map(m => m.memberDetails?.name)
    .filter(Boolean);

  return (
    <div className="border-b p-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <h3 className="font-medium text-lg truncate">
          {chats?.name || "Chat"}
        </h3>
        
        {/* Hiển thị chỉ báo realtime */}
        <LiveStatusIndicator isConnected={isRealtimeConnected} />
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="text-sm text-muted-foreground mr-2 flex items-center">
          <Users className="h-4 w-4 mr-1" />
          <span>
            {chats?.totalWorkspaceMembers || 0} thành viên
          </span>
        </div>
        
        {/* Nút đồng bộ thành viên */}
        {chats?.isGroup && (
          <Button 
            variant="outline"
            size="sm"
            onClick={onSyncMembers}
            disabled={isSyncing}
            title="Đồng bộ thành viên từ workspace vào nhóm chat"
            className="flex items-center gap-1"
          >
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
            <span className="hidden md:inline ml-1">Cập nhật thành viên từ workspace</span>
          </Button>
        )}
        
        {/* Nút thêm tất cả thành viên (nếu cần) */}
        {onAddAllMembers && (
          <Button 
            variant="outline"
            size="sm"
            onClick={onAddAllMembers}
            disabled={isAddingMembers}
            title="Thêm tất cả thành viên workspace vào chat"
          >
            <UserPlus className={cn("h-4 w-4", isAddingMembers && "animate-spin")} />
          </Button>
        )}
      </div>
      
      {/* Header Actions */}
      <div className="flex items-center gap-2">
        {/* Nút tìm kiếm tin nhắn */}
        {onOpenSearch && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onOpenSearch}
            title="Tìm kiếm tin nhắn"
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
        
        {/* Thêm nút xem media và file */}
        {onOpenMediaGallery && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onOpenMediaGallery}
            title="Xem ảnh và file đã chia sẻ"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
        )}
        
        {/* Dropdown menu button */}
        <div className="relative">
          {/* Dropdown content */}
        </div>
      </div>
    </div>
  );
};