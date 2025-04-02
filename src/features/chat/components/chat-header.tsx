import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, Users, RefreshCw, UserPlus } from "lucide-react";
import { Chats, ChatMembers } from "../type";

interface ChatHeaderProps {
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
  onSyncMembers?: () => void;
  onAddAllMembers?: () => void;
  isSyncing?: boolean;
  isAddingMembers?: boolean;
}

export const ChatHeader = ({ 
  chats, 
  onSyncMembers, 
  onAddAllMembers,
  isSyncing,
  isAddingMembers 
}: ChatHeaderProps) => {
  if (!chats) return null;

  // Get up to 3 member names to display
  const memberNames = chats.members
    ?.filter(m => m.memberDetails?.name)
    .slice(0, 3)
    .map(m => m.memberDetails?.name)
    .filter(Boolean);

  return (
    <div className="p-4 border-b flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar />
        <div>
          <h3 className="font-medium">{chats.name}</h3>
          <p className="text-sm text-neutral-500">
            {chats.totalWorkspaceMembers ? `${chats.totalWorkspaceMembers} thành viên` : chats.members ? `${chats.members.length} thành viên` : ''} • 
            {chats.isGroup ? ' Group chat' : ' Direct message'}
            {memberNames && memberNames.length > 0 && (
              <span className="block text-xs mt-0.5 text-muted-foreground">
                {memberNames.join(", ")}{chats.members && chats.members.length > 3 ? "..." : ""}
              </span>
            )}
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