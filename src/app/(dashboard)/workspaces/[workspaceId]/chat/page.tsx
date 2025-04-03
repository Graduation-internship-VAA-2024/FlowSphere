"use client";
import { ChatUI } from "@/features/chat/components/chat-ui";
import { useParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Chats, ChatMembers } from "@/features/chat/type";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { chatApi } from "@/features/chat/api";
import { useRealtimeMessages } from "@/hooks/use-realtime";

export default function ChatPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [selectedChat, setSelectedChat] = useState<Chats & { members?: ChatMembers[] } | null>(null);
  const [memberId, setMemberId] = useState<string>("");
  const [chats, setChats] = useState<(Chats & { members?: ChatMembers[] })[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatsLoading, setIsChatsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null);
  const [newMessageNotification, setNewMessageNotification] = useState<string | null>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const documentTitle = useRef<string>(typeof window !== 'undefined' ? document.title : '');
  const isFocused = useRef<boolean>(true);
  const messageProcessorRef = useRef<((newMessage: any) => void) | null>(null);

  // Lắng nghe sự kiện focus và blur của cửa sổ
  useEffect(() => {
    // Chỉ chạy ở phía client
    if (typeof window !== 'undefined') {
      // Lưu title ban đầu
      documentTitle.current = document.title;
      
      // Tạo element audio để phát âm thanh thông báo
      const audio = new Audio("/notification.mp3");
      notificationAudioRef.current = audio;
      
      const handleFocus = () => {
        isFocused.current = true;
        // Khôi phục tiêu đề khi focus vào trang
        document.title = documentTitle.current;
      };
      
      const handleBlur = () => {
        isFocused.current = false;
      };
      
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
      
      return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
      };
    }
  }, []);

  // Định nghĩa message processor callback một lần
  useEffect(() => {
    messageProcessorRef.current = (newMessage) => {
      console.log("🔔 Nhận tin nhắn mới qua Realtime:", newMessage);
      
      // Kiểm tra xem tin nhắn mới có phải đã có trong danh sách không
      // Sử dụng hàm callback để đảm bảo truy cập state messages mới nhất
      setMessages((prevMessages) => {
        // Kiểm tra xem tin nhắn đã tồn tại chưa bằng ID
        if (prevMessages.some((msg) => msg.$id === newMessage.$id)) {
          console.log(`⏭️ Bỏ qua tin nhắn đã có: ${newMessage.$id}`);
          return prevMessages;
        }
        
        console.log(`✅ Thêm tin nhắn mới vào danh sách: ${newMessage.$id}`);
        
        // Kiểm tra xem tin nhắn có phải của người dùng hiện tại không
        const isFromCurrentUser = newMessage.memberId === memberId;
        
        if (!isFromCurrentUser) {
          // Hiển thị thông báo khi có tin nhắn mới từ người khác
          const senderName = newMessage.senderName || 'Ai đó';
          setNewMessageNotification(`Tin nhắn mới từ ${senderName}`);
          
          // Phát âm thanh thông báo
          if (notificationAudioRef.current) {
            notificationAudioRef.current.play().catch(e => console.log("Không thể phát âm thanh: ", e));
          }
          
          // Thay đổi tiêu đề trang nếu người dùng không ở tab này
          if (!isFocused.current && typeof document !== 'undefined') {
            document.title = `(1) Tin nhắn mới - ${documentTitle.current}`;
          }
          
          // Ẩn thông báo sau 5 giây
          setTimeout(() => {
            setNewMessageNotification(null);
          }, 5000);
        }
        
        // Bổ sung thông tin người gửi nếu có
        let enrichedMessage = { ...newMessage };
        
        // Nếu có tên người gửi từ realtime, sử dụng nó
        if (newMessage.senderName) {
          console.log(`👤 Tin nhắn từ: ${newMessage.senderName}`);
        }
        
        // Thêm tin nhắn mới vào cuối danh sách (thứ tự tăng dần theo thời gian)
        const updatedMessages = [...prevMessages, enrichedMessage];
        
        // Đảm bảo tin nhắn được sắp xếp theo thời gian
        return updatedMessages.sort((a, b) => {
          const timeA = new Date(a.CreatedAt || a.$createdAt).getTime();
          const timeB = new Date(b.CreatedAt || b.$createdAt).getTime();
          return timeA - timeB;
        });
      });
      
      // Scroll xuống dưới cùng khi có tin nhắn mới
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          const messagesEndElement = document.getElementById('messages-end');
          if (messagesEndElement) {
            messagesEndElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    };
  }, [memberId]);

  // Sử dụng hook realtime để nhận tin nhắn mới - luôn gọi với callback wrapper
  const { isConnected } = useRealtimeMessages(
    selectedChat?.$id || null,
    (newMessage) => {
      if (messageProcessorRef.current) {
        messageProcessorRef.current(newMessage);
      }
    }
  );

  // Hiển thị trạng thái realtime khi kết nối thay đổi
  useEffect(() => {
    if (isConnected && selectedChat) {
      setRealtimeStatus("Realtime đã kết nối");
      // Ẩn thông báo sau 3 giây
      const timer = setTimeout(() => {
        setRealtimeStatus(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, selectedChat]);

  // Fetch member ID
  useEffect(() => {
    if (!workspaceId) return;

    const fetchMemberId = async () => {
      try {
        const response = await fetch(`/api/members/me?workspaceId=${workspaceId}`);
        
        if (response.status === 404) {
          // User is not a member of this workspace
          setError("You are not a member of this workspace. Please join the workspace to access chat.");
          setIsLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch member: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.data) {
          setMemberId(data.data.$id);
          // Lấy tên workspace từ member data nếu có
          if (data.data.workspaceName) {
            setWorkspaceName(data.data.workspaceName);
          }
        } else {
          throw new Error("No member data received");
        }
      } catch (error) {
        console.error("Error fetching member:", error);
        setError(`Could not get member information: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberId();
  }, [workspaceId]);

  // Fetch chats
  useEffect(() => {
    if (!workspaceId || isInitializing) return;

    const fetchChats = async () => {
      try {
        const response = await fetch(`/api/chats?workspaceId=${workspaceId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch chats: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.data && data.data.documents) {
          // Kiểm tra có nhóm chat nào không
          const hasGroupChat = data.data.documents.some(
            (chat: Chats) => chat.isGroup === true
          );
          
          if (!hasGroupChat && memberId) {
            // Nếu không có nhóm chat và đã có memberId, tạo một nhóm chat mặc định
            setIsInitializing(true);
            try {
              // Lấy thông tin workspace để lấy tên chính xác
              const wsResponse = await fetch(`/api/workspaces/${workspaceId}`);
              
              let chatName = "Nhóm chung";
              
              if (wsResponse.ok) {
                const workspaceData = await wsResponse.json();
                if (workspaceData?.data?.name) {
                  chatName = workspaceData.data.name;
                }
              } else {
                console.error("Không thể lấy thông tin workspace");
              }
              
              // Tạo một nhóm chat mới
              const newChat = await chatApi.createChat({
                workspaceId,
                name: chatName,
                isGroup: true
              });
              
              if (newChat.data) {
                try {
                  // Đồng bộ tất cả thành viên vào nhóm chat mới
                  const syncResult = await chatApi.syncMembers(newChat.data.$id, workspaceId);
                  console.log('Sync result:', syncResult);
                  
                  // Lấy lại chat với thành viên mới
                  const updatedChatResponse = await fetch(`/api/chats/${newChat.data.$id}`);
                  if (updatedChatResponse.ok) {
                    const updatedChatData = await updatedChatResponse.json();
                    if (updatedChatData?.data) {
                      // Thay thế chat mới bằng phiên bản có members
                      data.data.documents = data.data.documents.filter((c: any) => c.$id !== newChat.data.$id);
                      data.data.documents.push(updatedChatData.data);
                    }
                  }
                } catch (syncError) {
                  console.error("Error syncing members:", syncError);
                }
              }
            } catch (error) {
              console.error("Error creating default chat:", error);
            } finally {
              setIsInitializing(false);
            }
          }
          
          setChats(data.data.documents);
          
          // Nếu có chat và chưa chọn chat nào, chọn chat đầu tiên
          if (data.data.documents.length > 0 && !selectedChat) {
            // Ưu tiên chọn nhóm chat (group chat)
            const defaultGroupChat = data.data.documents.find(
              (chat: Chats) => chat.isGroup === true
            );
            
            if (defaultGroupChat) {
              setSelectedChat(defaultGroupChat);
            } else if (data.data.documents.length > 0) {
              setSelectedChat(data.data.documents[0]);
            }
          }
        }
      } catch (error) {
        setError(`Could not load chats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsChatsLoading(false);
      }
    };

    fetchChats();
  }, [workspaceId, memberId, isInitializing, selectedChat]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (!selectedChat?.$id) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chats/${selectedChat.$id}/messages`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.data && data.data.documents) {
          // Sắp xếp tin nhắn theo thứ tự tăng dần thời gian (tin nhắn cũ nhất lên trên)
          const sortedMessages = [...data.data.documents].sort((a, b) => {
            const timeA = new Date(a.CreatedAt || a.$createdAt).getTime();
            const timeB = new Date(b.CreatedAt || b.$createdAt).getTime();
            return timeA - timeB;
          });
          setMessages(sortedMessages);
        }
      } catch (error) {
        console.error(`Could not load messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    fetchMessages();
  }, [selectedChat?.$id]);

  const handleSelectChat = (chat: Chats & { members?: ChatMembers[] }) => {
    setSelectedChat(chat);
  };

  const handleSyncMembers = async () => {
    if (!selectedChat?.$id || isSyncing) return;
    
    setIsSyncing(true);
    setSyncNotification(null);
    try {
      const response = await chatApi.syncMembers(selectedChat.$id, workspaceId);
      
      if (!response.data) {
        throw new Error("Failed to sync members");
      }
      
      setSyncNotification(response.data.message || "Đã đồng bộ thành viên.");
      
      const chatsData = await chatApi.getChats(workspaceId);
      
      if (chatsData?.data?.documents) {
        setChats(chatsData.data.documents);
        
        const updatedSelectedChat = chatsData.data.documents.find(
          (chat: Chats) => chat.$id === selectedChat.$id
        );
        
        if (updatedSelectedChat) {
          setSelectedChat(updatedSelectedChat);
        }
      }
      
      setTimeout(() => {
        setSyncNotification(null);
      }, 5000);
    } catch (error) {
      console.error("Error syncing members:", error);
      setError(`Failed to sync members: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!selectedChat?.$id || (!content.trim() && !file)) return;
    
    setIsSending(true);
    
    // Tạo ID tạm thời với thời gian để đảm bảo duy nhất
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Tạo tạm một tin nhắn để hiển thị ngay lập tức
    const tempMessage = {
      $id: tempId,
      memberId,
      chatsId: selectedChat.$id,
      content: content,
      CreatedAt: new Date().toISOString(),
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      // Thêm tên người gửi để hiển thị ngay lập tức
      senderName: "Bạn"
    };
    
    // Thêm tin nhắn tạm thời vào danh sách ngay lập tức để UX nhanh hơn
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, tempMessage];
      
      // Đảm bảo tin nhắn được sắp xếp theo thời gian
      return updatedMessages.sort((a, b) => {
        const timeA = new Date(a.CreatedAt || a.$createdAt).getTime();
        const timeB = new Date(b.CreatedAt || b.$createdAt).getTime();
        return timeA - timeB;
      });
    });
    
    // Scroll to newest message
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const messagesEndElement = document.getElementById('messages-end');
        if (messagesEndElement) {
          messagesEndElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
    
    try {
      // Chỉ gửi tin nhắn, không cập nhật thành viên
      let messageResponse;
      
      if (file) {
        // Handle file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatsId', selectedChat.$id);
        formData.append('memberId', memberId);
        
        messageResponse = await fetch('/api/chats/upload', {
          method: 'POST',
          body: formData
        });
      } else {
        // Gửi tin nhắn văn bản
        const response = await fetch(`/api/chats/${selectedChat.$id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            memberId,
            content,
            chatsId: selectedChat.$id,
          })
        });
        
        messageResponse = response;
      }
      
      if (!messageResponse.ok) {
        throw new Error(`Failed to send message: ${messageResponse.status}`);
      }
      
      const data = await messageResponse.json();
      
      if (data.data) {
        console.log("✅ Tin nhắn đã được gửi:", data.data);
        
        // Thay thế tin nhắn tạm thời bằng tin nhắn thật từ server
        setMessages((prevMessages) => {
          // Tạo mảng mới không bao gồm tin nhắn tạm thời
          const filteredMessages = prevMessages.filter(msg => msg.$id !== tempId);
          
          // Kiểm tra xem tin nhắn từ server đã tồn tại trong danh sách chưa
          const messageExists = filteredMessages.some(msg => msg.$id === data.data.$id);
          
          // Nếu chưa tồn tại, thêm vào
          if (!messageExists) {
            const updatedMessages = [...filteredMessages, data.data];
            // Đảm bảo tin nhắn được sắp xếp theo thời gian
            return updatedMessages.sort((a, b) => {
              const timeA = new Date(a.CreatedAt || a.$createdAt).getTime();
              const timeB = new Date(b.CreatedAt || b.$createdAt).getTime();
              return timeA - timeB;
            });
          }
          
          return filteredMessages;
        });
      }
    } catch (error) {
      console.error("❌ Lỗi khi gửi tin nhắn:", error);
      
      // Nếu lỗi, xóa tin nhắn tạm
      setMessages((prevMessages) => 
        prevMessages.filter(msg => msg.$id !== tempId)
      );
      
      // Hiển thị thông báo lỗi
      alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setIsChatsLoading(true);
    
    // Trigger reloading data by forcing the useEffects to run again
    if (workspaceId) {
      // The member ID and chats fetching logic is in useEffects
      // Just reset the states, and the effects will handle the fetching
      setMemberId("");
      setChats([]);
    }
  };

  // Function to handle joining workspace
  const handleJoinWorkspace = async () => {
    // This is a placeholder for joining workspace functionality
    // You would need to implement this based on your workspace join process
    try {
      alert("Please implement workspace joining functionality");
      // Example implementation would be something like:
      // await fetch(`/api/workspaces/${workspaceId}/join`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ code: 'invite-code-here' }),
      // });
      // Then retry loading
      handleRetry();
    } catch (error) {
      console.error("Error joining workspace:", error);
      setError("Failed to join workspace. Please try again.");
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Chat {workspaceName && `- ${workspaceName}`}</h1>
        <div className="flex items-center gap-2">
          {newMessageNotification && (
            <div className="text-sm text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full flex items-center animate-pulse">
              <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
              {newMessageNotification}
            </div>
          )}
          {realtimeStatus && (
            <div className="text-sm text-green-500 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full flex items-center">
              <span className="animate-pulse h-2 w-2 rounded-full bg-green-500 mr-2"></span>
              {realtimeStatus}
            </div>
          )}
        </div>
      </div>
      
      <Suspense fallback={<ChatSkeleton />}>
        {error && error.includes("not a member") ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="mb-6 p-4 rounded-full bg-muted">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Join Workspace to Chat</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              You need to be a member of this workspace to access the chat feature.
            </p>
            <div className="flex gap-4">
              <Button onClick={handleJoinWorkspace} className="gap-2">
                Join Workspace
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </div>
        ) : (
          <ChatUI 
            workspaceId={workspaceId}
            selectedChat={selectedChat}
            memberId={memberId}
            chats={chats}
            isLoading={isLoading || isInitializing}
            isChatsLoading={isChatsLoading}
            isSyncing={isSyncing}
            error={error}
            syncNotification={syncNotification}
            onSelectChat={handleSelectChat}
            onSyncMembers={handleSyncMembers}
            onRetry={handleRetry}
            onSendMessage={handleSendMessage}
            messages={messages}
            isSending={isSending}
            isRealtimeConnected={isConnected}
          />
        )}
      </Suspense>
    </div>
  );
}

// Skeleton loader for chat interface
function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      <Skeleton className="w-80 h-full" />
      <Skeleton className="flex-1 h-full" />
    </div>
  );
}