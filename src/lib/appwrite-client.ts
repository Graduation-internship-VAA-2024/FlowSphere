import { Client, Databases, Account, Storage, ID } from "appwrite";

// Khởi tạo Appwrite client với cấu hình nâng cao
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT as string);

// Override the subscribe method to add error handling and retry logic
const originalSubscribe = client.subscribe.bind(client);
client.subscribe = function(event: string, callback: (response: any) => void): (() => void) {
  try {
    // Only subscribe if we can get socket access
    const socket = (client as any).socketConnection?.socket;
    
    // If socket exists but is not open, we need to handle this case
    if (socket && socket.readyState !== WebSocket.OPEN) {
      console.warn(`WebSocket not in OPEN state (current state: ${socket.readyState}), delaying subscription to ${event}`);
      
      // Return a dummy unsubscribe function
      let subscriptionActive = true;
      let actualUnsubscribe: (() => void) | null = null;
      
      // Try to connect with exponential backoff
      const attemptSubscribe = (attempt = 0) => {
        if (!subscriptionActive) return; // Don't try if already unsubscribed
        
        const currentSocket = (client as any).socketConnection?.socket;
        if (!currentSocket) {
          // No socket available, retry later
          setTimeout(() => attemptSubscribe(attempt + 1), Math.min(300 * Math.pow(1.5, attempt), 5000));
          return;
        }
        
        if (currentSocket.readyState === WebSocket.OPEN) {
          // Socket is now open, safe to subscribe
          try {
            actualUnsubscribe = originalSubscribe(event, (response) => {
              if (subscriptionActive) {
                callback(response);
              }
            });
          } catch (error) {
            console.error(`Failed to subscribe to ${event} on attempt ${attempt}:`, error);
            // Retry with backoff
            setTimeout(() => attemptSubscribe(attempt + 1), Math.min(300 * Math.pow(1.5, attempt), 5000));
          }
        } else {
          // Not open yet, retry
          setTimeout(() => attemptSubscribe(attempt + 1), Math.min(300 * Math.pow(1.5, attempt), 5000));
        }
      };
      
      // Start the subscription attempts
      attemptSubscribe();
      
      // Return a function that will prevent further subscription attempts
      return () => {
        subscriptionActive = false;
        if (actualUnsubscribe) {
          try {
            actualUnsubscribe();
          } catch (error) {
            console.error(`Error during unsubscribe from ${event}:`, error);
          }
        }
      };
    }
    
    // Normal case - socket is open or not yet created
    return originalSubscribe(event, callback);
  } catch (error) {
    console.error(`Error in subscribe to ${event}:`, error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};

// Export các dịch vụ của Appwrite
export const appwriteClient = client;

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Helper function để tạo ID duy nhất
export const createId = () => ID.unique(); 