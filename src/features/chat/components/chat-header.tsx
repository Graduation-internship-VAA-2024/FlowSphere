import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

export const ChatHeader = () => {
  return (
    <div className="p-4 border-b flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar />
        <div>
          <h3 className="font-medium">Chat Room</h3>
          <p className="text-sm text-neutral-500">3 members • Active now</p>
        </div>
      </div>
      <Button variant="ghost" size="icon">
        <MoreVertical className="h-5 w-5" />
      </Button>
    </div>
  );
};