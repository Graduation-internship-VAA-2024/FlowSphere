"use client";
import React, { useState, useEffect } from "react";

import { useSendMessage } from "../api/use-send-message";
import { useReceiveMessage } from "../api/use-receive-message";
import { useChatHistory } from "../api/use-chat-history";
import { User, Message } from "../types";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";

interface ChatUIProps {
  workspaceId: string;
}

const ChatUI: React.FC<ChatUIProps> = ({ workspaceId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const sendMessage = useSendMessage();
  const receiveMessage = useReceiveMessage();
  const getHistory = useChatHistory();

  useEffect(() => {
    // Load chat history for specific workspace
    const history = getHistory(workspaceId);
    setMessages(history);

    // Mô phỏng nhận tin nhắn mỗi 2 giây
    const interval = setInterval(() => {
      receiveMessage((newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [workspaceId, getHistory, receiveMessage]);

  // Thêm loading khi gửi tin nhắn
  const handleSendMessage = async (message: Message) => {
    setIsLoading(true);
    try {
      await sendMessage(message);
      setMessages((prev) => [...prev, message]);
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm function xử lý upload file
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // Gọi API upload file của bạn ở đây
      const fileUrl = await uploadFile(formData);

      const newMessage: Message = {
        id: Date.now().toString(),
        content: fileUrl,
        senderId: "currentUserId",
        type: file.type.startsWith("image/") ? "image" : "file",
        fileUrl,
        fileName: file.name,
        timestamp: new Date(),
      };

      await sendMessage(newMessage);
      setMessages((prev) => [...prev, newMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm theo dõi trạng thái typing
  let typingTimeout: NodeJS.Timeout;
  const handleTyping = () => {
    setIsTyping(true);
    // Gửi trạng thái typing tới server
    sendTypingStatus(true);

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setIsTyping(false);
      sendTypingStatus(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 p-4">
      <div className="flex h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-lg">
        {/* Sidebar với scroll độc lập */}
        <div className="flex w-80 flex-none flex-col border-r border-gray-200">
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-blue-600">Chats</h3>
          </div>

          {/* Danh sách user với scroll */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 p-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`flex cursor-pointer items-center rounded-lg p-3 transition-all hover:bg-gray-50
                    ${selectedUser?.id === user.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-300" />
                  <div className="min-w-0 flex-1 pl-3">
                    <div className="flex items-center">
                      <p className="truncate font-medium text-gray-900">{user.name}</p>
                      <span className={`ml-2 h-2 w-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    {!user.isOnline && user.lastSeen && (
                      <p className="truncate text-xs text-gray-500">
                        Last seen: {new Date(user.lastSeen).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Khu vực chat chính */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center border-b border-gray-200 p-4">
            <div className="h-10 w-10 rounded-full bg-gray-300" />
            <span className="ml-3 font-medium text-gray-900">
              {selectedUser ? selectedUser.name : "Nguyễn"}
            </span>
          </div>

          {/* Khu vực tin nhắn với scroll */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage key={message.id || index} message={message} />
              ))}
            </div>
          </div>

          {/* Typing indicator */}
          {isTyping && (
            <div className="px-4 py-2 text-sm text-gray-500 italic">
              {selectedUser?.name} đang nhập...
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="fileInput"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              />
              <button
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <svg className="h-5 w-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <div className="flex-1">
                <ChatInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
