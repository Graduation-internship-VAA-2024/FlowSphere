import React, { useEffect, useState } from 'react';
import { chatApi } from '../api';
import { TypingIndicator } from '../type';
import { appwriteClient } from '@/lib/appwrite-client';
import { DATABASE_ID } from '@/config';

interface TypingIndicatorProps {
  chatsId: string;
  memberId: string;
  typingTimeout?: number; // Thời gian hiển thị trạng thái đang gõ (ms)
}

// Component hiển thị trạng thái đang gõ
export const TypingIndicatorDisplay = ({ 
  chatsId, 
  memberId,
  typingTimeout = 3000 // Default 3 giây
}: TypingIndicatorProps) => {
  const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; timestamp: Date }>>({});
  
  // Xử lý sự kiện nhận được từ realtime
  const handleTypingEvent = (data: any) => {
    if (data.chatsId === chatsId && data.memberId !== memberId) {
      if (data.isTyping) {
        // Thêm người dùng vào danh sách đang gõ
        setTypingUsers(prev => ({
          ...prev,
          [data.memberId]: {
            name: data.memberName || 'Someone',
            timestamp: new Date(data.timestamp)
          }
        }));
      } else {
        // Xóa người dùng khỏi danh sách đang gõ
        setTypingUsers(prev => {
          const newState = { ...prev };
          delete newState[data.memberId];
          return newState;
        });
      }
    }
  };
  
  // Subscribe vào sự kiện typing từ server
  useEffect(() => {
    if (!chatsId) return;
    
    console.log(`🔄 Subscribing to typing events for chat ${chatsId}...`);
    
    // Kênh realtime cho các sự kiện typing
    const typingChannel = `databases.${DATABASE_ID}.typing.${chatsId}`;
    
    // Đăng ký lắng nghe sự kiện realtime
    const unsubscribe = appwriteClient.subscribe(typingChannel, (response) => {
      console.log('Typing event received:', response);
      
      if (response && response.payload) {
        handleTypingEvent(response.payload);
      }
    });
    
    // Đăng ký theo chatsId để nhận toàn bộ sự kiện của chat
    const chatChannel = `databases.${DATABASE_ID}.documents`;
    
    const unsubscribeChat = appwriteClient.subscribe(chatChannel, (response) => {
      if (response && response.payload) {
        const payload = response.payload as any;
        if (payload.chatsId === chatsId) {
          // Kiểm tra xem có phải là sự kiện typing không
          if (payload.isTyping !== undefined) {
            console.log('Typing event from chat channel:', payload);
            handleTypingEvent(payload);
          }
        }
      }
    });
    
    // Clean up typing status sau một khoảng thời gian
    const interval = setInterval(() => {
      const now = new Date();
      setTypingUsers(prev => {
        const newState = { ...prev };
        let hasChanges = false;
        
        Object.entries(newState).forEach(([memberId, data]) => {
          const diff = now.getTime() - new Date(data.timestamp).getTime();
          if (diff > typingTimeout) {
            delete newState[memberId];
            hasChanges = true;
          }
        });
        
        return hasChanges ? newState : prev;
      });
    }, 1000);
    
    return () => {
      unsubscribe();
      unsubscribeChat();
      clearInterval(interval);
    };
  }, [chatsId, memberId, typingTimeout]);
  
  // Danh sách người đang gõ
  const typingUsersList = Object.values(typingUsers);
  
  if (typingUsersList.length === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center text-xs text-muted-foreground italic px-4 py-1 animate-pulse">
      {typingUsersList.length === 1 ? (
        <p>{typingUsersList[0].name} đang gõ...</p>
      ) : (
        <p>{typingUsersList.length} người đang gõ...</p>
      )}
      <span className="ml-1">
        <span className="typing-dot">.</span>
        <span className="typing-dot">.</span>
        <span className="typing-dot">.</span>
      </span>
    </div>
  );
};

// Hook để quản lý trạng thái đang gõ
export function useTypingStatus(chatsId: string, memberId: string) {
  const [isTyping, setIsTyping] = useState(false);
  const [lastTyped, setLastTyped] = useState<number | null>(null);
  
  // Hàm gửi trạng thái đang gõ lên server
  const sendTypingStatus = async (typing: boolean) => {
    try {
      if (!chatsId || !memberId) return;
      
      console.log(`Sending typing status (${typing}) for chat ${chatsId}, member ${memberId}`);
      await chatApi.updateTypingStatus(chatsId, memberId, typing);
    } catch (error) {
      console.error('Failed to update typing status:', error);
    }
  };
  
  // Hàm được gọi khi người dùng gõ
  const handleTyping = () => {
    const now = Date.now();
    
    // Nếu chưa từng gõ hoặc đã qua 2 giây kể từ lần gõ cuối
    if (!lastTyped || now - lastTyped > 2000) {
      setIsTyping(true);
      sendTypingStatus(true);
      
      // Sau 3 giây không gõ, tự động gửi trạng thái không gõ nữa
      setTimeout(() => {
        setIsTyping(false);
        sendTypingStatus(false);
      }, 3000);
    }
    
    setLastTyped(now);
  };
  
  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        sendTypingStatus(false);
      }
    };
  }, [isTyping, chatsId, memberId]);
  
  return {
    handleTyping,
    isTyping
  };
} 