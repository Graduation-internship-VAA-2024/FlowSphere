import { useEffect, useState } from "react";
import { Client, RealtimeResponseEvent } from "appwrite";
import { useInterval } from "@/hooks/use-interval";
import { DATABASE_ID, MESSAGES_ID } from "@/config";

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
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  // Kết nối realtime khi component mount
  useEffect(() => {
    if (!enabled || !chatsId) {
      setIsConnected(false);
      return;
    }

    // Khởi tạo client AppWrite realtime và database
    const client = new Client()
      .setEndpoint(
        process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
          "https://cloud.appwrite.io/v1"
      )
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT || "");

    // Đăng ký lắng nghe sự kiện realtime cho chat
    let unsubscribe: () => void;

    // Check if WebSocket is ready before subscribing
    const subscribeWhenReady = () => {
      try {
        // Access the internal WebSocket from client
        const socket = (client as any).socketConnection?.socket;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
          // WebSocket not ready yet, retry with exponential backoff
          console.log("WebSocket not ready yet, using exponential backoff...");

          // Implement exponential backoff for retries
          const retryWithBackoff = (attempt = 1, maxAttempts = 8) => {
            if (attempt > maxAttempts) {
              console.error(
                "Max retry attempts reached for DM realtime connection"
              );
              // Fall back to polling
              setIsConnected(false);
              return;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(300 * Math.pow(1.5, attempt - 1), 8000);

            console.log(
              `Retry attempt ${attempt}/${maxAttempts} after ${delay}ms for DM realtime`
            );

            setTimeout(() => {
              // Check socket status again before retry
              const currentSocket = (client as any).socketConnection?.socket;

              if (!currentSocket) {
                console.log(
                  `No socket found, retrying... (attempt ${attempt})`
                );
                retryWithBackoff(attempt + 1, maxAttempts);
                return;
              }

              if (currentSocket.readyState === WebSocket.OPEN) {
                // Socket is now open, try to subscribe
                try {
                  setupSubscription();
                } catch (err) {
                  console.error(
                    `Error subscribing on attempt ${attempt}:`,
                    err
                  );
                  retryWithBackoff(attempt + 1, maxAttempts);
                }
              } else if (currentSocket.readyState === WebSocket.CONNECTING) {
                // Still connecting, retry
                console.log(
                  `Socket still connecting, retry later (attempt ${attempt})`
                );
                retryWithBackoff(attempt + 1, maxAttempts);
              } else if (
                currentSocket.readyState === WebSocket.CLOSED ||
                currentSocket.readyState === WebSocket.CLOSING
              ) {
                // Socket closed or closing, try to reconnect
                console.log(
                  `Socket closed/closing, attempt to reconnect (attempt ${attempt})`
                );

                // Force reconnect by recreating the client connection if needed
                try {
                  // Try to ping to force socket creation
                  client.subscribe("ping-event", () => {});
                  retryWithBackoff(attempt + 1, maxAttempts);
                } catch (error) {
                  console.error("Error forcing reconnect:", error);
                  retryWithBackoff(attempt + 1, maxAttempts);
                }
              }
            }, delay);
          };

          // Start retry process
          retryWithBackoff();
          return;
        }

        // WebSocket is ready, proceed with subscription
        setupSubscription();
      } catch (error) {
        console.error("Error in subscribeWhenReady:", error);
        // Fall back to polling if subscription process fails
        setIsConnected(false);
      }
    };

    // Extract subscription logic to a separate function
    const setupSubscription = () => {
      try {
        // WebSocket is now ready, subscribe
        unsubscribe = client.subscribe<RealtimeResponseEvent<any>>(
          `databases.${DATABASE_ID}.collections.${MESSAGES_ID}.documents`,
          (response) => {
            // Chỉ xử lý tin nhắn mới được tạo
            if (
              response.events.includes(
                "databases.*.collections.*.documents.*.create"
              )
            ) {
              const message = response.payload as any;

              // Chỉ xử lý tin nhắn thuộc chat hiện tại
              if (message && message.chatsId === chatsId) {
                console.log("DM hook received new message:", message);
                setLastMessageId(message.$id);
                onNewMessage(message);
              }
            }
          }
        );

        setIsConnected(true);
        console.log(
          `Connected to realtime for Direct Message chat: ${chatsId}`
        );
      } catch (error) {
        console.error("Error in setupSubscription:", error);
        setIsConnected(false);
        throw error; // Rethrow to allow retry logic to catch it
      }
    };

    // Start subscription process
    subscribeWhenReady();

    // Cleanup function
    return () => {
      console.log(`Disconnecting from realtime for chat: ${chatsId}`);
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing:", error);
        }
      }
      setIsConnected(false);
    };
  }, [chatsId, onNewMessage, enabled]);

  // Fallback polling mechanism for when realtime is not working
  useInterval(
    async () => {
      if (!chatsId || !enabled || isConnected) return;

      try {
        setIsPolling(true);
        console.log("Polling for new direct messages...");

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
            console.log("Found new direct message via polling");
            setLastMessageId(messages[0].$id);
            onNewMessage(messages[0]);
          }
        }
      } catch (error) {
        console.error("Error polling for new direct messages:", error);
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
