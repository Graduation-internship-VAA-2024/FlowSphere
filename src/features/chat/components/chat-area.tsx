import React, { useRef, useState, useEffect, useCallback } from "react";
import { Chats, ChatMembers, Messages } from "../type";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  UserPlus,
  User,
  ChevronDown,
  RefreshCw,
  X,
  ArrowUpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatInput } from "./chat-input";
import { ChatHeader } from "./chat-header";
import { ChatMessage } from "./chat-message";
import Link from "next/link";
import { chatApi } from "../api";
import { MediaGallerySidebarContent } from "./media-gallery-sidebar-content";
import { MessageSearch } from "./message-search";

interface ChatAreaProps {
  chats?: Chats & {
    members?: (ChatMembers & {
      memberDetails?: {
        name?: string;
        email?: string;
        userId?: string;
      };
    })[];
    totalWorkspaceMembers?: number;
  };
  memberId: string;
  onSyncMembers?: () => void;
  onAddAllMembers?: () => void;
  isSyncing?: boolean;
  messages?: Messages[];
  isLoading?: boolean;
  error?: any;
  onSendMessage: (content: string, file?: File) => void;
  isSending?: boolean;
  syncNotification?: string | null;
  isRealtimeConnected?: boolean;
  highlightedMessage?: string | null;
  onJumpToMessage: (messageId: string) => void;
  scrollPositionRef: React.MutableRefObject<number | null>;
}

