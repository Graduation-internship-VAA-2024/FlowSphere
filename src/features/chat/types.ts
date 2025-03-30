export interface User {
  id: string;
  name: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  type?: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  isCurrentUser?: boolean;
}