import { z } from "zod";
import { MemberRole } from "./type";

// Schema for creating a new chat/group
export const createChatSchema = z.object({
  workspaceId: z.string(),
  name: z.string().trim().min(1, "Chat name is required"),
  isGroup: z.boolean().default(false),
});

// Schema for chat members
export const chatMemberSchema = z.object({
  chatsId: z.string(),
  memberId: z.string(),
});

// Schema for sending messages
export const messageSchema = z.object({
  chatsId: z.string(),
  memberId: z.string(),
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  CreatedAt: z.date().optional(),
});

// Schema for updating chat details
export const updateChatSchema = z.object({
  name: z.string().trim().min(1, "Chat name is required").optional(),
  isGroup: z.boolean().optional(),
});

// Schema for file uploads in chat
export const chatFileSchema = z.object({
  file: z.instanceof(File),
  chatsId: z.string(),
  memberId: z.string(),
});

// Schema for chat search/filter
export const chatFilterSchema = z.object({
  workspaceId: z.string(),
  query: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

// Schema for chat member search
export const chatMemberFilterSchema = z.object({
  chatsId: z.string(),
  query: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});