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
  createdAt: Date;
};

export type MessageType = 'text' | 'file' | 'image';