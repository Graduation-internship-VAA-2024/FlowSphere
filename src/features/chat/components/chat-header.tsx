import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, Users, RefreshCw } from "lucide-react";
import { Chats, ChatMembers } from "../type";

interface ChatHeaderProps {
  chats?: Chats & { members?: ChatMembers[] };
  onSyncMembers?: () => void;
  isSyncing?: boolean;
}

export const ChatHeader = ({ chats, onSyncMembers, isSyncing }: ChatHeaderProps) => {
  if (!chats) return null;

  return (
    <div className="p-4 border-b flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar />
        <div>
          <h3 className="font-medium">{chats.name}</h3>
          <p className="text-sm text-neutral-500">
            {chats.members ? `${chats.members.length} members` : ''} • 
            {chats.isGroup ? ' Group chat' : ' Direct message'}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {chats.isGroup && onSyncMembers && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSyncMembers}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Members
          </Button>
        )}
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};