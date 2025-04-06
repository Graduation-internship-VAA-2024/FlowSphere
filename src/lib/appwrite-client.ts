import { Client, Databases, Account, Storage, ID } from "appwrite";

// Khởi tạo Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT as string);

// Export các dịch vụ của Appwrite
export const appwriteClient = client;

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Helper function để tạo ID duy nhất
export const createId = () => ID.unique(); 