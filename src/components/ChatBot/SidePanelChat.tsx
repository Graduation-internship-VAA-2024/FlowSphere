'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, ChevronRight, Send } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCreateWorkspace } from '@/features/workspaces/api/use-create-workspace';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useCurrentUser } from './hooks/userCurrent';
import { IntentAnalyzer } from './utils/intentAnalyzer';
import { SYSTEM_PROMPT } from './constants/prompts';
import { useCreateProject } from '@/features/projects/api/use-create-project';
import { usePersistentChat } from './hooks/usePersistentChat';

const intentAnalyzer = new IntentAnalyzer();

const exampleSuggestions = [
  "Tạo workspace mới",
  "Cách tạo project?",
  "Các tính năng của FlowSphere"
];

export const SidePanelChat = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();
  const createWorkspace = useCreateWorkspace();
  const createProject = useCreateProject();
  const workspaceId = useWorkspaceId();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    messages, 
    addMessage, 
    showIntro, 
    setShowIntro,
    hasWelcomed,
    setHasWelcomed
  } = usePersistentChat();

  const [workspaceIntent, setWorkspaceIntent] = useState<{
    isCreating: boolean;
    name?: string;
  }>({
    isCreating: false,
    name: undefined
  });

  const [projectIntent, setProjectIntent] = useState<{
    isCreating: boolean;
    name?: string;
  }>({
    isCreating: false,
    name: undefined
  });

  const [isMounted, setIsMounted] = useState(false);

  // Thêm class vào body khi mở chatbot để co trang web lại
  useEffect(() => {
    if (!isMounted) return;
    
    if (isChatOpen) {
      document.body.classList.add('chatbot-open');
    } else {
      document.body.classList.remove('chatbot-open');
    }

    return () => {
      document.body.classList.remove('chatbot-open');
    };
  }, [isChatOpen, isMounted]);

  // Hiển thị nút sau khi trang được tải
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Xử lý phím tắt Ctrl+I
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

  // Hiển thị tin nhắn chào mừng
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

  // Cuộn xuống cuối cuộc trò chuyện
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Focus vào ô input khi mở chatbot
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isChatOpen]);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSendMessage(suggestion);
    setShowIntro(false);
  };

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || input;
    if (!messageContent.trim()) return;

    addMessage({
      content: messageContent.trim(),
      role: 'user'
    });
    
    setInput('');
    setIsTyping(true);
    
    if (showIntro) {
      setShowIntro(false);
    }

    try {
      // Handle project creation
      if (projectIntent.isCreating && !projectIntent.name) {
        if (!workspaceId) {
          addMessage({
            content: 'Bạn cần chọn workspace trước khi tạo project.',
            role: 'assistant'
          });
          setProjectIntent({ isCreating: false, name: undefined });
          setIsTyping(false);
          return;
        }

        const projectName = messageContent.trim();
        setProjectIntent({ isCreating: true, name: projectName });
        
        // Create project
        const response = await createProject.mutateAsync({
          form: { 
            name: projectName,
            workspaceId 
          }
        });

        // Add confirmation message
        addMessage({
          content: `Đã tạo project "${projectName}" thành công! Đang chuyển hướng...`,
          role: 'assistant'
        });

        // Redirect to new project
        setTimeout(() => {
          router.push(`/workspaces/${workspaceId}/projects/${response.data.$id}`);
          setIsChatOpen(false);
        }, 2000);

        setProjectIntent({ isCreating: false, name: undefined });
        setIsTyping(false);
        return;
      }

      // Handle workspace creation
      if (workspaceIntent.isCreating && !workspaceIntent.name) {
        const workspaceName = messageContent.trim();
        setWorkspaceIntent({ isCreating: true, name: workspaceName });
        
        // Tạo workspace và lấy response
        const response = await createWorkspace.mutateAsync({
          form: { name: workspaceName }
        });

        // Thêm tin nhắn xác nhận
        addMessage({
          content: `Đã tạo workspace "${workspaceName}" thành công! Đang chuyển hướng...`,
          role: 'assistant'
        });

        setTimeout(() => {
          router.push(`/workspaces/${response.data.$id}`);
          setIsChatOpen(false);
        }, 2000);

        setWorkspaceIntent({ isCreating: false, name: undefined });
        setIsTyping(false);
        return;
      }

      // Phân tích ý định từ tin nhắn người dùng
      const intentAnalysis = intentAnalyzer.analyzeIntent(messageContent);

      // Xử lý ý định tạo project
      if (intentAnalysis.type === 'create_project' && intentAnalysis.confidence > 0.6) {
        if (!workspaceId) {
          addMessage({
            content: `Bạn đang ở ngoài workspace. Vui lòng:
1. Chọn một workspace từ menu điều hướng
2. Hoặc tạo workspace mới nếu chưa có
3. Sau đó quay lại đây để tạo project`,
            role: 'assistant'
          });
          setIsTyping(false);
          return;
        }

        setProjectIntent({ isCreating: true, name: undefined });
        addMessage({
          content: `Tôi sẽ giúp bạn tạo một project trong workspace hiện tại.
          
Bạn muốn đặt tên cho project là gì?

Gợi ý đặt tên:
• Ngắn gọn và dễ nhớ
• Phản ánh mục đích của project
• Không sử dụng ký tự đặc biệt`,
          role: 'assistant'
        });
        setIsTyping(false);
        return;
      }

      // Nếu phát hiện ý định tạo workspace với độ tin cậy cao
      if (intentAnalysis.type === 'create_workspace' && intentAnalysis.confidence > 0.6) {
        setWorkspaceIntent({ isCreating: true, name: undefined });
        const response = intentAnalyzer.generateResponse(intentAnalysis);

        addMessage({
          content: response,
          role: 'assistant'
        });
        setIsTyping(false);
        return;
      }

      // Gọi OpenRouter API với context phong phú hơn
      const aiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT
            },
            ...messages,
            {
              role: 'user',
              content: `
Người dùng: ${user?.name}
Email: ${user?.email}
Workspace hiện tại: ${workspaceId || 'Chưa có'}
Phân tích ý định: ${JSON.stringify(intentAnalysis)}
Yêu cầu: ${messageContent}
              `
            }
          ]
        })
      });

      const data = await aiResponse.json();
      
      // Phân tích phản hồi từ AI
      const aiMessage = data.response;
      const hasWorkspaceIntent = aiMessage.toLowerCase().includes('tạo workspace') ||
                                aiMessage.toLowerCase().includes('đặt tên workspace');

      if (hasWorkspaceIntent) {
        setWorkspaceIntent({ isCreating: true, name: undefined });
        // Thêm hướng dẫn chi tiết về đặt tên
        addMessage({
          content: `${aiMessage}

Một số gợi ý cho tên workspace:
• Ngắn gọn và dễ nhớ
• Liên quan đến mục đích sử dụng
• Chỉ sử dụng chữ cái, số và dấu gạch ngang
• Không sử dụng ký tự đặc biệt

Vui lòng cho tôi biết tên workspace bạn muốn tạo:`,
          role: 'assistant'
        });
        setIsTyping(false);
        return;
      }

      // Thêm tin nhắn từ AI
      addMessage({
        content: aiMessage,
        role: 'assistant'
      });

    } catch (error) {
      console.error('Error:', error);
      addMessage({
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        role: 'assistant'
      });
      setWorkspaceIntent({ isCreating: false, name: undefined });
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      {isMounted && (
        <>
          {/* Nút mở chatbot */}
          <AnimatePresence>
            {isVisible && !isChatOpen && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                onClick={() => setIsChatOpen(true)}
                className="fixed top-1/2 -translate-y-1/2 right-0 z-[9998] flex items-center 
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
                className="fixed top-0 right-0 bottom-0 z-[9999] w-[400px] flex flex-col
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

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start mb-3">
                      <div className="h-8 w-8 mr-2 rounded-full bg-gray-50 flex items-center justify-center">
                        <Image 
                          src="/logo.svg" 
                          alt="Assistant" 
                          width={16} 
                          height={16}
                          className="object-contain"
                        />
                      </div>
                      <div className="p-3 rounded-lg bg-gray-100 rounded-tl-none">
                        <div className="flex space-x-2">
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0
                            }}
                            className="w-2 h-2 rounded-full bg-gray-400"
                          />
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0.2
                            }}
                            className="w-2 h-2 rounded-full bg-gray-400"
                          />
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0.4
                            }}
                            className="w-2 h-2 rounded-full bg-gray-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Nếu không có tin nhắn, hiển thị màn hình giới thiệu */}
                  {messages.length === 0 && (
                    <div className="py-8 flex flex-col items-center justify-center h-full">
                      <div className="w-16 h-16 mb-4 bg-violet-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Trợ lý FlowSphere</h3>
                      <p className="text-gray-500 text-center mb-6 max-w-xs">
                        Hỏi bất cứ điều gì về ứng dụng, tạo workspace hoặc project mới.
                      </p>
                      
                      <div className="space-y-2 w-full">
                        {exampleSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full p-2 rounded-lg border border-gray-200 bg-white
                              hover:bg-gray-50 text-left text-sm transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleFormSubmit} className="border-t p-3">
                  <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden pr-3">
                    <input
                      ref={inputRef}
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
      )}
    </>
  );
}; 