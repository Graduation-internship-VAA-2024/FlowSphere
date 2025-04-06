import React, { useEffect, useState, useRef } from 'react';
import { MessageRead } from '../type';
import { Check, CheckCheck } from 'lucide-react';
import { chatApi } from '../api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MessageReadStatusProps {
  messageId: string;
  chatsId: string;
  memberId: string;
  totalMembers: number;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
  isLatestMessage?: boolean; // Thêm prop để biết đây có phải tin nhắn mới nhất không
}

// Tạo cache để tránh gọi API lặp lại cho cùng một tin nhắn
const readStatusCache = new Map<string, {
  reads: MessageRead[],
  timestamp: number,
  allRead: boolean
}>();

// Thời gian cache hợp lệ (30 giây)
const CACHE_VALIDITY = 30 * 1000; 

export const MessageReadStatus = ({ 
  messageId, 
  chatsId, 
  memberId, 
  totalMembers,
  createdAt,
  status,
  isLatestMessage = false
}: MessageReadStatusProps) => {
  const [reads, setReads] = useState<MessageRead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageStatus, setMessageStatus] = useState<'sending' | 'sent' | 'delivered' | 'read'>(status || 'sending');
  const [isVisible, setIsVisible] = useState(false);
  const [isAllRead, setIsAllRead] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasMarkedAsRead = useRef(false);

  // Sử dụng IntersectionObserver để phát hiện khi tin nhắn hiển thị trên màn hình
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }, { threshold: 0.1 });
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);

  // Mark current message as read when viewed - chỉ cho tin nhắn mới nhất
  useEffect(() => {
    // Chỉ đánh dấu đã đọc khi tin nhắn hiển thị trên màn hình và chưa được đánh dấu trước đó
    if (isVisible && !hasMarkedAsRead.current && isLatestMessage) {
      const markAsRead = async () => {
        try {
          await chatApi.markMessageAsRead(chatsId, messageId);
          hasMarkedAsRead.current = true;
        } catch (error) {
          console.error('Failed to mark message as read:', error);
        }
      };
      
      markAsRead();
    }
  }, [messageId, chatsId, isVisible, isLatestMessage]);

  // Fetch read status
  useEffect(() => {
    // Kiểm tra nếu messageId bắt đầu bằng 'temp-' thì chưa thực sự gửi
    if (messageId.startsWith('temp-')) {
      setMessageStatus('sending');
      return;
    }

    // Nếu tin nhắn không hiển thị trên màn hình, không cần fetch
    if (!isVisible) return;
    
    // Nếu đã biết tất cả đã đọc, không cần fetch lại
    if (isAllRead) return;
    
    // Check cache first
    const cacheKey = `${chatsId}-${messageId}`;
    const cachedData = readStatusCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp < CACHE_VALIDITY)) {
      // Dùng dữ liệu từ cache nếu còn hiệu lực
      setReads(cachedData.reads);
      setIsAllRead(cachedData.allRead);
      
      // Cập nhật trạng thái dựa trên dữ liệu cache
      if (cachedData.reads.length === 0) {
        setMessageStatus('sent');
      } else if (cachedData.reads.length < totalMembers - 1) {
        setMessageStatus('delivered');
      } else {
        setMessageStatus('read');
        setIsAllRead(true);
      }
      
      return;
    }

    const fetchReadStatus = async () => {
      // Tránh fetch nếu đang loading hoặc tin nhắn đã được đọc bởi tất cả
      if (isLoading || isAllRead) return;
      
      setIsLoading(true);
      try {
        const response = await chatApi.getMessageReads(chatsId, messageId);
        if (response.data?.documents) {
          const readRecords = response.data.documents;
          setReads(readRecords);
          
          // Cập nhật trạng thái tin nhắn
          if (readRecords.length === 0) {
            setMessageStatus('sent'); // Đã gửi nhưng chưa ai đọc
          } else if (readRecords.length < totalMembers - 1) {
            setMessageStatus('delivered'); // Có người đã đọc nhưng chưa phải tất cả
          } else {
            setMessageStatus('read'); // Tất cả đã đọc
            setIsAllRead(true);
          }
          
          // Cập nhật cache
          const allRead = readRecords.length >= totalMembers - 1;
          readStatusCache.set(cacheKey, {
            reads: readRecords,
            timestamp: Date.now(),
            allRead
          });
        }
      } catch (error) {
        console.error('Failed to fetch read status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadStatus();

    // Chỉ set up interval khi tin nhắn hiển thị và chưa được đọc bởi tất cả
    let intervalId: NodeJS.Timeout | null = null;
    if (isVisible && !isAllRead) {
      intervalId = setInterval(fetchReadStatus, 30000); // 30 giây thay vì 10 giây
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [messageId, chatsId, totalMembers, isVisible, isAllRead, isLoading]);

  // Do not render for messages we received
  if (!messageId || reads.some(read => read.memberId === memberId)) {
    return null;
  }

  const readCount = reads.length;

  // Calculate time difference since message sent
  const getTimeSinceSent = () => {
    const now = new Date();
    const sentTime = new Date(createdAt);
    const diffMs = now.getTime() - sentTime.getTime();
    
    // Convert to appropriate time unit
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${Math.round(diffHours / 24)} days ago`;
    }
  };

  return (
    <span ref={containerRef} className="ml-1 text-muted-foreground inline-flex items-center">
      {messageStatus === 'sending' && (
        <span className="text-[10px] italic">Sending...</span>
      )}
      {messageStatus === 'sent' && (
        <span className="text-[10px] italic">Sent {getTimeSinceSent()}</span>
      )}
      {messageStatus === 'delivered' && (
        <span className="text-[10px] italic">Delivered</span>
      )}
      {messageStatus === 'read' && (
        <span className="text-[10px] italic text-blue-500">Read</span>
      )}
    </span>
  );
}; 