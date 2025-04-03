import React, { useEffect, useState } from 'react';
import { Messages } from '../type';
import { chatApi } from '../api';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerTrigger } from '@/components/ui/drawer';
import { PinIcon, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PinnedMessagesProps {
  chatsId: string;
}

export const PinnedMessagesButton = ({ chatsId }: PinnedMessagesProps) => {
  const [pinnedMessages, setPinnedMessages] = useState<Messages[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load pinned messages
  const loadPinnedMessages = async () => {
    if (!chatsId) return;
    
    setIsLoading(true);
    try {
      const response = await chatApi.getPinnedMessages(chatsId);
      if (response.data?.documents) {
        setPinnedMessages(response.data.documents);
      }
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load when chat changes or drawer opens
  useEffect(() => {
    if (isOpen) {
      loadPinnedMessages();
    }
  }, [chatsId, isOpen]);

  // Handle unpinning a message
  const handleUnpin = async (messageId: string) => {
    try {
      await chatApi.pinMessage(chatsId, messageId, false);
      // Remove from local state
      setPinnedMessages(prev => prev.filter(msg => msg.$id !== messageId));
    } catch (error) {
      console.error('Failed to unpin message:', error);
    }
  };

  // If no pinned messages and not loading, don't render
  if (pinnedMessages.length === 0 && !isLoading && !isOpen) {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2"
        >
          <PinIcon className="h-4 w-4" />
          <span>{pinnedMessages.length || ''}</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Tin nhắn đã ghim</DrawerTitle>
          <DrawerClose className="absolute right-4 top-4">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DrawerClose>
        </DrawerHeader>
        {isLoading ? (
          <div className="p-4">Đang tải tin nhắn...</div>
        ) : pinnedMessages.length === 0 ? (
          <div className="p-4 text-muted-foreground">Không có tin nhắn đã ghim</div>
        ) : (
          <ScrollArea className="h-[50vh]">
            <div className="p-4 space-y-4">
              {pinnedMessages.map(message => (
                <div key={message.$id} className="relative p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">Người gửi: {message.memberId}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {message.CreatedAt && formatDistanceToNow(new Date(message.CreatedAt), {
                          addSuffix: true,
                          locale: vi
                        })}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleUnpin(message.$id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm">
                    {message.content}
                    {message.imageUrl && (
                      <img 
                        src={message.imageUrl} 
                        alt="Attached image" 
                        className="mt-2 max-h-40 rounded object-cover" 
                      />
                    )}
                    {message.fileUrl && !message.imageUrl && (
                      <a 
                        href={message.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-2 text-blue-500 hover:underline block"
                      >
                        {message.fileName || "Xem tệp đính kèm"}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DrawerContent>
    </Drawer>
  );
}; 