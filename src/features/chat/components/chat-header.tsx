import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Search, Users, WifiOff } from "lucide-react";

interface ChatHeaderProps {
  name: string;
  isGroup?: boolean;
  membersCount?: number;
  totalWorkspaceMembers?: number;
  uniqueMembersCount?: number;
  onToggleMediaGallery?: () => void;
  isMediaGalleryOpen?: boolean;
  onSearch?: () => void;
  syncNotification?: string | null;
  isRealtimeConnected?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  isGroup,
  membersCount = 0,
  totalWorkspaceMembers = 0,
  uniqueMembersCount,
  onToggleMediaGallery,
  isMediaGalleryOpen,
  onSearch,
  syncNotification,
  isRealtimeConnected = true,
}) => {
  return (
    <div className="border-b flex justify-between items-center py-2 px-3">
      <div className="flex items-center space-x-2">
        <h3 className="font-medium text-lg truncate">{name || ""}</h3>

        {/* Hiển thị thông tin về nhóm */}
        {isGroup && (
          <div className="flex items-center text-xs text-muted-foreground ml-2">
            <Users className="h-3.5 w-3.5 mr-1" />
            <span>{uniqueMembersCount || membersCount} members</span>
          </div>
        )}

        {/* Hiển thị trạng thái kết nối realtime */}
        {!isRealtimeConnected && (
          <div className="ml-2 flex items-center text-xs text-amber-500">
            <WifiOff className="h-3.5 w-3.5 mr-1" />
            <span>Offline</span>
          </div>
        )}

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
            title={
              isMediaGalleryOpen
                ? "Close media gallery"
                : "View shared images and files"
            }
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
