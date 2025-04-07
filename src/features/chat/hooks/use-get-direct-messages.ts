import { useCallback, useEffect, useState } from "react";
import { Chats, ChatMembers } from "../type";
import { chatApi } from "../api";

export function useGetDirectMessages(options: {
  workspaceId: string;
  currentMemberId?: string;
  enabled?: boolean;
  interval?: number;
}) {
  const { workspaceId, currentMemberId, enabled = true, interval = 12000 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [directChats, setDirectChats] = useState<(Chats & {
    members?: (ChatMembers & {
      memberDetails?: {
        name?: string;
        email?: string;
        userId?: string;
      };
    })[];
  })[]>([]);

  const fetchDirectChats = useCallback(async () => {
    if (!workspaceId || !enabled || !currentMemberId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch danh sách chat
      const response = await chatApi.getChats(workspaceId);
      if (response?.data?.documents) {
        // Lọc các chat là direct message
        const directMessages = response.data.documents.filter(
          (chat) => !chat.isGroup
        );
        
        console.log("Direct messages fetched:", directMessages.length);
        
        // Lọc những tin nhắn trực tiếp mà người dùng hiện tại tham gia
        const userDirectMessages = directMessages.filter((chat) => {
          return chat.members?.some((member) => member.memberId === currentMemberId);
        });
        
        console.log("User direct messages:", userDirectMessages.length);
        setDirectChats(userDirectMessages);
      }
    } catch (err) {
      console.error("Error fetching direct messages:", err);
      setError("Không thể tải danh sách tin nhắn trực tiếp");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, enabled, currentMemberId]);

  // Fetch initial data
  useEffect(() => {
    if (enabled) {
      fetchDirectChats();
    }
  }, [enabled, fetchDirectChats]);

  // Setup interval for real-time updates
  useEffect(() => {
    if (!enabled || interval <= 0) return;

    const timer = setInterval(() => {
      fetchDirectChats();
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval, fetchDirectChats]);

  return {
    isLoading,
    error,
    directChats,
    refetch: fetchDirectChats,
  };
} 