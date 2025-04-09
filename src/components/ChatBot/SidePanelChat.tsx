"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, Send } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCreateWorkspace } from "@/features/workspaces/api/use-create-workspace";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCurrentUser } from "./hooks/userCurrent";
import { IntentAnalyzer } from "./utils/intentAnalyzer";
import { SYSTEM_PROMPT } from "./constants/prompts";
import { useCreateProject } from "@/features/projects/api/use-create-project";
import { usePersistentChat } from "./hooks/usePersistentChat";
import { useChatContext } from "./context/ChatContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const intentAnalyzer = new IntentAnalyzer();

const exampleSuggestions = [
  "Tạo workspace mới",
  "Cách tạo project?",
  "Các tính năng của FlowSphere",
];

export const SidePanelChat = () => {
  const {
    isOpen,
    closeChat,
    initialMessage,
    setInitialMessage,
    apiSource,
    resetToDefaultApi,
  } = useChatContext();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useCurrentUser();
  const router = useRouter();
  const createWorkspace = useCreateWorkspace();
  const createProject = useCreateProject();
  const workspaceId = useWorkspaceId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const {
    messages,
    addMessage,
    clearMessages,
    showIntro,
    setShowIntro,
    hasWelcomed,
    setHasWelcomed,
  } = usePersistentChat();

  const [workspaceIntent, setWorkspaceIntent] = useState<{
    isCreating: boolean;
    name?: string;
  }>({
    isCreating: false,
    name: undefined,
  });

  const [projectIntent, setProjectIntent] = useState<{
    isCreating: boolean;
    name?: string;
  }>({
    isCreating: false,
    name: undefined,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Display welcome message when user opens chat for the first time
  useEffect(() => {
    if (
      isOpen &&
      user &&
      !hasWelcomed &&
      messages.length === 0 &&
      !initialMessage
    ) {
      addMessage({
        content: `Xin chào ${user.name}! Tôi là trợ lý ảo của FlowSphere. 
        Tôi có thể giúp gì cho bạn?`,
        role: "assistant",
      });
      setHasWelcomed(true);
    }
  }, [
    isOpen,
    user,
    hasWelcomed,
    messages.length,
    addMessage,
    setHasWelcomed,
    initialMessage,
  ]);

  // Handle initial message from AI analysis
  useEffect(() => {
    if (isOpen && initialMessage) {
      // Clear existing conversation when starting a new AI analysis
      clearMessages();
      setShowIntro(false);

      // Add the AI analysis as a message
      addMessage({
        content: initialMessage,
        role: "assistant",
      });

      // Reset initial message
      setInitialMessage("");
    }
  }, [
    isOpen,
    initialMessage,
    addMessage,
    clearMessages,
    setShowIntro,
    setInitialMessage,
  ]);

  // Thêm useEffect mới để theo dõi thay đổi apiSource
  useEffect(() => {
    // Khi chuyển từ gemini sang openrouter, hiển thị intro nếu không có tin nhắn
    if (apiSource === "openrouter" && messages.length === 0) {
      setShowIntro(true);
    }
  }, [apiSource, messages.length, setShowIntro]);

  // Focus vào ô input khi mở chatbot
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Apply body class when chat is open
  useEffect(() => {
    if (!isMounted) return;

    if (isOpen) {
      document.body.classList.add("chatbot-open");
    } else {
      document.body.classList.remove("chatbot-open");
    }
  }, [isOpen, isMounted]);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSendMessage(suggestion);
    setShowIntro(false);
  };

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || input.trim();
    if (!messageContent) return;

    // Add user message
    addMessage({
      content: messageContent,
      role: "user",
    });

    setInput("");
    setIsTyping(true);
    setShowIntro(false);

    try {
      console.log("Current API source:", apiSource); // Thêm log để debug

      // Phân nhánh theo nguồn API
      if (apiSource === "gemini") {
        console.log("Using Gemini API for continued analysis");
        // Sử dụng Gemini API để tiếp tục phân tích
        const geminiResponse = await fetch("/api/chat/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: messageContent }],
          }),
        });

        if (!geminiResponse.ok) {
          throw new Error("Failed to get response from Gemini");
        }

        const data = await geminiResponse.json();
        addMessage({
          content: data.response,
          role: "assistant",
        });
        setIsTyping(false);
        return;
      }

      console.log("Using OpenRouter API for regular chat");
      // Phân tích intent (chỉ áp dụng cho OpenRouter API)
      const intentAnalysis = intentAnalyzer.analyzeIntent(messageContent);

      // Handle project creation
      if (projectIntent.isCreating && !projectIntent.name) {
        if (!workspaceId) {
          addMessage({
            content: "Bạn cần chọn workspace trước khi tạo project.",
            role: "assistant",
          });
          setProjectIntent({ isCreating: false, name: undefined });
          return;
        }

        const projectName = messageContent.trim();
        setProjectIntent({ isCreating: true, name: projectName });

        // Create project
        const response = await createProject.mutateAsync({
          form: {
            name: projectName,
            workspaceId,
          },
        });

        // Add confirmation message
        addMessage({
          content: `Đã tạo project "${projectName}" thành công! Đang chuyển hướng...`,
          role: "assistant",
        });

        // Redirect to new project
        setTimeout(() => {
          router.push(
            `/workspaces/${workspaceId}/projects/${response.data.$id}`
          );
          closeChat();
        }, 2000);

        setProjectIntent({ isCreating: false, name: undefined });
        return;
      }

      // Handle workspace creation
      if (workspaceIntent.isCreating && !workspaceIntent.name) {
        const workspaceName = messageContent.trim();
        setWorkspaceIntent({ isCreating: true, name: workspaceName });

        // Tạo workspace và lấy response
        const response = await createWorkspace.mutateAsync({
          form: { name: workspaceName },
        });

        // Thêm tin nhắn xác nhận
        addMessage({
          content: `Đã tạo workspace "${workspaceName}" thành công! Đang chuyển hướng...`,
          role: "assistant",
        });

        setTimeout(() => {
          router.push(`/workspaces/${response.data.$id}`);
          closeChat();
        }, 2000);

        setWorkspaceIntent({ isCreating: false, name: undefined });
        return;
      }

      // Xử lý ý định tạo project
      if (
        intentAnalysis.type === "create_project" &&
        intentAnalysis.confidence > 0.6
      ) {
        if (!workspaceId) {
          addMessage({
            content: `Bạn đang ở ngoài workspace. Vui lòng:
1. Chọn một workspace từ menu điều hướng
2. Hoặc tạo workspace mới nếu chưa có
3. Sau đó quay lại đây để tạo project`,
            role: "assistant",
          });
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
          role: "assistant",
        });
        return;
      }

      // Nếu phát hiện ý định tạo workspace với độ tin cậy cao
      if (
        intentAnalysis.type === "create_workspace" &&
        intentAnalysis.confidence > 0.6
      ) {
        setWorkspaceIntent({ isCreating: true, name: undefined });
        const response = intentAnalyzer.generateResponse(intentAnalysis);

        addMessage({
          content: response,
          role: "assistant",
        });
        return;
      }

      // Gọi OpenRouter API với context phong phú hơn
      const aiResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            ...messages,
            {
              role: "user",
              content: `
Người dùng: ${user?.name}
Email: ${user?.email}
Workspace hiện tại: ${workspaceId || "Chưa có"}
Phân tích ý định: ${JSON.stringify(intentAnalysis)}
Yêu cầu: ${messageContent}
              `,
            },
          ],
        }),
      });

      const data = await aiResponse.json();

      // Phân tích phản hồi từ AI
      const aiMessage = data.response;
      const hasWorkspaceIntent =
        aiMessage.toLowerCase().includes("tạo workspace") ||
        aiMessage.toLowerCase().includes("đặt tên workspace");

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
          role: "assistant",
        });
        return;
      }

      // Thêm tin nhắn từ AI
      addMessage({
        content: aiMessage,
        role: "assistant",
      });
    } catch (error) {
      console.error("Error:", error);
      addMessage({
        content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
        role: "assistant",
      });
      setWorkspaceIntent({ isCreating: false, name: undefined });
    } finally {
      setIsTyping(false);
    }
  };

  // Thêm hàm handleResetApi để xóa tin nhắn khi chuyển API
  const handleResetApi = () => {
    console.log("Handling reset API request");
    // Xóa tất cả tin nhắn hiện tại
    clearMessages();

    // Đặt lại các trạng thái
    setInput("");
    setIsTyping(false);
    setWorkspaceIntent({ isCreating: false, name: undefined });
    setProjectIntent({ isCreating: false, name: undefined });

    // Làm mới intro sau khi reset
    setShowIntro(true);
    setHasWelcomed(false);

    // Đặt lại API về mặc định
    resetToDefaultApi();

    // Thông báo người dùng
    toast.success(
      "Đã kết thúc phiên phân tích và chuyển về chatbot thông thường"
    );
  };

  // Render introduction screen
  const renderIntro = () => (
    <div className="py-8 flex flex-col items-center justify-center h-full">
      <div className="w-16 h-16 mb-4 bg-violet-100 rounded-full flex items-center justify-center">
        <Image
          src="/logo.svg"
          alt="FlowSphere Logo"
          width={32}
          height={32}
          className="object-contain"
        />
      </div>
      <h3 className="text-lg font-medium mb-2">Assistant FlowSphere</h3>
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
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
            <div>
              <h2 className="font-medium">Trợ lý FlowSphere</h2>
              {apiSource === "gemini" && (
                <p className="text-xs text-blue-500">Đang sử dụng Gemini AI</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {apiSource === "gemini" && (
              <button
                onClick={handleResetApi}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md"
              >
                Kết thúc phân tích
              </button>
            )}
            <button
              onClick={closeChat}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {showIntro && messages.length === 0 ? (
            renderIntro()
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
                    damping: 30,
                  }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
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

                  <div
                    className={`max-w-[85%] p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-white rounded-tr-none ml-2"
                        : "bg-gray-100 text-gray-800 rounded-tl-none"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words prose prose-sm max-w-none dark:prose-invert">
                      {message.role === "user" ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: message.content.replace(/\n/g, "<br />"),
                          }}
                        />
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Styling cho các elements trong markdown
                              h1: (props) => (
                                <h1
                                  {...props}
                                  className="text-lg font-semibold my-2"
                                />
                              ),
                              h2: (props) => (
                                <h2
                                  {...props}
                                  className="text-base font-semibold my-1.5"
                                />
                              ),
                              h3: (props) => (
                                <h3
                                  {...props}
                                  className="text-sm font-semibold my-1"
                                />
                              ),
                              ul: (props) => (
                                <ul
                                  className="pl-4 list-disc my-1"
                                  {...props}
                                />
                              ),
                              ol: (props) => (
                                <ol
                                  className="pl-4 list-decimal my-1"
                                  {...props}
                                />
                              ),
                              li: (props) => (
                                <li className="my-0.5" {...props} />
                              ),
                              p: (props) => <p className="my-1" {...props} />,
                              a: (props) => (
                                <a
                                  className="text-blue-500 hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  {...props}
                                />
                              ),
                              blockquote: (props) => (
                                <blockquote
                                  className="border-l-2 border-gray-300 pl-2 my-1 italic"
                                  {...props}
                                />
                              ),
                              code: ({ className, children, ...props }) => {
                                const inline = !className;
                                return inline ? (
                                  <code
                                    className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                ) : (
                                  <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                                    <code {...props} className={className}>
                                      {children}
                                    </code>
                                  </pre>
                                );
                              },
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="h-8 w-8 ml-2 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
                      {user?.name?.[0]?.toUpperCase() || "U"}
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
                  <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none">
                    <div className="flex space-x-2">
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: 0,
                        }}
                        className="w-2 h-2 rounded-full bg-gray-400"
                      />
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: 0.2,
                        }}
                        className="w-2 h-2 rounded-full bg-gray-400"
                      />
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: 0.4,
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="border-t p-3"
        >
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
              disabled={!input.trim() || isTyping}
              className={`p-1.5 rounded-full ${
                input.trim() && !isTyping
                  ? "bg-primary text-white"
                  : "bg-gray-300 text-gray-500"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-400 text-center mt-2">
            Nhấn Ctrl+I để mở/đóng trợ lý
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
};
