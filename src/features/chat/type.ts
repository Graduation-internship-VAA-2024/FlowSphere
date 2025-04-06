import { Models } from "node-appwrite";

export enum MemberRole {
  MEMBER = 'member',
  ADMIN = 'admin'
}

export type Chats = Models.Document & {
  workspaceId: string;
  name: string;
  isGroup: boolean;
};

export type ChatMembers = Models.Document & {
  chatsId: string;
  memberId: string;
  role: MemberRole;
};

export type Messages = Models.Document & {
  chatsId: string;
  memberId: string;
  content?: string;
  fileUrl?: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  createdAt?: Date;
  CreatedAt?: Date;
  isSystemMessage?: boolean;
  replyTo?: string; // ID của tin nhắn được trả lời
};

export type MessageType = 'text' | 'file' | 'image' | 'system';

// Type cho xác nhận đã đọc
export type MessageRead = Models.Document & {
  messageId: string;
  memberId: string;
  readAt: Date;
};

// Type cho event realtime
export type RealtimeEvent = {
  type: 'message' | 'read';
  payload: any;
};