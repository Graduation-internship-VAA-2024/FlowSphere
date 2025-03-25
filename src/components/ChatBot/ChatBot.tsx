'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCreateWorkspace } from '@/features/workspaces/api/use-create-workspace';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useCurrentUser } from './hooks/userCurrent';
import { IntentAnalyzer } from './utils/intentAnalyzer';
import { SYSTEM_PROMPT } from './constants/prompts';
import { useCreateProject } from '@/features/projects/api/use-create-project';

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
  intent: 'create_workspace' | 'create_project' | 'manage_tasks';
  context?: string;
}

interface WorkspaceIntent {
  isCreating: boolean;
  name?: string;
}

interface ProjectIntent {
  isCreating: boolean;
  name?: string;
}

const intentAnalyzer = new IntentAnalyzer();

export function ChatbotDialog({ isOpen, onClose }: ChatbotDialogProps) {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();
  const createWorkspace = useCreateWorkspace();
  const createProject = useCreateProject();
  const workspaceId = useWorkspaceId();
  const [workspaceIntent, setWorkspaceIntent] = useState<WorkspaceIntent>({
    isCreating: false
  });
  const [projectIntent, setProjectIntent] = useState<ProjectIntent>({
    isCreating: false
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasWelcomed, setHasWelcomed] = useState(false);
  
  const exampleQuestions: ExampleQuestion[] = [
    { 
      text: "Create a new workspace for my team",
      intent: "create_workspace"
    },
    { 
      text: "I need a workspace for my marketing project",
      intent: "create_workspace",
      context: "marketing"
    },
    { 
      text: "Set up a new project in my workspace",
      intent: "create_project"
    },
    { 
      text: "Create a development workspace",
      intent: "create_workspace",
      context: "development"
    },
    {
      text: "Help me organize my project tasks",
      intent: "manage_tasks"
    }
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

  useEffect(() => {
    if (isOpen && user && !hasWelcomed && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now().toString(),
        content: `Xin chào ${user.name}! Tôi là trợ lý ảo của FlowSphere. 
        Tôi có thể giúp gì cho bạn?`,
        role: 'assistant' as const
      };
      setMessages([welcomeMessage]);
      setHasWelcomed(true);
    }
  }, [isOpen, user, hasWelcomed]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuestionClick = async (question: ExampleQuestion) => {
    setShowIntro(false);
    
    switch (question.intent) {
      case 'create_workspace':
        setWorkspaceIntent({ isCreating: true });
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: question.text,
          role: 'user'
        }, {
          id: (Date.now() + 1).toString(),
          content: `Tôi sẽ giúp bạn tạo một workspace${question.context ? ` cho ${question.context}` : ''}.
          
Bạn muốn đặt tên cho workspace là gì?

Gợi ý đặt tên:
• Ngắn gọn và dễ nhớ
• Phản ánh mục đích sử dụng
• Không sử dụng ký tự đặc biệt`,
          role: 'assistant'
        }]);
        break;

      case 'create_project':
        if (!workspaceId) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            content: question.text,
            role: 'user'
          }, {
            id: (Date.now() + 1).toString(),
            content: `Để tạo project, bạn cần phải có workspace trước. 

Hiện tại bạn chưa có workspace nào. Bạn có muốn:

1. Tạo workspace mới (Gõ "tạo workspace" hoặc bấm vào đây)
2. Hoặc chuyển đến trang workspace để chọn một workspace có sẵn

Lưu ý: Project luôn phải thuộc về một workspace để dễ dàng quản lý và tổ chức.`,
            role: 'assistant',
            actions: [{
              type: 'create_workspace',
              label: 'Tạo Workspace Mới'
            }, {
              type: 'view_workspaces',
              label: 'Xem Workspaces'
            }]
          }]);
          return;
        }
        // ... rest of create project logic
        break;
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user'
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Check for project creation intent first
      if (content.toLowerCase().includes('project') || 
          content.toLowerCase().includes('dự án')) {
        if (!workspaceId) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            content: `Để tạo hoặc quản lý project, bạn cần phải có workspace trước.

Bạn có thể:
1. Tạo workspace mới ngay bây giờ (Gõ "tạo workspace")
2. Chọn một workspace có sẵn (Tôi sẽ chuyển bạn đến trang workspaces)

Bạn muốn làm gì?`,
            role: 'assistant'
          }]);
          return;
        }
      }

      // Handle regular workspace creation
      if (workspaceIntent.isCreating && !workspaceIntent.name) {
        const workspaceName = content.trim();
        setWorkspaceIntent({ isCreating: true, name: workspaceName });
        
        // Tạo workspace và lấy response
        const response = await createWorkspace.mutateAsync({
          form: { name: workspaceName }
        });

        // Thêm tin nhắn xác nhận
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: `Đã tạo workspace "${workspaceName}" thành công! Đang chuyển hướng...`,
          role: 'assistant'
        }]);

        setTimeout(() => {
          router.push(`/workspaces/${response.data.$id}`);
          onClose();
        }, 2000);

        setWorkspaceIntent({ isCreating: false });
        return;
      }

      // Handle project creation only if workspace exists
      if (projectIntent.isCreating && !projectIntent.name) {
        if (!workspaceId) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            content: `Xin lỗi, bạn không thể tạo project khi chưa có workspace.

Hãy tạo workspace trước bằng cách gõ "tạo workspace" hoặc để tôi giúp bạn chuyển đến trang workspaces.`,
            role: 'assistant'
          }]);
          setProjectIntent({ isCreating: false });
          return;
        }
        const projectName = content.trim();
        setProjectIntent({ isCreating: true, name: projectName });
        
        // Create project
        const response = await createProject.mutateAsync({
          form: { 
            name: projectName,
            workspaceId: workspaceId // Make sure you have the current workspace ID
          }
        });

        // Add confirmation message
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: `Đã tạo project "${projectName}" thành công! Đang chuyển hướng...`,
          role: 'assistant'
        }]);

        // Redirect to new project
        setTimeout(() => {
          router.push(`/workspaces/${workspaceId}/projects/${response.data.$id}`);
          onClose();
        }, 2000);

        setProjectIntent({ isCreating: false });
        return;
      }

      // Phân tích ý định từ tin nhắn người dùng
      const intentAnalysis = intentAnalyzer.analyzeIntent(content);

      // Nếu phát hiện ý định tạo workspace với độ tin cậy cao
      if (intentAnalysis.type === 'create_workspace' && intentAnalysis.confidence > 0.6) {
        setWorkspaceIntent({ isCreating: true });
        const response = intentAnalyzer.generateResponse(intentAnalysis);

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: response,
          role: 'assistant'
        }]);
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
              ...newMessage,
              content: `
Người dùng: ${user?.name}
Email: ${user?.email}
Workspace hiện tại: ${workspaceId || 'Chưa có'}
Phân tích ý định: ${JSON.stringify(intentAnalysis)}
Yêu cầu: ${content}
              `
            }
          ]
        })
      });

      const data = await aiResponse.json();
      
      // Phân tích phản hồi từ AI để xác định ý định
      const aiMessage = data.response;
      const hasWorkspaceIntent = aiMessage.toLowerCase().includes('tạo workspace') ||
                                aiMessage.toLowerCase().includes('đặt tên workspace');

      if (hasWorkspaceIntent) {
        setWorkspaceIntent({ isCreating: true });
        // Thêm hướng dẫn chi tiết về đặt tên
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: `${aiMessage}

Một số gợi ý cho tên workspace:
• Ngắn gọn và dễ nhớ
• Liên quan đến mục đích sử dụng
• Chỉ sử dụng chữ cái, số và dấu gạch ngang
• Không sử dụng ký tự đặc biệt

Vui lòng cho tôi biết tên workspace bạn muốn tạo:`,
          role: 'assistant'
        }]);
        return;
      }

      // Thêm tin nhắn từ AI
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: aiMessage,
        role: 'assistant'
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        role: 'assistant'
      }]);
      setWorkspaceIntent({ isCreating: false });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (showIntro) {
      setShowIntro(false);
    }

    handleSendMessage(input);
  }, [input, showIntro]);

  const renderIntro = () => (
    <>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
          <span className="text-xs text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
      </div>
      <p className="text-gray-600 mb-4 text-sm">
        Hi! I can help you with:
        <span className="block mt-2 space-y-1">
          <span className="inline-block bg-gray-800 text-white px-2 py-1 rounded text-sm font-medium mr-2 mb-1">Workspaces</span>
          <span className="inline-block bg-gray-800 text-white px-2 py-1 rounded text-sm font-medium mr-2 mb-1">Projects</span>
          <span className="inline-block bg-gray-800 text-white px-2 py-1 rounded text-sm font-medium mr-2 mb-1">Task Management</span>
        </span>
      </p>
      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2 mt-6">
        EXAMPLE QUESTIONS
      </p>
      <div className="space-y-2">
        {exampleQuestions.map((question, index) => (
          <motion.div 
            key={index}
            className="p-3 cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg"
            onClick={() => handleQuestionClick(question)}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <p className="text-gray-700 text-sm">{question.text}</p>
          </motion.div>
        ))}
      </div>
    </>
  );

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
          {showIntro ? renderIntro() : (
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
                      whitespace-pre-wrap break-words
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