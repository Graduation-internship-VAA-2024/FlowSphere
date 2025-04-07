'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentUser } from './hooks/userCurrent';
import { usePersistentChat } from './hooks/usePersistentChat';
import Image from 'next/image';

export const FloatingChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [input, setInput] = useState('');
  const { user } = useCurrentUser();
  const { 
    messages, 
    addMessage, 
    showIntro, 
    setShowIntro,
    hasWelcomed,
    setHasWelcomed
  } = usePersistentChat();

  // Hiển thị nút sau khi trang được tải để tránh hiệu ứng flash
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Xử lý phím tắt Ctrl+I để mở chatbot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setIsChatOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hiển thị tin nhắn chào mừng khi người dùng mở chatbot lần đầu
  useEffect(() => {
    if (isChatOpen && user && !hasWelcomed && messages.length === 0) {
      addMessage({
        content: `Xin chào ${user.name}! Tôi là trợ lý ảo của FlowSphere. 
        Tôi có thể giúp gì cho bạn?`,
        role: 'assistant'
      });
      setHasWelcomed(true);
    }
  }, [isChatOpen, user, hasWelcomed, messages.length, addMessage, setHasWelcomed]);

  // Gửi tin nhắn
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addMessage({
      content: input.trim(),
      role: 'user'
    });

    // Giả lập phản hồi (trong thực tế, bạn sẽ gọi API)
    setTimeout(() => {
      addMessage({
        content: "Tôi đã nhận được tin nhắn của bạn. Đây là một phản hồi mẫu. Trên ứng dụng thực tế, bạn sẽ kết nối với logic xử lý tin nhắn trong ChatBot.tsx.",
        role: 'assistant'
      });
    }, 1000);

    setInput('');
    
    if (showIntro) {
      setShowIntro(false);
    }
  };

  return (
    <>
      {/* Nút mở chatbot */}
      <AnimatePresence>
        {isVisible && !isChatOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            onClick={() => setIsChatOpen(true)}
            className="fixed top-1/2 -translate-y-1/2 right-0 z-50 flex items-center 
              bg-gradient-to-r from-primary via-violet-500 to-blue-500
              text-white rounded-l-full shadow-lg shadow-violet-500/30
              hover:shadow-violet-600/40 hover:pl-6 transition-all duration-300
              py-3 pl-4 pr-1 group"
            whileHover={{ x: -5 }}
          >
            <MessageCircle className="w-5 h-5 mr-0 group-hover:mr-2 transition-all duration-300" />
            <span className="w-0 overflow-hidden group-hover:w-auto transition-all duration-300 opacity-0 group-hover:opacity-100">
              Trợ lý AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel chatbot kiểu Copilot */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[400px] flex flex-col
              bg-white shadow-lg border-l border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <div className="h-8 w-8 mr-3 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden">
                  <Image 
                    src="/logo.svg" 
                    alt="FlowSphere Logo" 
                    width={20} 
                    height={20}
                    className="object-contain"
                  />
                </div>
                <h2 className="font-medium">Trợ lý FlowSphere</h2>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
                >
                  {message.role === 'assistant' && (
                    <div className="h-8 w-8 mr-2 flex-shrink-0 rounded-full bg-gray-50 flex items-center justify-center">
                      <Image 
                        src="/logo.svg" 
                        alt="Assistant" 
                        width={16} 
                        height={16}
                        className="object-contain"
                      />
                    </div>
                  )}
                  
                  <div 
                    className={`max-w-[85%] p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none ml-2' 
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="h-8 w-8 ml-2 flex-shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Nếu không có tin nhắn, hiển thị màn hình giới thiệu */}
              {messages.length === 0 && (
                <div className="py-8 flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 mb-4 bg-violet-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Assistant FlowSphere</h3>
                  <p className="text-gray-500 text-center mb-6 max-w-xs">
                    Hỏi bất cứ điều gì về ứng dụng, tạo workspace hoặc project mới.
                  </p>
                  
                  <div className="space-y-2 w-full">
                    {[
                      "Tạo workspace mới",
                      "Cách tạo project?",
                      "Các tính năng của FlowSphere"
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInput(suggestion);
                          addMessage({
                            content: suggestion,
                            role: 'user'
                          });
                          setShowIntro(false);
                        }}
                        className="w-full p-2 rounded-lg border border-gray-200 bg-white
                          hover:bg-gray-50 text-left text-sm transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="border-t p-3">
              <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden pr-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 py-3 px-4 bg-transparent border-none outline-none text-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={`p-1.5 rounded-full ${input.trim() ? 'bg-primary text-white' : 'bg-gray-300 text-gray-500'}`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-gray-400 text-center mt-2">
                Nhấn Ctrl+I để mở/đóng trợ lý
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}; 