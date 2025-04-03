import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createChatSchema, messageSchema, updateChatSchema, chatMemberSchema, chatFilterSchema, chatMemberFilterSchema, messageReadSchema, typingIndicatorSchema, messageReactionSchema, pinMessageSchema, messageSearchSchema } from "../schema";
import { getMember } from "@/features/members/utils";
import { DATABASE_ID, MEMBERS_ID, CHATS_ID, MESSAGES_ID, CHAT_MEMBERS_ID, WORKSPACES_ID, IMAGES_BUCKET_ID } from "@/config";
import { ID, Query } from "node-appwrite";
import { z } from "zod";
import { Chats, ChatMembers, Messages } from "../type";

// Tên các collection mới
const MESSAGE_READS_ID = "message_reads"; // Collection lưu trạng thái đã đọc
const MESSAGE_REACTIONS_ID = "message_reactions"; // Collection lưu reactions

const app = new Hono()
  // Workspace chat endpoints
  .post("/workspace", sessionMiddleware, zValidator("json", z.object({
    workspaceId: z.string()
  })), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workspaceId } = c.req.valid("json");

    try {
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không phải thành viên của workspace này" }, 401);
      }

      const chats = await databases.listDocuments(DATABASE_ID, CHATS_ID, [
        Query.equal("workspaceId", workspaceId),
      ]);

      return c.json({ data: chats });
    } catch (error) {
      console.error("Error getting workspace chats:", error);
      return c.json({ error: "Không thể lấy danh sách chat" }, 500);
    }
  })

  .post("/:chatId/sync-members", sessionMiddleware, zValidator("json", z.object({
    workspaceId: z.string()
  })), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatId } = c.req.param();
    const { workspaceId } = c.req.valid("json");

    try {
      // Kiểm tra quyền
      const userMember = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!userMember) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Lấy chat
      const chat = await databases.getDocument(DATABASE_ID, CHATS_ID, chatId);
      
      if (chat.workspaceId !== workspaceId) {
        return c.json({ error: "Chat không thuộc workspace này" }, 400);
      }

      // Lấy tất cả thành viên của workspace - đây là nguồn dữ liệu chuẩn
      const workspaceMembers = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
        Query.equal("workspaceId", workspaceId),
      ]);

      console.log(`Workspace ${workspaceId} có ${workspaceMembers.total} thành viên`);
      
      // Lấy thành viên hiện tại của chat để xóa
      const chatMembers = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatId),
      ]);
      
      console.log(`Chat ${chatId} hiện có ${chatMembers.total} thành viên, sẽ xóa tất cả và đồng bộ lại`);
      
      // Xóa tất cả thành viên hiện tại của chat
      let removed = chatMembers.total;
      for (const chatMember of chatMembers.documents) {
        await databases.deleteDocument(DATABASE_ID, CHAT_MEMBERS_ID, chatMember.$id);
      }
      
      // Thêm tất cả thành viên từ workspace - nguồn chuẩn
      let added = 0;
      for (const workspaceMember of workspaceMembers.documents) {
        console.log(`Thêm thành viên workspace ${workspaceMember.$id} vào chat`);
        await databases.createDocument(DATABASE_ID, CHAT_MEMBERS_ID, ID.unique(), {
          chatsId: chatId,
          memberId: workspaceMember.$id,
          content: "",
          CreatedAt: new Date(),
        });
        added++;
      }

      return c.json({ 
        data: { 
          added, 
          removed,
          total: workspaceMembers.total,
          message: `Đã đồng bộ lại thành viên chat từ workspace. Xóa ${removed} thành viên cũ và thêm ${added} thành viên mới.`
        },
        message: `Đã đồng bộ lại thành viên chat từ workspace. Xóa ${removed} thành viên cũ và thêm ${added} thành viên mới.`
      });
    } catch (error) {
      console.error("Error syncing chat members:", error);
      return c.json({ error: "Không thể đồng bộ thành viên" }, 500);
    }
  })

  // Chat routes
  .post("/", sessionMiddleware, zValidator("json", createChatSchema), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workspaceId, name, isGroup } = c.req.valid("json");

    try {
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Tạo chat
      const chat = await databases.createDocument(DATABASE_ID, CHATS_ID, ID.unique(), {
        workspaceId,
        name,
        isGroup,
      });

      // Thêm người tạo vào chat với quyền admin
      await databases.createDocument(DATABASE_ID, CHAT_MEMBERS_ID, ID.unique(), {
        chatsId: chat.$id,
        memberId: member.$id,
        content: "",
        CreatedAt: new Date(),
      });

      return c.json({ data: chat });
    } catch (error) {
      console.error("Error creating chat:", error);
      return c.json({ error: "Không thể tạo cuộc trò chuyện" }, 500);
    }
  })
  
  .get("/", sessionMiddleware, zValidator("query", chatFilterSchema), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workspaceId, query, limit } = c.req.valid("query");

    try {
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Lấy tất cả chat trong workspace
      const filters = [Query.equal("workspaceId", workspaceId)];
      
      if (query) {
        filters.push(Query.search("name", query));
      }

      const chats = await databases.listDocuments(DATABASE_ID, CHATS_ID, [
        ...filters,
        Query.limit(limit),
      ]);

      // Lấy thành viên chat cho mỗi chat
      const chatsWithMembers = await Promise.all(
        chats.documents.map(async (chat) => {
          const members = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
            Query.equal("chatsId", chat.$id),
          ]);
          
          return {
            ...chat,
            members: members.documents,
          };
        })
      );

      return c.json({ 
        data: { 
          documents: chatsWithMembers, 
          total: chats.total 
        } 
      });
    } catch (error) {
      console.error("Error listing chats:", error);
      return c.json({ error: "Không thể lấy danh sách chat" }, 500);
    }
  })
  
  .get("/:chatsId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const { chatsId } = c.req.param();

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument(DATABASE_ID, CHATS_ID, chatsId);
      
      // Lấy thành viên chat
      const chatMembers = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
      ]);

      return c.json({ 
        data: { 
          ...chat, 
          members: chatMembers.documents 
        } 
      });
    } catch (error) {
      console.error("Error getting chat:", error);
      return c.json({ error: "Không thể lấy thông tin chat" }, 500);
    }
  })
  
  .patch("/:chatsId", sessionMiddleware, zValidator("json", updateChatSchema), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId } = c.req.param();
    const updates = c.req.valid("json");

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra quyền chỉnh sửa
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Kiểm tra người dùng là admin của chat
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", member.$id),
      ]);

      if (!chatMember.documents.length) {
        return c.json({ error: "Bạn không có quyền chỉnh sửa chat này" }, 401);
      }

      // Cập nhật chat
      const updatedChat = await databases.updateDocument(DATABASE_ID, CHATS_ID, chatsId, updates);

      return c.json({ data: updatedChat });
    } catch (error) {
      console.error("Error updating chat:", error);
      return c.json({ error: "Không thể cập nhật chat" }, 500);
    }
  })
  
  .delete("/:chatsId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId } = c.req.param();

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra quyền xóa
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Kiểm tra người dùng là admin của chat
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", member.$id),
      ]);

      if (!chatMember.documents.length) {
        return c.json({ error: "Bạn không có quyền xóa chat này" }, 401);
      }

      // Xóa tất cả tin nhắn trước
      const messages = await databases.listDocuments(DATABASE_ID, MESSAGES_ID, [
        Query.equal("chatsId", chatsId),
      ]);

      for (const message of messages.documents) {
        await databases.deleteDocument(DATABASE_ID, MESSAGES_ID, message.$id);
      }

      // Xóa tất cả thành viên
      const chatMembers = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
      ]);

      for (const chatMember of chatMembers.documents) {
        await databases.deleteDocument(DATABASE_ID, CHAT_MEMBERS_ID, chatMember.$id);
      }

      // Xóa chat
      await databases.deleteDocument(DATABASE_ID, CHATS_ID, chatsId);

      return c.json({ data: { $id: chatsId } });
    } catch (error) {
      console.error("Error deleting chat:", error);
      return c.json({ error: "Không thể xóa chat" }, 500);
    }
  })
  
  // Message routes
  .post("/:chatsId/messages", sessionMiddleware, zValidator("json", messageSchema), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId } = c.req.param();
    const messageData = c.req.valid("json");

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", member.$id),
      ]);

      if (!chatMember.documents.length) {
        return c.json({ error: "Bạn không phải thành viên của chat này" }, 401);
      }

      // Tạo tin nhắn
      const message = await databases.createDocument(DATABASE_ID, MESSAGES_ID, ID.unique(), {
        ...messageData,
        chatsId,
        CreatedAt: new Date(),
      });

      return c.json({ data: message });
    } catch (error) {
      console.error("Error sending message:", error);
      return c.json({ error: "Không thể gửi tin nhắn" }, 500);
    }
  })
  
  .get("/:chatsId/messages", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId } = c.req.param();

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", member.$id),
      ]);

      if (!chatMember.documents.length) {
        return c.json({ error: "Bạn không phải thành viên của chat này" }, 401);
      }

      // Lấy tin nhắn
      const messages = await databases.listDocuments(DATABASE_ID, MESSAGES_ID, [
        Query.equal("chatsId", chatsId),
        Query.orderDesc("CreatedAt"),
      ]);

      return c.json({ 
        data: { 
          documents: messages.documents, 
          total: messages.total 
        } 
      });
    } catch (error) {
      console.error("Error getting messages:", error);
      return c.json({ error: "Không thể lấy tin nhắn" }, 500);
    }
  })
  
  // Route xử lý tìm kiếm tin nhắn theo nội dung
  .post("/:chatsId/messages/search", sessionMiddleware, zValidator("json", messageSearchSchema), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId } = c.req.param();
    const { query, limit } = c.req.valid("json");

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", member.$id),
      ]);

      if (!chatMember.documents.length) {
        return c.json({ error: "Bạn không phải thành viên của chat này" }, 401);
      }

      // Tìm kiếm tin nhắn theo nội dung
      const messages = await databases.listDocuments(DATABASE_ID, MESSAGES_ID, [
        Query.equal("chatsId", chatsId),
        Query.search("content", query),
        Query.limit(limit),
        Query.orderDesc("CreatedAt"),
      ]);

      return c.json({ 
        data: { 
          documents: messages.documents, 
          total: messages.total 
        } 
      });
    } catch (error) {
      console.error("Error searching messages:", error);
      return c.json({ error: "Không thể tìm kiếm tin nhắn" }, 500);
    }
  })
  
  // Route xử lý đánh dấu tin nhắn đã đọc
  .post("/:chatsId/messages/:messageId/read", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId, messageId } = c.req.param();

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", member.$id),
      ]);

      if (!chatMember.documents.length) {
        return c.json({ error: "Bạn không phải thành viên của chat này" }, 401);
      }

      // Kiểm tra xem đã đọc tin nhắn này chưa
      const existingReads = await databases.listDocuments(DATABASE_ID, MESSAGE_READS_ID, [
        Query.equal("messageId", messageId),
        Query.equal("memberId", member.$id),
      ]);

      // Nếu đã có bản ghi đã đọc, không làm gì cả
      if (existingReads.total > 0) {
        return c.json({ data: existingReads.documents[0] });
      }

      // Tạo bản ghi đã đọc
      const readRecord = await databases.createDocument(DATABASE_ID, MESSAGE_READS_ID, ID.unique(), {
        messageId,
        memberId: member.$id,
        chatsId,
        readAt: new Date(),
      });

      return c.json({ data: readRecord });
    } catch (error) {
      console.error("Error marking message as read:", error);
      return c.json({ error: "Không thể đánh dấu tin nhắn đã đọc" }, 500);
    }
  })
  
  // Route xử lý lấy danh sách người đã đọc một tin nhắn
  .get("/:chatsId/messages/:messageId/reads", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId, messageId } = c.req.param();

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", member.$id),
      ]);

      if (!chatMember.documents.length) {
        return c.json({ error: "Bạn không phải thành viên của chat này" }, 401);
      }

      // Lấy danh sách người đã đọc
      const reads = await databases.listDocuments(DATABASE_ID, MESSAGE_READS_ID, [
        Query.equal("messageId", messageId),
        Query.orderDesc("readAt"),
      ]);

      return c.json({ 
        data: { 
          documents: reads.documents, 
          total: reads.total 
        } 
      });
    } catch (error) {
      console.error("Error getting message reads:", error);
      return c.json({ error: "Không thể lấy thông tin đã đọc" }, 500);
    }
  })
  
  // Route xử lý typing indicator (đang gõ)
  .post("/:chatsId/typing", sessionMiddleware, zValidator("json", typingIndicatorSchema), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId } = c.req.param();
    const { isTyping } = c.req.valid("json");

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", member.$id),
      ]);

      if (!chatMember.documents.length) {
        return c.json({ error: "Bạn không phải thành viên của chat này" }, 401);
      }

      // Trả về dữ liệu đang gõ để client xử lý realtime
      // Không lưu vào database vì đây là trạng thái tạm thời
      return c.json({ 
        data: { 
          chatsId,
          memberId: member.$id,
          memberName: member.name || user.name,
          isTyping,
          timestamp: new Date(),
        } 
      });
    } catch (error) {
      console.error("Error updating typing status:", error);
      return c.json({ error: "Không thể cập nhật trạng thái đang gõ" }, 500);
    }
  })
  
  // Route xử lý thả reaction cho tin nhắn
  .post("/:chatsId/messages/:messageId/reactions", sessionMiddleware, zValidator("json", messageReactionSchema), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId, messageId } = c.req.param();
    const { reaction } = c.req.valid("json");

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", member.$id),
      ]);

      if (!chatMember.documents.length) {
        return c.json({ error: "Bạn không phải thành viên của chat này" }, 401);
      }

      // Kiểm tra xem đã có reaction nào từ người dùng cho tin nhắn này chưa
      const existingReactions = await databases.listDocuments(DATABASE_ID, MESSAGE_REACTIONS_ID, [
        Query.equal("messageId", messageId),
        Query.equal("memberId", member.$id),
      ]);

      // Nếu đã có reaction, cập nhật hoặc xóa
      if (existingReactions.total > 0) {
        const existingReaction = existingReactions.documents[0];
        
        // Nếu reaction giống nhau, xóa (toggle)
        if (existingReaction.reaction === reaction) {
          await databases.deleteDocument(DATABASE_ID, MESSAGE_REACTIONS_ID, existingReaction.$id);
          return c.json({ 
            data: { 
              removed: true,
              messageId,
              memberId: member.$id,
              reaction,
            } 
          });
        } 
        // Nếu reaction khác, cập nhật
        else {
          const updatedReaction = await databases.updateDocument(DATABASE_ID, MESSAGE_REACTIONS_ID, existingReaction.$id, {
            reaction,
            updatedAt: new Date(),
          });
          
          return c.json({ data: updatedReaction });
        }
      }

      // Tạo reaction mới
      const newReaction = await databases.createDocument(DATABASE_ID, MESSAGE_REACTIONS_ID, ID.unique(), {
        messageId,
        memberId: member.$id,
        reaction,
        chatsId,
        createdAt: new Date(),
      });

      return c.json({ data: newReaction });
    } catch (error) {
      console.error("Error adding reaction:", error);
      return c.json({ error: "Không thể thêm reaction" }, 500);
    }
  })
  
  // Route lấy tất cả reactions cho một tin nhắn
  .get("/:chatsId/messages/:messageId/reactions", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId, messageId } = c.req.param();

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", member.$id),
      ]);

      if (!chatMember.documents.length) {
        return c.json({ error: "Bạn không phải thành viên của chat này" }, 401);
      }

      // Lấy danh sách reactions
      const reactions = await databases.listDocuments(DATABASE_ID, MESSAGE_REACTIONS_ID, [
        Query.equal("messageId", messageId),
      ]);

      return c.json({ 
        data: { 
          documents: reactions.documents, 
          total: reactions.total 
        } 
      });
    } catch (error) {
      console.error("Error getting reactions:", error);
      return c.json({ error: "Không thể lấy danh sách reactions" }, 500);
    }
  })
  
  // Route xử lý ghim/bỏ ghim tin nhắn
  .post("/:chatsId/messages/:messageId/pin", sessionMiddleware, zValidator("json", pinMessageSchema), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId, messageId } = c.req.param();
    const { isPinned } = c.req.valid("json");

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", member.$id),
      ]);

      if (!chatMember.documents.length) {
        return c.json({ error: "Bạn không phải thành viên của chat này" }, 401);
      }

      // Cập nhật tin nhắn
      const updatedMessage = await databases.updateDocument(DATABASE_ID, MESSAGES_ID, messageId, {
        isPinned,
        pinnedBy: isPinned ? member.$id : null,
        pinnedAt: isPinned ? new Date() : null,
      });

      return c.json({ data: updatedMessage });
    } catch (error) {
      console.error("Error pinning/unpinning message:", error);
      return c.json({ error: "Không thể ghim/bỏ ghim tin nhắn" }, 500);
    }
  })
  
  // Route lấy tất cả tin nhắn đã ghim trong một cuộc trò chuyện
  .get("/:chatsId/pinned-messages", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId } = c.req.param();

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", member.$id),
      ]);

      if (!chatMember.documents.length) {
        return c.json({ error: "Bạn không phải thành viên của chat này" }, 401);
      }

      // Lấy danh sách tin nhắn đã ghim
      const pinnedMessages = await databases.listDocuments(DATABASE_ID, MESSAGES_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("isPinned", true),
        Query.orderDesc("pinnedAt"),
      ]);

      return c.json({ 
        data: { 
          documents: pinnedMessages.documents, 
          total: pinnedMessages.total 
        } 
      });
    } catch (error) {
      console.error("Error getting pinned messages:", error);
      return c.json({ error: "Không thể lấy danh sách tin nhắn đã ghim" }, 500);
    }
  })
  
  // File upload route nâng cao
  .post("/upload", sessionMiddleware, async (c) => {
    const storage = c.get("storage");
    const databases = c.get("databases");
    const user = c.get("user");
    
    try {
      const formData = await c.req.parseBody();
      const file = formData.file as File;
      const chatsId = formData.chatsId as string;
      const memberId = formData.memberId as string;
      
      if (!file) {
        return c.json({ error: "Không tìm thấy file" }, 400);
      }
      
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra thành viên
      const member = await getMember({
        databases, 
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });
      
      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }
      
      if (member.$id !== memberId) {
        return c.json({ error: "ID thành viên không hợp lệ" }, 400);
      }

      // Xác thực file
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'video/mp4', 'audio/mpeg', 'audio/mp3'
      ];
      
      const maxSize = 20 * 1024 * 1024; // 20MB
      
      if (!allowedTypes.includes(file.type)) {
        return c.json({ error: "Loại file không được hỗ trợ" }, 400);
      }
      
      if (file.size > maxSize) {
        return c.json({ error: "Kích thước file quá lớn (tối đa 20MB)" }, 400);
      }
      
      // Upload file
      const uploadedFile = await storage.createFile(
        IMAGES_BUCKET_ID,
        ID.unique(),
        file
      );
      
      const fileUrl = storage.getFileView(IMAGES_BUCKET_ID, uploadedFile.$id);
      
      // Xác định loại file
      const isImage = file.type.startsWith('image/');
      
      // Tạo tin nhắn với file đính kèm
      const messageData = {
        chatsId,
        memberId,
        content: '',
        fileUrl: fileUrl,
        imageUrl: isImage ? fileUrl : undefined,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        CreatedAt: new Date(),
      };
      
      const message = await databases.createDocument(
        DATABASE_ID,
        MESSAGES_ID,
        ID.unique(),
        messageData
      );
      
      return c.json({ data: message });
    } catch (error) {
      console.error("Error uploading file:", error);
      return c.json({ error: "Không thể upload file" }, 500);
    }
  })
  
  // Chat member routes
  .post("/:chatsId/members", sessionMiddleware, zValidator("json", chatMemberSchema), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId } = c.req.param();
    const { memberId } = c.req.valid("json");

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra quyền thêm thành viên
      const currentMember = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!currentMember) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Kiểm tra người dùng là admin của chat
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", currentMember.$id),
      ]);

      // Tất cả thành viên chat đều có quyền thao tác, không còn phân biệt role nữa
      if (!chatMember.documents.length) {
        return c.json({ error: "Bạn không có quyền thêm thành viên" }, 401);
      }

      // Thêm thành viên
      const newMember = await databases.createDocument(DATABASE_ID, CHAT_MEMBERS_ID, ID.unique(), {
        chatsId,
        memberId,
        content: "",
        CreatedAt: new Date(),
      });

      return c.json({ data: newMember });
    } catch (error) {
      console.error("Error adding chat member:", error);
      return c.json({ error: "Không thể thêm thành viên" }, 500);
    }
  })
  
  .get("/:chatsId/members", sessionMiddleware, zValidator("query", chatMemberFilterSchema), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId } = c.req.param();
    const { query, limit } = c.req.valid("query");

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Lấy thành viên của chat
      const filters = [Query.equal("chatsId", chatsId)];
      
      if (query) {
        filters.push(Query.search("name", query));
      }

      const chatMembers = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        ...filters,
        Query.limit(limit || 50),
      ]);

      return c.json({ 
        data: { 
          documents: chatMembers.documents, 
          total: chatMembers.total 
        } 
      });
    } catch (error) {
      console.error("Error listing chat members:", error);
      return c.json({ error: "Không thể lấy danh sách thành viên" }, 500);
    }
  })
  
  .delete("/:chatsId/members/:memberId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId, memberId } = c.req.param();

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);
      
      // Kiểm tra quyền xóa thành viên
      const currentMember = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!currentMember) {
        return c.json({ error: "Bạn không có quyền truy cập" }, 401);
      }

      // Lấy thông tin thành viên chat hiện tại
      const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", currentMember.$id),
      ]);

      // Chỉ admin hoặc chính thành viên đó mới có thể xóa
      if (!chatMember.documents.length || currentMember.$id !== memberId) {
        return c.json({ error: "Bạn không có quyền xóa thành viên này" }, 401);
      }

      // Lấy id của chat member dựa trên memberId
      const memberToRemove = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
        Query.equal("chatsId", chatsId),
        Query.equal("memberId", memberId),
      ]);

      if (!memberToRemove.documents.length) {
        return c.json({ error: "Không tìm thấy thành viên" }, 404);
      }

      // Xóa thành viên
      await databases.deleteDocument(
        DATABASE_ID,
        CHAT_MEMBERS_ID,
        memberToRemove.documents[0].$id
      );

      return c.json({ data: { $id: memberToRemove.documents[0].$id } });
    } catch (error) {
      console.error("Error removing chat member:", error);
      return c.json({ error: "Không thể xóa thành viên" }, 500);
    }
  })
  
  // Route để tạo chat mặc định cho workspace đã tồn tại
  .post("/initialize-default", sessionMiddleware, zValidator("json", z.object({
    workspaceId: z.string(),
    workspaceName: z.string()
  })), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workspaceId, workspaceName } = c.req.valid("json");

    try {
      // Kiểm tra quyền truy cập
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Bạn không có quyền truy cập workspace này" }, 401);
      }

      // Kiểm tra xem đã có nhóm chat nào thuộc workspace này chưa
      const existingChats = await databases.listDocuments(DATABASE_ID, CHATS_ID, [
        Query.equal("workspaceId", workspaceId),
        Query.equal("isGroup", true),
      ]);

      // Nếu đã có nhóm chat, trả về nhóm chat đầu tiên
      if (existingChats.total > 0) {
        return c.json({ data: existingChats.documents[0], message: "Đã tồn tại nhóm chat" });
      }

      // Tạo nhóm chat mặc định
      const defaultChat = await databases.createDocument(DATABASE_ID, CHATS_ID, ID.unique(), {
        workspaceId,
        name: `${workspaceName} Chung`,
        isGroup: true,
      });

      // Lấy tất cả thành viên của workspace
      const workspaceMembers = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
        Query.equal("workspaceId", workspaceId),
      ]);

      // Thêm tất cả thành viên vào nhóm chat
      for (const wsm of workspaceMembers.documents) {
        await databases.createDocument(DATABASE_ID, CHAT_MEMBERS_ID, ID.unique(), {
          chatsId: defaultChat.$id,
          memberId: wsm.$id,
          content: "",
          CreatedAt: new Date(),
        });
      }

      return c.json({ data: defaultChat });
    } catch (error) {
      console.error("Error initializing default chat:", error);
      return c.json({ error: "Không thể tạo nhóm chat mặc định" }, 500);
    }
  });

export default app; 