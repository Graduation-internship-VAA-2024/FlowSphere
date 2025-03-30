import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { format } from "date-fns";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
    isCurrentUser?: boolean;
  };
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      message.isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-8 w-8" />
      <div className={cn(
        "flex flex-col max-w-[70%]",
        message.isCurrentUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-2xl p-3",
          "transform transition-all duration-200 hover:scale-[1.02]",
          message.isCurrentUser 
            ? "bg-primary text-primary-foreground rounded-br-none" 
            : "bg-muted rounded-bl-none"
        )}>
          <p className="text-sm">{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {format(message.timestamp, 'HH:mm')}
        </span>
      </div>
    </div>
  );
};
