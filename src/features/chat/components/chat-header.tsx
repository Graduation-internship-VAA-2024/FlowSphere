import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, Users, RefreshCw, UserPlus, Wifi, WifiOff } from "lucide-react";
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
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chats,
  onSyncMembers,
  onAddAllMembers,
  isSyncing,
  isAddingMembers,
  isRealtimeConnected = false
}) => {
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
            {chats?.members?.length || 0}
            {chats?.totalWorkspaceMembers && ` / ${chats.totalWorkspaceMembers}`}
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
            <span className="hidden md:inline ml-1">Cập nhật thành viên</span>
            {chats.totalWorkspaceMembers && chats.members && 
              chats.totalWorkspaceMembers !== chats.members.length && (
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100 w-4 h-4 inline-flex items-center justify-center rounded-full text-xs">
                  !
                </span>
            )}
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
    </div>
  );
};