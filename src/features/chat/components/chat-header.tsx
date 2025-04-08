import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Search } from "lucide-react";

interface ChatHeaderProps {
  name: string;
  onToggleMediaGallery?: () => void;
  isMediaGalleryOpen?: boolean;
  onSearch?: () => void;
  syncNotification?: string | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  onToggleMediaGallery,
  isMediaGalleryOpen,
  onSearch,
  syncNotification,
}) => {
  return (
    <div className="border-b p-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <h3 className="font-medium text-lg truncate ml-8">{name || "Chat"}</h3>

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
