import { Client, Databases, Account, Storage, ID } from "appwrite";

// Khởi tạo Appwrite client với cơ chế xử lý lỗi WebSocket tốt hơn
const initClient = () => {
  // Thử tạo client và thiết lập retry logic
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT as string);
    
    // Ghi đè phương thức subscribe để thêm cơ chế retry và kiểm tra kết nối
    const originalSubscribe = client.subscribe.bind(client);
    client.subscribe = (channel, callback) => {
      try {
        return originalSubscribe(channel, callback);
      } catch (error) {
        console.error('Error in WebSocket subscription:', error);
        
        // Fallback với timeout để tránh lỗi "Still in CONNECTING state"
        setTimeout(() => {
          try {
            return originalSubscribe(channel, callback);
          } catch (retryError) {
            console.error('Retry subscription failed:', retryError);
            // Trả về unsubscribe function rỗng để tránh lỗi
            return () => {};
          }
        }, 500);
        
        // Trả về unsubscribe function tạm thời
        return () => {};
      }
    };
    
    return client;
  } catch (error) {
    console.error('Failed to initialize Appwrite client:', error);
    // Fallback client nếu khởi tạo thất bại
    return new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT as string);
  }
};

const client = initClient();

// Export các dịch vụ của Appwrite
export const appwriteClient = client;

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Helper function để tạo ID duy nhất
export const createId = () => ID.unique(); 