// Sử dụng React.memo cho ChatArea
export const ChatArea = React.memo(
  ({
    chats,
    memberId,
    onSyncMembers,
    onAddAllMembers,
    isSyncing = false,
    messages = [],
    isLoading = false,
    error = null,
    onSendMessage,
    isSending = false,
    syncNotification = null,
    isRealtimeConnected = false,
    highlightedMessage = null,
    onJumpToMessage,
    scrollPositionRef,
  }: ChatAreaProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isAddingMembers, setIsAddingMembers] = useState(false);
    const [addMembersNotification, setAddMembersNotification] = useState<
      string | null
    >(null);
    const [membersMap, setMembersMap] = useState<Record<string, string>>({});
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [localIsSyncing, setLocalIsSyncing] = useState(false); // Local syncing state
    const [mediaGallerySidebarOpen, setMediaGallerySidebarOpen] =
      useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const messageRefsMap = useRef<Record<string, HTMLDivElement | null>>({});
    const [showReturnBanner, setShowReturnBanner] = useState(false);
    const lastScrollPositionRef = useRef<number | null>(null);
    const [lastScrollPosition, setLastScrollPosition] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Messages[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedResult, setSelectedResult] = useState<Messages | null>(null);

    // Check if the workspace only has the current user as member
    const hasOnlyCurrentUser =
      chats?.members?.length === 1 &&
      chats.members[0].memberId === memberId &&
      chats.isGroup; // Chỉ áp dụng cho nhóm chat

    console.log("ChatArea Check:", {
      memberId,
      chatId: chats?.$id,
      membersCount: chats?.members?.length || 0,
      members: chats?.members?.map((m) => ({
        id: m.memberId,
        isCurrentUser: m.memberId === memberId,
      })),
      hasOnlyCurrentUser,
    });

    // Load members information
    useEffect(() => {
      if (chats?.members) {
        const newMembersMap: Record<string, string> = {};
        chats.members.forEach((member) => {
          if (member.memberDetails?.name) {
            newMembersMap[member.memberId] = member.memberDetails.name;
          }
        });
        setMembersMap(newMembersMap);
      }
    }, [chats?.members]);

    // Tự động đánh dấu tin nhắn đã đọc khi người dùng đang xem cuộc trò chuyện
    useEffect(() => {
      if (chats && messages.length > 0) {
        // Lọc các tin nhắn chưa đọc và không phải do người dùng hiện tại gửi
        const unreadMessages = messages.filter(
          (msg) => msg.memberId !== memberId
        );

        // Đánh dấu tất cả tin nhắn chưa đọc là đã đọc
        unreadMessages.forEach((msg) => {
          if (msg.$id) {
            chatApi.markMessageAsRead(chats.$id, msg.$id);
          }
        });
      }
    }, [messages, chats, memberId]);

    // Scroll to bottom when the component mounts or messages change
    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    // Handle scroll events to show/hide scroll button
    useEffect(() => {
      const scrollAreaElement = scrollRef.current;
      if (!scrollAreaElement) return;

      const handleScroll = () => {
        if (scrollAreaElement) {
          const { scrollHeight, scrollTop, clientHeight } = scrollAreaElement;
          const atBottom =
            Math.abs(scrollHeight - scrollTop - clientHeight) < 30;
          setIsAtBottom(atBottom);
          setShowScrollButton(!atBottom && messages.length > 4);
        }
      };

      scrollAreaElement.addEventListener("scroll", handleScroll);
      return () => {
        scrollAreaElement.removeEventListener("scroll", handleScroll);
      };
    }, [messages.length]);

    // Automatically scroll to bottom after sending a message
    useEffect(() => {
      if (!isSending) {
        scrollToBottom();
      }
    }, [isSending]);

    // Scroll to bottom function
    const scrollToBottom = () => {
      if (isAtBottom && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };

    // Handle manual scroll to bottom
    const handleScrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        setShowScrollButton(false);
        setIsAtBottom(true);
      }
    };

    // Auto sync members when chat loads if necessary
    useEffect(() => {
      if (chats && chats.isGroup && !isSyncing && !localIsSyncing) {
        // No longer checking for member count differences or showing automatic alerts
        // This was causing the "Phát hiện thay đổi thành viên" message
      }
    }, [chats, isSyncing, localIsSyncing]);

    // Function to register message refs - không sử dụng setState
    const registerMessageRef = useCallback(
      (id: string, ref: HTMLDivElement | null) => {
        if (id && ref) {
          messageRefsMap.current[id] = ref;
        }
      },
      []
    );

    // Hàm để cuộn đến một tin nhắn cụ thể
    const jumpToMessage = useCallback((messageId: string) => {
      // Lưu vị trí scroll hiện tại vào cả state và ref
      if (scrollRef.current) {
        const currentPosition = (scrollRef.current as any).scrollTop;
        setLastScrollPosition(currentPosition);
        lastScrollPositionRef.current = currentPosition;
        console.log("Scrolled to:", currentPosition);
      }

      // Tìm và cuộn đến tin nhắn
      setTimeout(() => {
        const messageEl = document.getElementById(`message-${messageId}`);
        if (messageEl) {
          messageEl.scrollIntoView({ behavior: "smooth", block: "center" });

          // Highlight message
          messageEl.classList.add("bg-accent");
          setTimeout(() => {
            messageEl.classList.remove("bg-accent");
          }, 2000);

          // Hiển thị banner để quay lại vị trí ban đầu
          setShowReturnBanner(true);
        } else {
          console.error(`Không tìm thấy tin nhắn có ID: message-${messageId}`);
        }
      }, 100);
    }, []);

    // Hàm để quay lại vị trí cuộn trước đó
    const returnToLastPosition = useCallback(() => {
      if (scrollRef.current) {
        if (
          lastScrollPositionRef.current &&
          lastScrollPositionRef.current > 0
        ) {
          // Sử dụng giá trị từ ref để đảm bảo luôn có giá trị mới nhất
          (scrollRef.current as any).scrollTop = lastScrollPositionRef.current;
        } else {
          // Nếu không có vị trí trước đó, cuộn đến tin nhắn mới nhất
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        // Ẩn banner sau khi cuộn
        setShowReturnBanner(false);
      }
    }, []);

    // Tìm kiếm tin nhắn
    const handleSearch = useCallback(
      async (term: string) => {
        if (!term.trim() || !chats?.$id) return;

        setIsSearching(true);
        try {
          const response = await fetch(
            `/api/chats/${chats.$id}/messages/search`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ query: term, limit: 20 }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.documents) {
              setSearchResults(data.data.documents);
            } else {
              setSearchResults([]);
            }
          }
        } catch (error) {
          console.error("Error searching messages:", error);
        } finally {
          setIsSearching(false);
        }
      },
      [chats]
    );

    // Effect để tự động hiển thị và cuộn khi có highlighted message
    useEffect(() => {
      if (highlightedMessage) {
        jumpToMessage(highlightedMessage);
      }
    }, [highlightedMessage, jumpToMessage]);

    // Log thông tin để debug
    console.log("Chat details:", {
      chatId: chats?.$id,
      members: chats?.members?.length,
    });

    if (!chats) {
      return (
        <Card className="flex-1 h-full p-8 flex flex-col items-center justify-center">
          <div className="mb-4">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-xl font-medium mb-2">No chat selected</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Select a chat from the left list or create a new chat to start.
          </p>
        </Card>
      );
    }

    // Hiển thị UI đặc biệt khi workspace chỉ có một thành viên
    if (hasOnlyCurrentUser) {
      console.log("🚨 Hiển thị giao diện chỉ có một thành viên", chats);
      return (
        <Card className="flex-1 h-full p-8 flex flex-col items-center justify-center">
          <div className="mb-4">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-medium mb-2">Only you in this chat</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            You are the only member in this chat. Please invite more members to
            start the chat.
          </p>
          <Link href={`/workspaces/${chats.workspaceId}/settings`}>
            <Button variant="outline" size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite members
            </Button>
          </Link>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <Card className="flex-1 h-full p-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading messages...</p>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className="flex-1 h-full p-8 flex items-center justify-center">
          <p className="text-destructive">
            Error loading messages:{" "}
            {error instanceof Error ? error.message : error}
          </p>
        </Card>
      );
    }

    return (
      <Card className="flex-1 h-full flex flex-col overflow-hidden">
        <ChatHeader
          name={chats?.name || "Select a chat"}
          isGroup={chats?.isGroup}
          membersCount={chats?.members?.length || 0}
          totalWorkspaceMembers={chats?.totalWorkspaceMembers || 0}
          syncNotification={syncNotification || addMembersNotification}
          onToggleMediaGallery={() =>
            setMediaGallerySidebarOpen(!mediaGallerySidebarOpen)
          }
          isMediaGalleryOpen={mediaGallerySidebarOpen}
          onSearch={() => setSearchOpen(true)}
          isRealtimeConnected={isRealtimeConnected}
        />
        {/* Thanh tìm kiếm */}
        {searchOpen && (
          <MessageSearch
            messages={messages}
            onClose={() => setSearchOpen(false)}
            onJumpToMessage={jumpToMessage}
            onSearch={handleSearch}
            results={searchResults}
            isSearching={isSearching}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}

        {/* Thông báo đồng bộ */}
        {syncNotification && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-2 text-sm text-center">
            {syncNotification}
          </div>
        )}

        {/* Thông báo hướng dẫn đồng bộ thành viên */}
        {chats.isGroup && chats.members && chats.members.length > 0 && (
          <>
            {addMembersNotification && (
              <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-2 text-sm text-center border-t border-b border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center justify-center">
                  {localIsSyncing ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-2" />
                  )}
                  <p className="font-medium">{addMembersNotification}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Khu vực chính - Linh động sử dụng flex để hiển thị chat hoặc media gallery */}
        <div className="flex-1 flex flex-row overflow-hidden">
          {/* Chat message area */}
          <div
            className={cn(
              "relative flex-1 flex flex-col overflow-hidden min-w-0",
              mediaGallerySidebarOpen
                ? "w-full md:w-[calc(100%-320px)]"
                : "w-full"
            )}
          >
            <ScrollArea
              ref={scrollRef}
              className="flex-1 p-2 sm:p-4 h-full overflow-y-auto"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm sm:text-base">
                    No messages yet. Start the chat!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-4 py-2">
                  {messages.map((msg) =>
                    msg.isSystemMessage ? (
                      <div
                        key={msg.$id}
                        id={`message-${msg.$id}`}
                        className="mx-auto bg-muted/50 text-center max-w-[95%] sm:max-w-[90%] italic rounded-lg p-2 sm:p-3"
                      >
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {msg.content}
                        </p>
                        <p className="text-[10px] sm:text-xs mt-1 opacity-70">
                          {new Date(
                            msg.$createdAt || msg.CreatedAt || ""
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                    ) : (
                      <div
                        key={msg.$id || `temp-${Date.now()}-${Math.random()}`}
                        id={`message-${msg.$id}`}
                        ref={(ref) => {
                          if (msg.$id) registerMessageRef(msg.$id, ref);
                        }}
                        className="transition-colors duration-300"
                      >
                        <ChatMessage
                          message={msg}
                          currentMemberId={memberId}
                          memberName={
                            membersMap[msg.memberId] || msg.senderName
                          }
                          chatsId={chats?.$id}
                          totalMembers={chats?.members?.length || 0}
                          allMessages={messages}
                          highlighted={highlightedMessage === msg.$id}
                        />
                      </div>
                    )
                  )}
                  <div ref={messagesEndRef} id="messages-end" className="h-1" />
                </div>
              )}
            </ScrollArea>

            {/* Scroll to bottom button */}
            {showScrollButton && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-4 right-4 rounded-full shadow-md z-10 p-2 w-8 h-8 bg-primary/80 text-white hover:bg-primary"
                onClick={handleScrollToBottom}
                title="Scroll to the latest message"
              >
                <ChevronDown size={16} />
              </Button>
            )}

            {/* Banner để quay lại vị trí trước khi tìm kiếm */}
            {showReturnBanner && (
              <div className="absolute bottom-12 left-0 right-0 px-2 sm:px-4 py-2 flex justify-center z-10">
                <div className="bg-card border shadow-md rounded-lg flex items-center px-3 sm:px-4 py-2 max-w-[90%] sm:max-w-xs">
                  <button
                    onClick={returnToLastPosition}
                    className="text-xs sm:text-sm flex items-center gap-2 text-primary hover:underline flex-1"
                  >
                    <ArrowUpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Back to the previous scroll position
                  </button>
                  <button
                    onClick={() => setShowReturnBanner(false)}
                    className="ml-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full hover:bg-muted flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Media Gallery Sidebar */}
          {mediaGallerySidebarOpen && (
            <div className="w-80 border-l flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden">
              <div className="p-3 border-b flex items-center justify-between">
                <h3 className="font-medium text-base">Files and images</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setMediaGallerySidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Embed Media Gallery directly instead of Dialog */}
              {chats && (
                <div className="flex-1 overflow-hidden">
                  <MediaGallerySidebarContent
                    messages={messages}
                    chatsId={chats.$id}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message input */}
        <ChatInput
          onSend={onSendMessage}
          isLoading={isSending}
          chatsId={chats?.$id}
          memberId={memberId}
          onToggleMediaGallery={() =>
            setMediaGallerySidebarOpen(!mediaGallerySidebarOpen)
          }
          mediaGalleryOpen={mediaGallerySidebarOpen}
          onOpenSearch={() => setSearchOpen(true)}
        />
      </Card>
    );
  }
);

// Thêm displayName
ChatArea.displayName = "ChatArea";
