//Dữ liệu chatbot được lưu trong sessionStorage, khi tắt web hoặc đóng trình duyệt thì dữ liệu sẽ mất
import { Message } from '../types';

// Constants for sessionStorage keys
const CHAT_MESSAGES_KEY = 'flowsphere_chat_messages';

/**
 * Save chat messages to sessionStorage
 * @param messages Array of chat messages to save
 */
export const saveMessagesToStorage = (messages: Message[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving chat messages to sessionStorage:', error);
  }
};

/**
 * Load chat messages from sessionStorage
 * @returns Array of chat messages or empty array if none found
 */
export const loadMessagesFromStorage = (): Message[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedMessages = sessionStorage.getItem(CHAT_MESSAGES_KEY);
    if (!savedMessages) return [];
    
    return JSON.parse(savedMessages) as Message[];
  } catch (error) {
    console.error('Error loading chat messages from sessionStorage:', error);
    return [];
  }
};

/**
 * Clear chat messages from sessionStorage
 */
export const clearMessagesFromStorage = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(CHAT_MESSAGES_KEY);
  } catch (error) {
    console.error('Error clearing chat messages from sessionStorage:', error);
  }
}; 