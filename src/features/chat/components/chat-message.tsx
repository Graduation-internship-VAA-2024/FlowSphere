import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Messages } from "../type";
import { useMemo } from "react";
import { useParams } from "next/navigation";

interface ChatMessageProps {
  message: Messages;
  currentMemberId: string;
}

export const ChatMessage = ({ message, currentMemberId }: ChatMessageProps) => {
  const isCurrentUser = useMemo(() => {
    return message.memberId === currentMemberId;
  }, [message.memberId, currentMemberId]);

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-8 w-8" />
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-2xl p-3",
          "transform transition-all duration-200 hover:scale-[1.02]",
          isCurrentUser 
            ? "bg-primary text-primary-foreground rounded-br-none" 
            : "bg-muted rounded-bl-none"
        )}>
          {message.content && <p className="text-sm">{message.content}</p>}
          {message.imageUrl && (
            <img 
              src={message.imageUrl} 
              alt="Image" 
              className="max-w-full rounded"
            />
          )}
          {message.fileUrl && !message.imageUrl && (
            <a 
              href={message.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              View attached file
            </a>
          )}
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {message.createdAt ? format(new Date(message.createdAt), 'HH:mm') : ''}
        </span>
      </div>
    </div>
  );
};