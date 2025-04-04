"use client";
import { ChatUI } from "@/features/chat/components/chat-ui";
import { useParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
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
  const documentTitle = useRef<string>("");
  const isFocused = useRef<boolean>(true);
  const messageProcessorRef = useRef<((newMessage: any) => void) | null>(null);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'loading' | 'newMessages' | 'error'>('idle');
  
  // Tạo client cho fetch API
  const fetchClient = {
    get: async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Không thể tải dữ liệu: ${response.status}`);
      }
      const json = await response.json();
      return { data: json.data?.documents || [] };
    }
  };

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
    // Tạo set lưu trữ tin nhắn đã xử lý để tránh trùng lặp
    const processedMessageIds = new Set<string>();
    
    messageProcessorRef.current = (newMessage) => {
      console.log("🔔 Nhận tin nhắn mới qua Realtime:", newMessage);
      
      // Tạo ID duy nhất cho mỗi tin nhắn để kiểm tra trùng lặp
      const messageUniqueId = `${newMessage.$id}_${newMessage.chatsId}`;
      
      // Nếu tin nhắn đã xử lý thì bỏ qua
      if (processedMessageIds.has(messageUniqueId)) {
        console.log(`⏭️ Bỏ qua tin nhắn đã xử lý qua realtime: ${newMessage.$id}`);
        return;
      }
      
      // Đánh dấu là đã xử lý
      processedMessageIds.add(messageUniqueId);
      
      // Giới hạn kích thước của set để tránh rò rỉ bộ nhớ
      if (processedMessageIds.size > 500) {
        // Xóa bớt 200 ID cũ nhất
        const idsArray = Array.from(processedMessageIds);
        processedMessageIds.clear();
        idsArray.slice(200).forEach(id => processedMessageIds.add(id));
      }
      
      // Kiểm tra xem tin nhắn mới có phải đã có trong danh sách không
      // Sử dụng hàm callback để đảm bảo truy cập state messages mới nhất
      setMessages((prevMessages) => {
        // Kiểm tra xem tin nhắn đã tồn tại chưa bằng ID
        if (prevMessages.some((msg) => msg.$id === newMessage.$id)) {
          console.log(`⏭️ Bỏ qua tin nhắn đã có trong danh sách: ${newMessage.$id}`);
          return prevMessages;
        }
        
        // Kiểm tra xem có phải tin nhắn tạm thời không
        const isTempMessage = prevMessages.some(
          (msg) => msg.content === newMessage.content && 
                   msg.memberId === newMessage.memberId && 
                   msg.$id.startsWith('temp-')
        );
        
        if (isTempMessage) {
          console.log(`⚠️ Phát hiện tin nhắn tạm thời, thay thế bằng tin nhắn thật: ${newMessage.$id}`);
          // Lọc ra tin nhắn tạm thời có cùng nội dung và người gửi
          const filteredMessages = prevMessages.filter(
            msg => !(msg.content === newMessage.content && 
                    msg.memberId === newMessage.memberId && 
                    msg.$id.startsWith('temp-'))
          );
          
          // Thêm tin nhắn mới vào
          const updatedMessages = [...filteredMessages, newMessage];
          
          // Đảm bảo tin nhắn được sắp xếp theo thời gian
          return updatedMessages.sort((a, b) => {
            const timeA = new Date(a.CreatedAt || a.$createdAt).getTime();
            const timeB = new Date(b.CreatedAt || b.$createdAt).getTime();
            return timeA - timeB;
          });
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

  // Thêm cơ chế polling để tự động tải tin nhắn mới định kỳ
  // Giải pháp này đặc biệt hữu ích khi làm việc với localhost hoặc khi Realtime không hoạt động
  useEffect(() => {
    if (!selectedChat || !selectedChat.$id) return;

    // Khởi tạo title khi component mount
    if (typeof window !== 'undefined' && documentTitle.current === "") {
      documentTitle.current = document.title;
    }

    // Hàm để lấy tin nhắn mới nhất
    const fetchLatestMessages = async () => {
      if (!selectedChat || !selectedChat.$id) return;
      
      try {
        setPollingStatus('loading');
        console.log("🔄 Đang polling tin nhắn mới...");
        
        // Lấy tin nhắn mới từ API
        const response: any = await fetchClient.get(
          `/api/chats/${selectedChat.$id}/messages`
        );
        
        const fetchedMessages = response.data;
        if (!fetchedMessages || !Array.isArray(fetchedMessages) || fetchedMessages.length === 0) {
          console.log("ℹ️ Không có tin nhắn mới khi polling");
          setPollingStatus('idle');
          return;
        }
        
        // Đảm bảo các tin nhắn được sắp xếp theo thời gian
        const sortedMessages = fetchedMessages.sort((a, b) => {
          const timeA = new Date(a.CreatedAt || a.$createdAt).getTime();
          const timeB = new Date(b.CreatedAt || b.$createdAt).getTime();
          return timeA - timeB;
        });
        
        // Xử lý tin nhắn mới để tránh trùng lặp
        let hasNewMessages = false;
        
        setMessages((prevMessages) => {
          // Tìm tin nhắn chưa có trong danh sách hiện tại
          const newMessages = sortedMessages.filter((newMsg) => {
            // Kiểm tra bằng ID
            const existsById = prevMessages.some(msg => msg.$id === newMsg.$id);
            if (existsById) return false;
            
            // Kiểm tra xem có phải tin nhắn tạm thời không
            const isTempVersion = prevMessages.some(
              msg => msg.content === newMsg.content && 
                    msg.memberId === newMsg.memberId && 
                    msg.$id.startsWith('temp-')
            );
            
            // Nếu là tin nhắn mới hoàn toàn, đánh dấu là có tin nhắn mới
            if (!isTempVersion) {
              hasNewMessages = true;
            }
            
            return true;
          });
          
          // Nếu không có tin nhắn mới, giữ nguyên danh sách cũ
          if (newMessages.length === 0) {
            console.log("ℹ️ Không phát hiện tin nhắn mới trong kết quả polling");
            return prevMessages;
          }
          
          console.log(`📥 Tìm thấy ${newMessages.length} tin nhắn mới khi polling`);
          
          // Kết hợp tin nhắn mới và tin nhắn hiện tại, loại bỏ tin nhắn tạm
          let mergedMessages = [...prevMessages];
          
          // Thêm từng tin nhắn mới và xử lý tin nhắn tạm thời
          newMessages.forEach(newMsg => {
            // Tìm tin nhắn tạm có nội dung tương tự để thay thế
            const tempIndex = mergedMessages.findIndex(
              msg => msg.content === newMsg.content && 
                    msg.memberId === newMsg.memberId && 
                    msg.$id.startsWith('temp-')
            );
            
            if (tempIndex !== -1) {
              // Thay thế tin nhắn tạm bằng tin nhắn thật
              console.log(`🔄 Thay thế tin nhắn tạm ${mergedMessages[tempIndex].$id} bằng tin nhắn thật ${newMsg.$id}`);
              mergedMessages[tempIndex] = newMsg;
            } else {
              // Thêm tin nhắn mới vào cuối
              mergedMessages.push(newMsg);
            }
          });
          
          // Lọc bỏ trùng lặp theo ID (phòng trường hợp)
          const uniqueMessages = mergedMessages.filter((msg, index, self) => 
            index === self.findIndex(m => m.$id === msg.$id)
          );
          
          // Sắp xếp tin nhắn theo thời gian
          return uniqueMessages.sort((a, b) => {
            const timeA = new Date(a.CreatedAt || a.$createdAt).getTime();
            const timeB = new Date(b.CreatedAt || b.$createdAt).getTime();
            return timeA - timeB;
          });
        });
        
        // Nếu có tin nhắn mới (không phải thay thế tin nhắn tạm thời)
        if (hasNewMessages) {
          // Hiển thị thông báo khi phát hiện tin nhắn mới 
          setPollingStatus('newMessages');
          
          // Chỉ phát âm thanh và cập nhật tiêu đề nếu tin nhắn không phải của người dùng hiện tại
          const newMessagesFromOthers = sortedMessages.some(msg => 
            msg.memberId !== memberId && 
            !messages.some(existingMsg => existingMsg.$id === msg.$id)
          );
          
          if (newMessagesFromOthers) {
            console.log("🔔 Phát hiện tin nhắn mới từ người khác qua polling");
            // Phát âm thanh thông báo nếu người dùng không ở tab hiện tại
            if (!isFocused.current && notificationAudioRef.current) {
              notificationAudioRef.current.play().catch(e => console.log("Không thể phát âm thanh: ", e));
            }
            
            // Cập nhật tiêu đề trang
            if (!isFocused.current && typeof document !== 'undefined') {
              document.title = `(1) Tin nhắn mới - ${documentTitle.current}`;
            }
          }
          
          // Tự động reset trạng thái sau 2 giây
          setTimeout(() => {
            setPollingStatus('idle');
          }, 2000);
        } else {
          setPollingStatus('idle');
        }
        
        // Scroll xuống khi có tin nhắn mới
        if (hasNewMessages && typeof window !== 'undefined') {
          setTimeout(() => {
            const messagesEndElement = document.getElementById('messages-end');
            if (messagesEndElement) {
              messagesEndElement.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        }
      } catch (error) {
        console.error("❌ Lỗi khi polling tin nhắn:", error);
        setPollingStatus('error');
        setTimeout(() => {
          setPollingStatus('idle');
        }, 2000);
      }
    };
    
    // Tải tin nhắn mới ngay khi chọn chat
    fetchLatestMessages();
    
    // Thiết lập interval để tự động tải tin nhắn mới sau 3 giây
    const pollingInterval = setInterval(fetchLatestMessages, 3000);
    
    // Xóa interval khi component unmount hoặc khi chat thay đổi
    return () => clearInterval(pollingInterval);
  }, [selectedChat, messages, memberId]);

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

    let isMounted = true; // Theo dõi component còn mounted không
    let isCreatingChat = false; // Biến cờ kiểm soát quá trình tạo chat

    const fetchChats = async () => {
      if (isCreatingChat) return; // Tránh gọi nhiều lần khi đang tạo chat

      try {
        setIsChatsLoading(true);
        const response = await fetch(`/api/chats?workspaceId=${workspaceId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch chats: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.data && data.data.documents && isMounted) {
          console.log("Fetched chats before deduplication:", data.data.documents.length);
          
          // Loại bỏ các chat trùng lặp bằng cách dùng Map với $id là key
          const uniqueChatsMap = new Map();
          data.data.documents.forEach((chat: Chats) => {
            // Chỉ thêm vào nếu chat chưa tồn tại trong Map hoặc ghi đè nếu đã tồn tại
            uniqueChatsMap.set(chat.$id, chat);
          });
          
          // Chuyển đổi Map thành mảng
          const uniqueChats = Array.from(uniqueChatsMap.values());
          console.log("Unique chats after deduplication:", uniqueChats.length);
          
          // Cập nhật documents với mảng đã được lọc bỏ trùng lặp
          data.data.documents = uniqueChats;
          
          // Kiểm tra có nhóm chat nào không
          const hasGroupChat = uniqueChats.some(
            (chat: Chats) => chat.isGroup === true
          );
          
          // Tạo nhóm chat mặc định nếu chưa có và đã có memberId
          if (!hasGroupChat && memberId && !isCreatingChat && isMounted) {
            // Đánh dấu đang tạo chat để tránh tạo nhiều lần
            isCreatingChat = true;
            setIsInitializing(true);

            try {
              console.log("Bắt đầu tạo nhóm chat mặc định cho workspace:", workspaceId);
              
              // Kiểm tra lần nữa xem đã có chat nhóm chưa để tránh race condition
              const doubleCheckResponse = await fetch(`/api/chats?workspaceId=${workspaceId}`);
              if (doubleCheckResponse.ok) {
                const doubleCheckData = await doubleCheckResponse.json();
                const hasGroup = doubleCheckData.data?.documents?.some(
                  (chat: Chats) => chat.isGroup === true
                );
                
                if (hasGroup) {
                  console.log("Phát hiện nhóm chat đã tồn tại trong lần kiểm tra thứ hai, hủy tạo mới");
                  if (isMounted) {
                    setIsInitializing(false);
                    // Tải lại chat
                    fetchChats();
                  }
                  return;
                }
              }
              
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
              
              // Sử dụng API initialize-default thay vì tự tạo chat
              const initResponse = await fetch('/api/chats/initialize-default', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  workspaceId,
                  workspaceName: chatName
                }),
              });
              
              if (!initResponse.ok) {
                throw new Error(`Failed to initialize default chat: ${initResponse.status}`);
              }
              
              const initData = await initResponse.json();
              console.log("Kết quả khởi tạo nhóm chat mặc định:", initData);
              
              if (isMounted) {
                // Tải lại danh sách chat sau khi tạo chat mặc định
                const refreshResponse = await fetch(`/api/chats?workspaceId=${workspaceId}`);
                if (refreshResponse.ok) {
                  const refreshData = await refreshResponse.json();
                  if (refreshData.data && refreshData.data.documents) {
                    // Loại bỏ trùng lặp một lần nữa
                    const refreshedChats = Array.from(
                      new Map(refreshData.data.documents.map((chat: Chats) => [chat.$id, chat])).values()
                    ) as (Chats & { members?: ChatMembers[] })[];
                    setChats(refreshedChats);
                    
                    // Tự động chọn chat nhóm
                    const defaultGroupChat = refreshedChats.find(
                      (chat: Chats) => chat.isGroup === true
                    );
                    
                    if (defaultGroupChat) {
                      setSelectedChat(defaultGroupChat);
                    } else if (refreshedChats.length > 0) {
                      setSelectedChat(refreshedChats[0]);
                    }
                  }
                }
              }
            } catch (error) {
              console.error("Error creating default chat:", error);
            } finally {
              if (isMounted) {
                setIsInitializing(false);
                isCreatingChat = false;
              }
            }
          } else {
            if (isMounted) {
              // Lưu chats vào state
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
          }
        }
      } catch (error) {
        if (isMounted) {
          setError(`Could not load chats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } finally {
        if (isMounted) {
          setIsChatsLoading(false);
        }
      }
    };

    fetchChats();

    return () => {
      isMounted = false; // Cleanup function để tránh setState sau khi unmount
    };
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
    
    console.log("Đang đồng bộ thành viên cho chat:", {
      chatId: selectedChat.$id,
      chatName: selectedChat.name,
      currentMembers: selectedChat.members,
      workspaceId
    });
    
    try {
      const response = await chatApi.syncMembers(selectedChat.$id, workspaceId);
      
      if (!response.data) {
        throw new Error("Failed to sync members");
      }
      
      console.log("Kết quả đồng bộ thành viên:", response.data);
      
      setSyncNotification(response.data.message || "Đã đồng bộ thành viên.");
      
      const chatsData = await chatApi.getChats(workspaceId);
      
      if (chatsData?.data?.documents) {
        // Loại bỏ các chat trùng lặp
        const uniqueChats = Array.from(
          new Map(chatsData.data.documents.map((chat: Chats) => [chat.$id, chat])).values()
        );
        
        console.log("Danh sách chat sau khi đồng bộ:", {
          total: uniqueChats.length,
          chats: uniqueChats.map((chat: any) => ({
            id: chat.$id,
            name: chat.name,
            isGroup: chat.isGroup,
            membersCount: chat.members?.length || 0
          }))
        });
        
        setChats(uniqueChats);
        
        const updatedSelectedChat = uniqueChats.find(
          (chat: Chats) => chat.$id === selectedChat.$id
        );
        
        if (updatedSelectedChat) {
          console.log("Cập nhật chat được chọn sau khi đồng bộ:", {
            id: updatedSelectedChat.$id,
            name: updatedSelectedChat.name,
            membersCount: updatedSelectedChat.members?.length || 0
          });
          
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
          {/* Hiển thị trạng thái polling và realtime */}
          {pollingStatus === 'newMessages' && (
            <div className="text-sm text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Tin nhắn mới đã được tải
            </div>
          )}
          
          {pollingStatus === 'loading' && (
            <div className="text-sm text-blue-600 dark:text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full flex items-center">
              <span className="h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
              Đang kiểm tra tin nhắn mới...
            </div>
          )}
          
          {pollingStatus === 'error' && (
            <div className="text-sm text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full flex items-center">
              <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
              Lỗi cập nhật tin nhắn
            </div>
          )}
          
          {newMessageNotification && (
            <div className="text-sm text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full flex items-center animate-pulse">
              <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
              {newMessageNotification}
            </div>
          )}
          
          {realtimeStatus && (
            <div className="text-sm text-purple-600 dark:text-purple-500 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full flex items-center">
              <span className="animate-pulse h-2 w-2 rounded-full bg-purple-500 mr-2"></span>
              {realtimeStatus}
            </div>
          )}
        </div>
      </div>
      
      {/* Audio cho thông báo tin nhắn mới */}
      <audio
        ref={notificationAudioRef}
        src="/sounds/notification.mp3"
        preload="auto"
      />
      
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