'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ChatbotDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

interface ExampleQuestion {
  text: string;
}

export function ChatbotDialog({ isOpen, onClose }: ChatbotDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const exampleQuestions: ExampleQuestion[] = [
    { text: "How would I use Workspaces?" },
    { text: "What are the key features?" },
    { text: "How to create a new project?" }
  ];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (showIntro) {
      setShowIntro(false);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi kết nối');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.response,
        role: 'assistant'
      }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.",
        role: 'assistant'
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, messages, showIntro]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 flex items-start border-b border-gray-200">
          <div className="h-12 w-12 mr-4 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden">
            <Image 
              src="/logo.svg"
              alt="FlowSphere Logo"
              width={35}
              height={35}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">Assistant Workspaces</h2>
            <p className="text-gray-600 mt-1 text-sm">
              I'm an AI assistant trained on documentation, help articles, and other content.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {showIntro ? (
            <>
              <p className="text-gray-600 mb-4 text-sm">
                Ask me anything about <span className="bg-gray-800 text-white px-2 py-1 rounded text-sm font-medium">Workspaces</span>
              </p>
              
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2 mt-6">
                EXAMPLE QUESTIONS
              </p>
              <div className="space-y-2">
                {exampleQuestions.map((question, index) => (
                  <div 
                    key={index}
                    className="p-3 cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg"
                    onClick={() => handleQuestionClick(question.text)}
                  >
                    <p className="text-gray-700 text-sm">{question.text}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div 
                  key={message.id} 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="h-8 w-8 mr-2 rounded-full bg-gray-50 flex items-center justify-center">
                      <Image 
                        src="/logo.svg"
                        alt="Assistant"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className={`
                      max-w-[70%] p-4 rounded-2xl
                      ${message.role === 'user' 
                        ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-br-none shadow-lg'
                        : 'bg-white border border-gray-100 rounded-bl-none shadow-md'
                      }
                      backdrop-blur-sm
                      transition-all duration-200
                    `}
                  >
                    <div className={`
                      text-xs md:text-sm
                      ${message.role === 'user' ? 'text-white' : 'text-gray-800'}
                    `}>
                      {message.content}
                    </div>
                  </motion.div>
                  {message.role === 'user' && (
                    <div className="h-8 w-8 ml-2 rounded-full bg-gray-900 flex items-center justify-center">
                      <span className="text-xs text-white">You</span>
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="h-8 w-8 mr-2 rounded-full bg-gray-50 flex items-center justify-center">
                    <Image 
                      src="/logo.svg"
                      alt="Assistant"
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-gray-100 shadow-md">
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
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="relative">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How do I get started?"
              className="w-full p-3 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
            />
            <button
              type="submit" 
              disabled={!input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={input.trim() ? "text-gray-700" : "text-gray-300"}>
                <path d="m22 2-7 20-4-9-9-4Z"/>
                <path d="M22 2 11 13"/>
              </svg>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center text-xs text-gray-500">
            Powered by 
            <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="4" fill="#F3F4F6"/>
              <path d="M7 12h10M12 7v10" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="ml-1 font-medium">inkeep</span>
          </div>
          <button className="text-xs text-gray-600 hover:text-gray-800 font-medium">
            Get help
          </button>
        </div>
      </div>
    </div>
  );
}

// Cách sử dụng:
// 1. Import component: import { ChatbotDialog } from './path-to/chatbot-dialog';
// 2. Thêm state: const [isOpen, setIsOpen] = useState(false);
// 3. Render component: <ChatbotDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
// 4. Thêm nút để mở: <button onClick={() => setIsOpen(true)}>Mở Chatbot</button>