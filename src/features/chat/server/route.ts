import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createChatSchema, messageSchema, updateChatSchema, chatMemberSchema, chatFilterSchema, chatMemberFilterSchema } from "../schema";
import { getMember } from "@/features/members/utils";
import { DATABASE_ID, MEMBERS_ID, CHATS_ID, MESSAGES_ID, CHAT_MEMBERS_ID, WORKSPACES_ID } from "@/config";
import { ID, Query } from "node-appwrite";
import { z } from "zod";
import { Chats, ChatMembers, Messages } from "../type";

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
  
  // File upload route
  .post("/upload", sessionMiddleware, async (c) => {
    // Implement file upload functionality
    return c.json({ data: null });
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