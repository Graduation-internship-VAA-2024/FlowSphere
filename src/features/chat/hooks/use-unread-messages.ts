import { useState, useEffect } from 'react';
import axios from 'axios';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const workspaceId = useWorkspaceId();

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const fetchUnreadMessages = async () => {
      try {
        setLoading(true);
        const response = await axios.post('/api/chats/unread', { workspaceId });
        if (response.data) {
          setUnreadCount(response.data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadMessages();

    // Set up polling or real-time updates
    const interval = setInterval(fetchUnreadMessages, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [workspaceId]);

  return { unreadCount, loading };
}; 