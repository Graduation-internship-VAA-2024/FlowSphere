import { useState, useEffect } from 'react';
import { Chats, ChatMembers } from '../type';

interface SyncStatus {
  isSynced: boolean;
  needsSync: boolean;
  difference: number;
  totalWorkspaceMembers: number;
  totalChatMembers: number;
  missingInChat: number;
  extraInChat: number;
}

export function useSyncStatus(
  chat?: Chats & { 
    members?: ChatMembers[];
    totalWorkspaceMembers?: number;
  }
): SyncStatus {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSynced: true,
    needsSync: false,
    difference: 0,
    totalWorkspaceMembers: 0,
    totalChatMembers: 0,
    missingInChat: 0,
    extraInChat: 0
  });

  useEffect(() => {
    if (!chat || !chat.members) {
      return;
    }

    const totalChatMembers = chat.members.length;
    const totalWorkspaceMembers = chat.totalWorkspaceMembers || 0;
    
    // Kiểm tra xem có cần đồng bộ hay không
    const difference = Math.abs(totalChatMembers - totalWorkspaceMembers);
    const needsSync = difference > 0;
    
    // Tính toán số lượng thành viên thiếu hoặc thừa
    const missingInChat = totalWorkspaceMembers > totalChatMembers 
      ? totalWorkspaceMembers - totalChatMembers 
      : 0;
    
    const extraInChat = totalChatMembers > totalWorkspaceMembers 
      ? totalChatMembers - totalWorkspaceMembers 
      : 0;
    
    setSyncStatus({
      isSynced: !needsSync,
      needsSync,
      difference,
      totalWorkspaceMembers,
      totalChatMembers,
      missingInChat,
      extraInChat
    });
  }, [chat]);

  return syncStatus;
} 