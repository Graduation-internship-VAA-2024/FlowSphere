import { useEffect, useState } from 'react';
import { Client, Databases, RealtimeResponseEvent } from 'appwrite';
import { useInterval } from '@/hooks/use-interval';
import { DATABASE_ID, MESSAGES_ID } from '@/config';

// Hook để lắng nghe tin nhắn realtime cho Direct Messages
export function useRealtimeDM({
  chatsId,
  onNewMessage,
  interval = 8000,
  enabled = true,
}: {
  chatsId: string | null;
  onNewMessage: (message: any) => void;
  interval?: number;
  enabled?: boolean;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  // Kết nối realtime khi component mount
  useEffect(() => {
    if (!enabled || !chatsId) {
      setIsConnected(false);
      return;
    }

    // Khởi tạo client AppWrite realtime và database
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT || '');

    const databases = new Databases(client);
    setClient(client);

    // Đăng ký lắng nghe sự kiện realtime cho chat
    const unsubscribe = client.subscribe<RealtimeResponseEvent<any>>(
      `databases.${DATABASE_ID}.collections.${MESSAGES_ID}.documents`,
      (response) => {
        // Chỉ xử lý tin nhắn mới được tạo
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          const message = response.payload as any;
          
          // Chỉ xử lý tin nhắn thuộc chat hiện tại
          if (message && message.chatsId === chatsId) {
            console.log('DM hook received new message:', message);
            setLastMessageId(message.$id);
            onNewMessage(message);
          }
        }
      }
    );

    setIsConnected(true);
    console.log(`Connected to realtime for Direct Message chat: ${chatsId}`);

    // Cleanup function
    return () => {
      console.log(`Disconnecting from realtime for chat: ${chatsId}`);
      unsubscribe();
      setIsConnected(false);
    };
  }, [chatsId, onNewMessage, enabled]);

  // Fallback polling mechanism for when realtime is not working
  useInterval(
    async () => {
      if (!chatsId || !enabled || isConnected) return;
      
      try {
        setIsPolling(true);
        console.log('Polling for new direct messages...');
        
        // Fetch tin nhắn mới nhất
        const response = await fetch(`/api/chats/${chatsId}/messages`);
        const data = await response.json();
        
        if (data.data?.documents && Array.isArray(data.data.documents)) {
          // Sắp xếp tin nhắn theo thời gian tạo
          const messages = data.data.documents.sort((a: any, b: any) => {
            const timeA = new Date(a.CreatedAt || a.$createdAt).getTime();
            const timeB = new Date(b.CreatedAt || b.$createdAt).getTime();
            return timeB - timeA; // Sắp xếp giảm dần (mới nhất lên đầu)
          });
          
          // Nếu có tin nhắn mới
          if (messages.length > 0 && messages[0].$id !== lastMessageId) {
            console.log('Found new direct message via polling');
            setLastMessageId(messages[0].$id);
            onNewMessage(messages[0]);
          }
        }
      } catch (error) {
        console.error('Error polling for new direct messages:', error);
      } finally {
        setIsPolling(false);
      }
    },
    !isConnected && enabled ? interval : null
  );

  return {
    isConnected,
    isPolling,
  };
} 