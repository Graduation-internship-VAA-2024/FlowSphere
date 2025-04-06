import React, { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, Users, Wifi, WifiOff, Image as ImageIcon, Search } from "lucide-react";
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
  name: string;
  isGroup?: boolean;
  membersCount: number;
  totalWorkspaceMembers: number;
  onSyncMembers?: () => void;
  onAddAllMembers?: () => void;
  isSyncing?: boolean;
  isAddingMembers?: boolean;
  isRealtimeConnected?: boolean;
  onToggleMediaGallery?: () => void;
  isMediaGalleryOpen?: boolean;
  onSearch?: () => void;
  syncNotification?: string | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  isGroup = false,
  membersCount,
  totalWorkspaceMembers,
  onSyncMembers,
  onAddAllMembers,
  isSyncing,
  isAddingMembers,
  isRealtimeConnected = false,
  onToggleMediaGallery,
  isMediaGalleryOpen,
  onSearch,
  syncNotification
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="border-b p-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <h3 className="font-medium text-lg truncate ml-8">
          {name || "Chat"}
        </h3>
        
        {/* Hiển thị thông báo đồng bộ */}
        {syncNotification && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full ml-2">
            {syncNotification}
          </div>
        )}
      </div>
      
      {/* Header Actions */}
      <div className="flex items-center gap-2">
        {/* Nút tìm kiếm tin nhắn */}
        {onSearch && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onSearch}
            title="Search messages"
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
        
        {/* Thêm nút xem media và file */}
        {onToggleMediaGallery && (
          <Button
            variant={isMediaGalleryOpen ? "primary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onToggleMediaGallery}
            title={isMediaGalleryOpen ? "Close media gallery" : "View shared images and files"}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};