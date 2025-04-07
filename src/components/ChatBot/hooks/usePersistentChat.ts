import { useState, useEffect } from 'react';
import { Message } from '../types';
import { saveMessagesToStorage, loadMessagesFromStorage } from '../utils/storageUtils';

interface UsePersistentChatParams {
  initialShowIntro?: boolean;
}

interface UsePersistentChatResult {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  showIntro: boolean;
  setShowIntro: React.Dispatch<React.SetStateAction<boolean>>;
  hasWelcomed: boolean;
  setHasWelcomed: React.Dispatch<React.SetStateAction<boolean>>;
  addMessage: (message: Omit<Message, 'id'>) => void;
  clearMessages: () => void;
}

export const usePersistentChat = ({ 
  initialShowIntro = true 
}: UsePersistentChatParams = {}): UsePersistentChatResult => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showIntro, setShowIntro] = useState(initialShowIntro);
  const [hasWelcomed, setHasWelcomed] = useState(false);

  // Load saved messages on mount
  useEffect(() => {
    const savedMessages = loadMessagesFromStorage();
    
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
      setShowIntro(false);
      setHasWelcomed(true);
    }
  }, []);
  
  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages]);

  // Add a new message to the chat
  const addMessage = (message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
    saveMessagesToStorage([]);
  };

  return {
    messages,
    setMessages,
    showIntro,
    setShowIntro,
    hasWelcomed,
    setHasWelcomed,
    addMessage,
    clearMessages
  };
}; 