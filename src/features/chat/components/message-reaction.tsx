import React, { useState } from 'react';
import { MessageReaction } from '../type';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import { chatApi } from '../api';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Danh sách emoji phổ biến
const COMMON_EMOJIS = ['👍', '❤️', '😂', '😍', '😮', '😢', '👏', '🔥', '🎉', '🤔', '👎', '⚡'];

interface MessageReactionsProps {
  messageId: string;
  chatsId: string;
  reactions: MessageReaction[];
  onReactionChange?: () => void;
}

export const MessageReactions = ({ 
  messageId, 
  chatsId, 
  reactions = [], 
  onReactionChange 
}: MessageReactionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Nhóm reaction theo loại
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const emoji = reaction.reaction;
    if (!acc[emoji]) {
      acc[emoji] = [];
    }
    acc[emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  const handleAddReaction = async (emoji: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await chatApi.addReaction(chatsId, messageId, emoji);
      if (onReactionChange) {
        onReactionChange();
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {/* Hiển thị reactions đã có */}
      {Object.entries(groupedReactions).map(([emoji, users]) => (
        <TooltipProvider key={emoji}>
          <Tooltip content={<p className="text-xs">{users.map(r => r.memberId).join(', ')}</p>}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs rounded-full"
                onClick={() => handleAddReaction(emoji)}
              >
                {emoji} <span className="ml-1">{users.length}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{users.map(r => r.memberId).join(', ')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}

      {/* Nút thêm reaction */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 rounded-full"
            disabled={isLoading}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="grid grid-cols-6 gap-2 p-2">
            {COMMON_EMOJIS.map(emoji => (
              <button
                key={emoji}
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded hover:bg-accent",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
                disabled={isLoading}
                onClick={() => handleAddReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}; 