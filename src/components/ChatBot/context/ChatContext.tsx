"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ApiSource = "openrouter" | "gemini";

type ChatContextType = {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  initialMessage?: string;
  setInitialMessage: (message: string) => void;
  apiSource: ApiSource;
  setApiSource: (source: ApiSource) => void;
  resetToDefaultApi: () => void;
  clearChat: () => void;
  analyzeContent: (
    contentType: "image" | "file",
    contentUrl: string,
    fileName?: string,
    taskTitle?: string
  ) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(
    undefined
  );
  const [apiSource, setApiSource] = useState<ApiSource>("openrouter");

  const openChat = () => {
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setInitialMessage(undefined);
  };

  // Xóa tin nhắn chat
  const clearChat = () => {
    // Làm trống tin nhắn ban đầu
    setInitialMessage(undefined);

    // Lưu ý: cần truyền hàm này xuống SidePanelChat để xóa các tin nhắn
    // trong state messages của usePersistentChat
  };

  // Đặt lại API về mặc định (OpenRouter) và xóa cuộc trò chuyện
  const resetToDefaultApi = () => {
    // Đặt lại API source trước
    setApiSource("openrouter");

    // Xóa tin nhắn khởi đầu
    setInitialMessage(undefined);

    // Đóng chat để reset UI
    setIsOpen(false);

    // Mở lại sau một chút để tạo trải nghiệm mượt mà
    setTimeout(() => {
      setIsOpen(true);
    }, 300);

    console.log("Reset to OpenRouter API and cleared chat");
  };

  const analyzeContent = async (
    contentType: "image" | "file",
    contentUrl: string,
    fileName?: string,
    taskTitle?: string
  ) => {
    try {
      // Phân tích nội dung luôn sử dụng Gemini
      setApiSource("gemini");

      const response = await fetch("/api/ai/analyze-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType,
          contentUrl,
          fileName,
          taskTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze content");
      }

      const data = await response.json();

      // Set initial message and open chat
      setInitialMessage(data.analysis);
      openChat();
    } catch (error) {
      console.error("Error analyzing content:", error);
      setInitialMessage(
        "Xin lỗi, tôi không thể phân tích nội dung này. Vui lòng thử lại sau."
      );
      openChat();
    }
  };

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        initialMessage,
        setInitialMessage,
        apiSource,
        setApiSource,
        resetToDefaultApi,
        clearChat,
        analyzeContent,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
