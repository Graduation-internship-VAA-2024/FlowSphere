import { useEffect, useState, useRef, useCallback } from "react";
import { appwriteClient } from "@/lib/appwrite-client";
import { MESSAGES_ID, DATABASE_ID } from "@/config";

interface RealtimeMessage {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  chatsId: string;
  memberId: string;
  content?: string;
  fileUrl?: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  CreatedAt: string;
  senderName?: string;
}

interface RealtimeResponse {
  events: string[];
  payload: RealtimeMessage;
}

export function useRealtimeMessages(chatId: string | null, onNewMessage?: (message: RealtimeMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const lastMessageTimestampRef = useRef<number>(0);
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const isConnectingRef = useRef<boolean>(false);
  const messageQueueRef = useRef<RealtimeMessage[]>([]);
  const connectionReadyRef = useRef<boolean>(false);
  
  // Fetch member name asynchronously
  const fetchMemberName = useCallback(async (memberId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/members/${memberId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.name) {
          return data.data.name;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching member name:", error);
      return null;
    }
  }, []);
  
  // Process received message
  const processMessage = useCallback(async (payload: RealtimeMessage) => {
    if (!payload || !payload.chatsId || !payload.$id) {
      console.warn("⚠️ Nhận được payload không hợp lệ:", payload);
      return null;
    }
    
    // Kiểm tra kết nối WebSocket - nếu không kết nối, đưa vào hàng đợi
    if (!connectionReadyRef.current) {
      console.log(`⏳ Kết nối chưa sẵn sàng, đưa tin nhắn vào hàng đợi: ${payload.$id}`);
      messageQueueRef.current.push(payload);
      return null;
    }
    
    // Fix: Add a more unique ID for checking processed messages
    const messageUniqueId = `${payload.$id}_${new Date(payload.$createdAt || payload.CreatedAt).getTime()}`;
    
    // Kiểm tra xem tin nhắn đã được xử lý chưa
    if (processedMessagesRef.current.has(messageUniqueId)) {
      console.log(`⏭️ Bỏ qua tin nhắn đã xử lý: ${payload.$id}`);
      return null;
    }
    
    console.log(`⭐ Xử lý tin nhắn: ${payload.$id} cho chat ${payload.chatsId}`);
    
    // Đánh dấu tin nhắn đã được xử lý
    processedMessagesRef.current.add(messageUniqueId);
    
    // Check if message has timestamp
    const messageTimestamp = new Date(payload.$createdAt || payload.CreatedAt).getTime();
    
    // Skip if this is an old message we've already processed
    if (messageTimestamp <= lastMessageTimestampRef.current && lastMessageTimestampRef.current > 0) {
      console.log("⏭️ Bỏ qua tin nhắn cũ:", payload.$id);
      return null;
    }
    
    // Update last message timestamp
    lastMessageTimestampRef.current = messageTimestamp;
    
    // Add sender name if missing
    if (!payload.senderName && payload.memberId) {
      const name = await fetchMemberName(payload.memberId);
      if (name) {
        payload.senderName = name;
      }
    }
    
    // Return processed message
    return payload;
  }, [fetchMemberName]);
  
  // Process queued messages when connection is ready
  const processQueuedMessages = useCallback(() => {
    if (messageQueueRef.current.length > 0 && connectionReadyRef.current) {
      console.log(`🔄 Xử lý ${messageQueueRef.current.length} tin nhắn trong hàng đợi`);
      
      // Tạo bản sao của hàng đợi
      const queuedMessages = [...messageQueueRef.current];
      // Xóa hàng đợi
      messageQueueRef.current = [];
      
      // Xử lý từng tin nhắn trong hàng đợi
      queuedMessages.forEach(async (message) => {
        const processedMessage = await processMessage(message);
        if (processedMessage && onNewMessage) {
          onNewMessage(processedMessage);
        }
      });
    }
  }, [processMessage, onNewMessage]);
  
  // Function to establish realtime connection
  const connectRealtime = useCallback((chatIdToConnect: string) => {
    if (isConnectingRef.current) {
      console.log("⚠️ Đang trong quá trình kết nối, bỏ qua yêu cầu mới");
      return null;
    }
    
    try {
      isConnectingRef.current = true;
      connectionReadyRef.current = false; // Reset connection status
      console.log(`🔄 Đang kết nối Realtime cho chat ${chatIdToConnect}...`);
      
      // Đảm bảo tạo kết nối trước khi đăng ký kênh
      // Với appwrite-js SDK, chúng ta có thể check kết nối bằng cách sử dụng một Promise để đợi
      let subscriptions: Array<() => void> = [];
      
      // Hàm đăng ký kênh khi đã sẵn sàng
      const subscribeWhenReady = (channelId: string, callback: (response: any) => void) => {
        // Bọc việc đăng ký trong try/catch
        try {
          console.log(`📡 Đăng ký kênh: ${channelId}`);
          const unsubscribe = appwriteClient.subscribe(channelId, callback);
          subscriptions.push(unsubscribe);
          return unsubscribe;
        } catch (error) {
          console.error(`❌ Lỗi khi đăng ký kênh ${channelId}:`, error);
          return () => {};
        }
      };
      
      // Sử dụng Promise để đảm bảo kết nối được thiết lập trước
      // Tạo một kênh test để kiểm tra sẵn sàng
      const testConnectionPromise = new Promise<void>((resolve, reject) => {
        let connectionTimeout: NodeJS.Timeout;
        
        // Set timeout để không chờ quá lâu
        connectionTimeout = setTimeout(() => {
          console.log("⏱️ Timeout khi chờ kết nối WebSocket - tiếp tục với trạng thái hiện tại");
          resolve(); // Vẫn tiếp tục mặc dù có timeout
        }, 3000);
        
        // Tạo kênh test
        try {
          const testChannel = 'connection-test';
          const testSubscription = appwriteClient.subscribe(testChannel, () => {
            // Kết nối đã sẵn sàng
            console.log("✅ WebSocket đã sẵn sàng");
            clearTimeout(connectionTimeout);
            
            // Hủy kênh test
            setTimeout(() => {
              try {
                testSubscription();
              } catch (err) {
                console.error("Lỗi khi hủy kênh test:", err);
              }
            }, 100);
            
            resolve();
          });
          
          // Thêm handler lỗi
          setTimeout(() => {
            try {
              testSubscription();
            } catch (err) {
              console.log("Không thể hủy test subscription:", err);
            }
          }, 2500); // Hủy sau 2.5s nếu không nhận được callback
          
        } catch (err) {
          console.error("Lỗi khi kiểm tra kết nối:", err);
          clearTimeout(connectionTimeout);
          resolve(); // Vẫn tiếp tục mặc dù có lỗi
        }
      });
      
      // Chờ kết nối sẵn sàng
      testConnectionPromise.then(() => {
        // MAIN CHANGE: Subscribe directly to all document events in the messages collection
        // This is the most reliable way to catch all message events
        const channelId = `databases.${DATABASE_ID}.collections.${MESSAGES_ID}.documents`;
        subscribeWhenReady(channelId, async (response: any) => {
          console.log("📨 Nhận sự kiện realtime:", response.events);
          
          if (!response || !response.payload) {
            console.warn("⚠️ Nhận được sự kiện không hợp lệ:", response);
            return;
          }
          
          const payload = response.payload;
          
          // Kiểm tra xem tin nhắn có thuộc chat hiện tại không
          if (payload.chatsId === chatIdToConnect) {
            console.log(`📨 Sự kiện cho chat ${chatIdToConnect}: ${response.events.join(', ')}`);
            
            // Fix: Detect both create and update events better
            const isMessageEvent = response.events.some((event: string) => 
              event.includes('databases.*.collections.*.documents.*.create') || 
              event.includes('databases.*.collections.*.documents.*.update')
            );
            
            if (isMessageEvent) {
              console.log(`✅ Tin nhắn mới/cập nhật cho chat ${chatIdToConnect}: ${payload.content?.substring(0, 20) || '[Media content]'}`);
              
              const processedMessage = await processMessage(payload);
              if (processedMessage && onNewMessage) {
                console.log(`🔔 Gọi callback onNewMessage cho tin nhắn: ${processedMessage.$id}`);
                onNewMessage(processedMessage);
              }
            }
          }
        });
        
        // Try a more generic subscription as fallback
        const dbChannelId = `databases.${DATABASE_ID}`;
        subscribeWhenReady(dbChannelId, async (response: any) => {
          if (response && response.payload && 
              response.payload.$collectionId === MESSAGES_ID && 
              response.payload.chatsId === chatIdToConnect) {
            
            console.log(`📨 Sự kiện database cho chat ${chatIdToConnect}`);
            
            const processedMessage = await processMessage(response.payload);
            if (processedMessage && onNewMessage) {
              onNewMessage(processedMessage);
            }
          }
        });
        
        // Đăng ký thêm kênh cụ thể cho chat này
        try {
          const chatChannelId = `databases.${DATABASE_ID}.collections.${MESSAGES_ID}.documents.*.chatsId.${chatIdToConnect}`;
          subscribeWhenReady(chatChannelId, async (response: any) => {
            console.log(`📨 Sự kiện chat cụ thể: ${chatIdToConnect}`);
            
            if (response && response.payload) {
              const processedMessage = await processMessage(response.payload);
              if (processedMessage && onNewMessage) {
                onNewMessage(processedMessage);
              }
            }
          });
        } catch (e) {
          console.log("Không thể đăng ký kênh chat cụ thể:", e);
        }
        
        // Đánh dấu kết nối thành công
        setIsConnected(true);
        isConnectingRef.current = false;
        connectionReadyRef.current = true;
        console.log(`✅ Kết nối Realtime thành công cho chat ${chatIdToConnect}`);
        
        // Xử lý tin nhắn trong hàng đợi sau khi kết nối thành công
        processQueuedMessages();
      });
      
      // Lưu lại hàm unsubscribe để có thể gọi khi cần
      const combinedUnsubscribe = () => {
        subscriptions.forEach(unsubscribe => {
          try {
            unsubscribe();
          } catch (err) {
            console.error("Lỗi khi hủy đăng ký:", err);
          }
        });
        subscriptions = [];
        connectionReadyRef.current = false;
      };
      
      unsubscribeRef.current = combinedUnsubscribe;
      
      return combinedUnsubscribe;
    } catch (err) {
      console.error("❌ Lỗi kết nối Realtime:", err);
      setError(err instanceof Error ? err.message : "Không thể kết nối Realtime");
      setIsConnected(false);
      isConnectingRef.current = false;
      connectionReadyRef.current = false;
      return null;
    }
  }, [processMessage, onNewMessage, processQueuedMessages]);
  
  // Fix: Better reconnection with increased heartbeat
  const reconnect = useCallback((chatIdToReconnect: string) => {
    if (reconnectAttemptRef.current >= maxReconnectAttempts || isConnectingRef.current) {
      console.log("❌ Đã đạt giới hạn số lần thử kết nối lại hoặc đang trong quá trình kết nối");
      return;
    }
    
    reconnectAttemptRef.current += 1;
    console.log(`🔄 Đang thử kết nối lại (lần ${reconnectAttemptRef.current}/${maxReconnectAttempts})...`);
    
    // Thử kết nối lại sau 2 giây
    setTimeout(() => {
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (err) {
          console.error("Lỗi khi hủy đăng ký cũ:", err);
        }
        unsubscribeRef.current = null;
      }
      connectRealtime(chatIdToReconnect);
    }, 2000);
  }, [connectRealtime]);
  
  useEffect(() => {
    if (!chatId) {
      // Nếu không có chatId, hủy kết nối nếu đang có
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setIsConnected(false);
      connectionReadyRef.current = false;
      return;
    }
    
    // Reset số lần thử kết nối lại
    reconnectAttemptRef.current = 0;
    
    // Reset danh sách tin nhắn đã xử lý
    processedMessagesRef.current.clear();
    
    // Reset timestamp to ensure we catch all messages in the new chat
    lastMessageTimestampRef.current = 0;
    
    // Reset message queue
    messageQueueRef.current = [];
    
    // Hủy kết nối cũ nếu có
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // Thiết lập kết nối mới
    const cleanup = connectRealtime(chatId);
    
    // Fix: Heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (isConnected && !isConnectingRef.current && connectionReadyRef.current) {
        console.log("💓 Gửi heartbeat để giữ kết nối...");
        try {
          // Just a quick subscribe/unsubscribe to keep the connection fresh
          const tempSubscription = appwriteClient.subscribe('heartbeat', () => {});
          setTimeout(() => {
            try {
              tempSubscription();
            } catch (e) {
              console.log("Lỗi khi hủy heartbeat subscription:", e);
            }
          }, 100);
        } catch (e) {
          console.log("Lỗi heartbeat:", e);
          // If heartbeat fails, try to reconnect
          if (chatId) {
            reconnect(chatId);
          }
        }
      }
    }, 25000); // Heartbeat every 25 seconds
    
    // Kiểm tra kết nối định kỳ
    const checkConnectionInterval = setInterval(() => {
      if (!isConnected && chatId && !isConnectingRef.current) {
        reconnect(chatId);
      }
      
      // Nếu đã kết nối nhưng có tin nhắn trong hàng đợi, thử xử lý lại
      if (isConnected && connectionReadyRef.current && messageQueueRef.current.length > 0) {
        processQueuedMessages();
      }
    }, 10000); // Kiểm tra mỗi 10 giây
    
    // Cleanup khi component unmount hoặc chatId thay đổi
    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(checkConnectionInterval);
      if (cleanup) {
        try {
          cleanup();
        } catch (err) {
          console.error("Lỗi khi cleanup:", err);
        }
        console.log(`❌ Đã ngắt kết nối Realtime cho chat ${chatId}`);
      }
      setIsConnected(false);
      isConnectingRef.current = false;
      connectionReadyRef.current = false;
    };
  }, [chatId, connectRealtime, reconnect, isConnected, processQueuedMessages]);
  
  return { isConnected, error };
} 