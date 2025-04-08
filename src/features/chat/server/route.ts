import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  createChatSchema,
  messageSchema,
  updateChatSchema,
  chatMemberSchema,
  chatFilterSchema,
  chatMemberFilterSchema,
  messageSearchSchema,
} from "../schema";
import { getMember } from "@/features/members/utils";
import {
  DATABASE_ID,
  MEMBERS_ID,
  CHATS_ID,
  MESSAGES_ID,
  CHAT_MEMBERS_ID,
  IMAGES_BUCKET_ID,
  FILES_BUCKET_ID,
  MESSAGE_READS_ID,
} from "@/config";
import { ID, Query } from "node-appwrite";
import { z } from "zod";
import { Chats } from "../type";

// Tên các collection mới đã được chuyển sang config.ts
// const MESSAGE_READS_ID = "message_reads"; // Collection lưu trạng thái đã đọc

const app = new Hono()
  // Workspace chat endpoints
  .post(
    "/workspace",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
      })
    ),
    async (c) => {
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
          return c.json(
            { error: "You are not a member of this workspace" },
            401
          );
        }

        const chats = await databases.listDocuments(DATABASE_ID, CHATS_ID, [
          Query.equal("workspaceId", workspaceId),
        ]);

        return c.json({ data: chats });
      } catch (error) {
        console.error("Error getting workspace chats:", error);
        return c.json({ error: "Cannot get workspace chats" }, 500);
      }
    }
  )

  .post(
    "/:chatId/sync-members",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
      })
    ),
    async (c) => {
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
        if (!userMember) return c.json({ error: "You don't have access" }, 401);

        // Lấy chat và kiểm tra
        const chat = await databases.getDocument(DATABASE_ID, CHATS_ID, chatId);
        if (chat.workspaceId !== workspaceId)
          return c.json({ error: "Chat is not in this workspace" }, 400);

        // Lấy dữ liệu thành viên workspace và chat
        const [workspaceMembers, chatMembers] = await Promise.all([
          databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
            Query.equal("workspaceId", workspaceId),
          ]),
          databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
            Query.equal("chatsId", chatId),
          ]),
        ]);

        // Tạo Map để theo dõi thành viên
        const workspaceMemberIds = new Set(
          workspaceMembers.documents.map((member) => member.$id)
        );
        const chatMemberIds = new Map(
          chatMembers.documents.map((member) => [member.memberId, member.$id])
        );

        // Thống kê
        let added = 0,
          removed = 0,
          kept = 0;
        let addedMembers: any[] = [];

        // 1. Xóa thành viên chat không còn trong workspace
        await Promise.all(
          chatMembers.documents.map(async (chatMember) => {
            if (!workspaceMemberIds.has(chatMember.memberId)) {
              await databases.deleteDocument(
                DATABASE_ID,
                CHAT_MEMBERS_ID,
                chatMember.$id
              );
              removed++;
            } else kept++;
          })
        );

        // 2. Thêm thành viên mới từ workspace vào chat
        await Promise.all(
          workspaceMembers.documents.map(async (workspaceMember) => {
            if (!chatMemberIds.has(workspaceMember.$id)) {
              await databases.createDocument(
                DATABASE_ID,
                CHAT_MEMBERS_ID,
                ID.unique(),
                {
                  chatsId: chatId,
                  memberId: workspaceMember.$id,
                  content: "",
                  CreatedAt: new Date(),
                }
              );
              addedMembers.push(workspaceMember);
              added++;
            }
          })
        );

        // 3. Gửi tin nhắn hệ thống thông báo về việc đồng bộ thành viên
        if (added > 0 || removed > 0) {
          let systemMessage = `Synced members: `;
          if (added > 0) {
            const newMemberNames = addedMembers
              .slice(0, 3)
              .map((member) => member.name || "New user")
              .join(", ");
            systemMessage += `Added ${added} new members${
              added <= 3 ? ` (${newMemberNames})` : ""
            }.`;
          }
          if (removed > 0)
            systemMessage += ` Removed ${removed} invalid members.`;

          await databases.createDocument(
            DATABASE_ID,
            MESSAGES_ID,
            ID.unique(),
            {
              chatsId: chatId,
              memberId: userMember.$id,
              content: systemMessage,
              isSystemMessage: true,
              CreatedAt: new Date(),
            }
          );
        }

        return c.json({
          data: { added, removed, kept, total: workspaceMembers.total },
          message: `Synced members from workspace to chat`,
        });
      } catch (error) {
        console.error("Error syncing chat members:", error);
        return c.json({ error: "Cannot sync chat members" }, 500);
      }
    }
  )

  // Chat routes
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", createChatSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workspaceId, name } = c.req.valid("json");

      try {
        const member = await getMember({
          databases,
          workspaceId,
          userId: user.$id,
        });
        if (!member) return c.json({ error: "You don't have access" }, 401);

        // Luôn tạo nhóm chat, bất kể giá trị isGroup từ client
        const chat = await databases.createDocument(
          DATABASE_ID,
          CHATS_ID,
          ID.unique(),
          {
            workspaceId,
            name,
            isGroup: true, // Luôn đặt là true để chỉ tạo nhóm chat
          }
        );

        // Thêm người tạo và tạo tin nhắn hệ thống
        await Promise.all([
          // Thêm người tạo vào chat
          databases.createDocument(DATABASE_ID, CHAT_MEMBERS_ID, ID.unique(), {
            chatsId: chat.$id,
            memberId: member.$id,
            content: `${member.name || "User"} created the chat`,
            CreatedAt: new Date(),
          }),

          // Tạo tin nhắn hệ thống
          databases.createDocument(DATABASE_ID, MESSAGES_ID, ID.unique(), {
            chatsId: chat.$id,
            memberId: member.$id,
            content: `${member.name || "User"} created the chat`,
            isSystemMessage: true,
            CreatedAt: new Date(),
          }),
        ]);

        return c.json({ data: chat });
      } catch (error) {
        console.error("Error creating chat:", error);

        // Trả về lỗi chi tiết hơn cho client
        const errorMessage =
          error instanceof Error ? error.message : "Cannot create chat";

        return c.json({ error: errorMessage }, 500);
      }
    }
  )

  .get(
    "/",
    sessionMiddleware,
    zValidator("query", chatFilterSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workspaceId, query, limit } = c.req.valid("query");

      try {
        // Kiểm tra quyền
        const member = await getMember({
          databases,
          workspaceId,
          userId: user.$id,
        });
        if (!member) return c.json({ error: "You don't have access" }, 401);

        // Lấy tất cả chat và thành viên workspace
        const filters = [Query.equal("workspaceId", workspaceId)];
        if (query) filters.push(Query.search("name", query));

        const [chats, workspaceMembers] = await Promise.all([
          databases.listDocuments(DATABASE_ID, CHATS_ID, [
            ...filters,
            Query.limit(limit),
          ]),
          databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
            Query.equal("workspaceId", workspaceId),
          ]),
        ]);

        // Lấy thành viên chat cho mỗi chat
        const chatsWithMembers = await Promise.all(
          chats.documents.map(async (chat) => {
            const members = await databases.listDocuments(
              DATABASE_ID,
              CHAT_MEMBERS_ID,
              [Query.equal("chatsId", chat.$id)]
            );

            return {
              ...chat,
              members: members.documents,
              totalWorkspaceMembers: workspaceMembers.total,
            };
          })
        );

        return c.json({
          data: { documents: chatsWithMembers, total: chats.total },
        });
      } catch (error) {
        console.error("Error listing chats:", error);
        return c.json({ error: "Cannot get chat list" }, 500);
      }
    }
  )

  .get("/:chatsId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId } = c.req.param();

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument(DATABASE_ID, CHATS_ID, chatsId);

      // Kiểm tra quyền truy cập workspace
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });
      if (!member)
        return c.json(
          { error: "You don't have access to this workspace" },
          401
        );

      // Kiểm tra người dùng đã là thành viên của chat chưa
      const chatMember = await databases.listDocuments(
        DATABASE_ID,
        CHAT_MEMBERS_ID,
        [Query.equal("chatsId", chatsId), Query.equal("memberId", member.$id)]
      );

      // Tự động thêm người dùng vào chat nếu họ chưa là thành viên
      if (!chatMember.documents.length) {
        try {
          await databases.createDocument(
            DATABASE_ID,
            CHAT_MEMBERS_ID,
            ID.unique(),
            {
              chatsId: chatsId,
              memberId: member.$id,
              content: `${member.name || "User"} joined the chat`,
              CreatedAt: new Date(),
            }
          );
        } catch (addError) {
          console.error("Cannot automatically add member to chat:", addError);
        }
      }

      // Lấy thành viên chat và tổng số thành viên workspace
      const [chatMembers, workspaceMembers] = await Promise.all([
        databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
          Query.equal("chatsId", chatsId),
        ]),
        databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
          Query.equal("workspaceId", chat.workspaceId),
        ]),
      ]);

      return c.json({
        data: {
          ...chat,
          members: chatMembers.documents,
          totalWorkspaceMembers: workspaceMembers.total,
        },
      });
    } catch (error) {
      console.error("Error getting chat:", error);
      return c.json({ error: "Cannot get chat info" }, 500);
    }
  })

  .patch(
    "/:chatsId",
    sessionMiddleware,
    zValidator("json", updateChatSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { chatsId } = c.req.param();
      const updates = c.req.valid("json");

      try {
        // Lấy thông tin chat
        const chat = await databases.getDocument<Chats>(
          DATABASE_ID,
          CHATS_ID,
          chatsId
        );

        // Kiểm tra quyền chỉnh sửa
        const member = await getMember({
          databases,
          workspaceId: chat.workspaceId,
          userId: user.$id,
        });

        if (!member) {
          return c.json({ error: "You don't have access" }, 401);
        }

        // Kiểm tra người dùng là admin của chat
        const chatMember = await databases.listDocuments(
          DATABASE_ID,
          CHAT_MEMBERS_ID,
          [Query.equal("chatsId", chatsId), Query.equal("memberId", member.$id)]
        );

        if (!chatMember.documents.length) {
          return c.json(
            { error: "You don't have permission to edit this chat" },
            401
          );
        }

        // Cập nhật chat
        const updatedChat = await databases.updateDocument(
          DATABASE_ID,
          CHATS_ID,
          chatsId,
          updates
        );

        return c.json({ data: updatedChat });
      } catch (error) {
        console.error("Error updating chat:", error);
        return c.json({ error: "Cannot update chat" }, 500);
      }
    }
  )

  .delete("/:chatsId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId } = c.req.param();

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(
        DATABASE_ID,
        CHATS_ID,
        chatsId
      );

      // Kiểm tra quyền xóa
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });
      if (!member) return c.json({ error: "You don't have access" }, 401);

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(
        DATABASE_ID,
        CHAT_MEMBERS_ID,
        [Query.equal("chatsId", chatsId), Query.equal("memberId", member.$id)]
      );

      if (!chatMember.documents.length) {
        return c.json(
          { error: "You don't have permission to delete this chat" },
          401
        );
      }

      // Lấy tất cả thành phần liên quan để xóa
      const [messages, chatMembers] = await Promise.all([
        databases.listDocuments(DATABASE_ID, MESSAGES_ID, [
          Query.equal("chatsId", chatsId),
        ]),
        databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
          Query.equal("chatsId", chatsId),
        ]),
      ]);

      // Xóa tin nhắn, thành viên, và chat
      await Promise.all([
        // Xóa tin nhắn
        ...messages.documents.map((message) =>
          databases.deleteDocument(DATABASE_ID, MESSAGES_ID, message.$id)
        ),
        // Xóa thành viên
        ...chatMembers.documents.map((chatMember) =>
          databases.deleteDocument(DATABASE_ID, CHAT_MEMBERS_ID, chatMember.$id)
        ),
      ]);

      // Cuối cùng xóa chat
      await databases.deleteDocument(DATABASE_ID, CHATS_ID, chatsId);

      return c.json({ data: { $id: chatsId } });
    } catch (error) {
      console.error("Error deleting chat:", error);
      return c.json({ error: "Cannot delete chat" }, 500);
    }
  })

  // Message routes
  .post(
    "/:chatsId/messages",
    sessionMiddleware,
    zValidator("json", messageSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { chatsId } = c.req.param();
      const messageData = c.req.valid("json");

      try {
        // Lấy thông tin chat
        const chat = await databases.getDocument<Chats>(
          DATABASE_ID,
          CHATS_ID,
          chatsId
        );

        // Kiểm tra thành viên
        const member = await getMember({
          databases,
          workspaceId: chat.workspaceId,
          userId: user.$id,
        });

        if (!member) {
          return c.json({ error: "You don't have access" }, 401);
        }

        // Kiểm tra người dùng là thành viên của chat
        const chatMember = await databases.listDocuments(
          DATABASE_ID,
          CHAT_MEMBERS_ID,
          [Query.equal("chatsId", chatsId), Query.equal("memberId", member.$id)]
        );

        // Nếu người dùng không phải là thành viên của chat nhưng là thành viên hợp lệ của workspace
        // thì tự động thêm họ vào nhóm chat
        if (!chatMember.documents.length) {
          try {
            // Tự động thêm người dùng vào chat vì họ là thành viên hợp lệ của workspace
            console.log(
              `Automatically adding workspace member ${member.$id} to chat ${chatsId}`
            );
            await databases.createDocument(
              DATABASE_ID,
              CHAT_MEMBERS_ID,
              ID.unique(),
              {
                chatsId: chatsId,
                memberId: member.$id,
                content: `${member.name || "User"} joined the chat`,
                CreatedAt: new Date(),
              }
            );
            console.log(
              `Automatically added member ${member.$id} to chat ${chatsId}`
            );
          } catch (addError) {
            console.error("Cannot automatically add member to chat:", addError);
            return c.json({ error: "You are not a member of this chat" }, 401);
          }
        }

        // Tạo tin nhắn
        const message = await databases.createDocument(
          DATABASE_ID,
          MESSAGES_ID,
          ID.unique(),
          {
            ...messageData,
            chatsId,
            CreatedAt: new Date(),
          }
        );

        return c.json({ data: message });
      } catch (error) {
        console.error("Error sending message:", error);
        return c.json({ error: "Cannot send message" }, 500);
      }
    }
  )

  .get("/:chatsId/messages", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId } = c.req.param();

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(
        DATABASE_ID,
        CHATS_ID,
        chatsId
      );

      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "You don't have access" }, 401);
      }

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(
        DATABASE_ID,
        CHAT_MEMBERS_ID,
        [Query.equal("chatsId", chatsId), Query.equal("memberId", member.$id)]
      );

      // Nếu người dùng không phải là thành viên của chat nhưng là thành viên hợp lệ của workspace
      // thì tự động thêm họ vào nhóm chat
      if (!chatMember.documents.length) {
        try {
          // Tự động thêm người dùng vào chat vì họ là thành viên hợp lệ của workspace
          console.log(
            `Automatically adding workspace member ${member.$id} to chat ${chatsId}`
          );
          await databases.createDocument(
            DATABASE_ID,
            CHAT_MEMBERS_ID,
            ID.unique(),
            {
              chatsId: chatsId,
              memberId: member.$id,
              content: `${member.name || "User"} joined the chat`,
              CreatedAt: new Date(),
            }
          );
          console.log(
            `Automatically added member ${member.$id} to chat ${chatsId}`
          );
        } catch (addError) {
          console.error("Cannot automatically add member to chat:", addError);
          return c.json({ error: "You are not a member of this chat" }, 401);
        }
      }

      // Lấy tin nhắn
      const messages = await databases.listDocuments(DATABASE_ID, MESSAGES_ID, [
        Query.equal("chatsId", chatsId),
        Query.orderAsc("CreatedAt"),
      ]);

      return c.json({
        data: {
          documents: messages.documents,
          total: messages.total,
        },
      });
    } catch (error) {
      console.error("Error getting messages:", error);
      return c.json({ error: "Cannot get messages" }, 500);
    }
  })

  // Route xử lý tìm kiếm tin nhắn theo nội dung
  .post(
    "/:chatsId/messages/search",
    sessionMiddleware,
    zValidator("json", messageSearchSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { chatsId } = c.req.param();
      const { query, limit } = c.req.valid("json");

      try {
        // Lấy thông tin chat
        const chat = await databases.getDocument<Chats>(
          DATABASE_ID,
          CHATS_ID,
          chatsId
        );

        // Kiểm tra thành viên
        const member = await getMember({
          databases,
          workspaceId: chat.workspaceId,
          userId: user.$id,
        });

        if (!member) {
          return c.json({ error: "You don't have access" }, 401);
        }

        // Kiểm tra người dùng là thành viên của chat
        const chatMember = await databases.listDocuments(
          DATABASE_ID,
          CHAT_MEMBERS_ID,
          [Query.equal("chatsId", chatsId), Query.equal("memberId", member.$id)]
        );

        if (!chatMember.documents.length) {
          return c.json({ error: "You are not a member of this chat" }, 401);
        }

        // Tìm kiếm tin nhắn theo nội dung
        const messages = await databases.listDocuments(
          DATABASE_ID,
          MESSAGES_ID,
          [
            Query.equal("chatsId", chatsId),
            Query.search("content", query),
            Query.limit(limit),
            Query.orderDesc("CreatedAt"),
          ]
        );

        return c.json({
          data: {
            documents: messages.documents,
            total: messages.total,
          },
        });
      } catch (error) {
        console.error("Error searching messages:", error);
        return c.json({ error: "Cannot search messages" }, 500);
      }
    }
  )

  // Route xử lý đánh dấu tin nhắn đã đọc
  .post("/:chatsId/messages/:messageId/read", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId, messageId } = c.req.param();

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(
        DATABASE_ID,
        CHATS_ID,
        chatsId
      );

      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "You don't have access" }, 401);
      }

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(
        DATABASE_ID,
        CHAT_MEMBERS_ID,
        [Query.equal("chatsId", chatsId), Query.equal("memberId", member.$id)]
      );

      if (!chatMember.documents.length) {
        return c.json({ error: "You are not a member of this chat" }, 401);
      }

      // Kiểm tra xem đã đọc tin nhắn này chưa
      const existingReads = await databases.listDocuments(
        DATABASE_ID,
        MESSAGE_READS_ID,
        [
          Query.equal("messageId", messageId),
          Query.equal("memberId", member.$id),
        ]
      );

      // Nếu đã có bản ghi đã đọc, không làm gì cả
      if (existingReads.total > 0) {
        return c.json({ data: existingReads.documents[0] });
      }

      // Tạo bản ghi đã đọc
      const readRecord = await databases.createDocument(
        DATABASE_ID,
        MESSAGE_READS_ID,
        ID.unique(),
        {
          messageId,
          memberId: member.$id,
          chatsId,
          readAt: new Date(),
        }
      );

      return c.json({ data: readRecord });
    } catch (error) {
      console.error("Error marking message as read:", error);
      return c.json({ error: "Cannot mark message as read" }, 500);
    }
  })

  // Route xử lý lấy danh sách người đã đọc một tin nhắn
  .get("/:chatsId/messages/:messageId/reads", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { chatsId, messageId } = c.req.param();

    try {
      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(
        DATABASE_ID,
        CHATS_ID,
        chatsId
      );

      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "You don't have access" }, 401);
      }

      // Kiểm tra người dùng là thành viên của chat
      const chatMember = await databases.listDocuments(
        DATABASE_ID,
        CHAT_MEMBERS_ID,
        [Query.equal("chatsId", chatsId), Query.equal("memberId", member.$id)]
      );

      if (!chatMember.documents.length) {
        return c.json({ error: "You are not a member of this chat" }, 401);
      }

      // Lấy danh sách người đã đọc
      const reads = await databases.listDocuments(
        DATABASE_ID,
        MESSAGE_READS_ID,
        [Query.equal("messageId", messageId), Query.orderDesc("readAt")]
      );

      return c.json({
        data: {
          documents: reads.documents,
          total: reads.total,
        },
      });
    } catch (error) {
      console.error("Error getting message reads:", error);
      return c.json({ error: "Cannot get message reads" }, 500);
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
        return c.json({ error: "File not found" }, 400);
      }

      // Lấy thông tin chat
      const chat = await databases.getDocument<Chats>(
        DATABASE_ID,
        CHATS_ID,
        chatsId
      );

      // Kiểm tra thành viên
      const member = await getMember({
        databases,
        workspaceId: chat.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "You don't have access" }, 401);
      }

      if (member.$id !== memberId) {
        return c.json({ error: "Invalid member ID" }, 400);
      }

      // Xác định loại file
      const isImage = file.type.startsWith("image/");

      // In ra thông tin về file để debug
      console.log("File upload request:", {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        isImage,
        chatsId,
        memberId,
      });

      // Upload file vào bucket phù hợp với loại file
      const bucketId = isImage ? IMAGES_BUCKET_ID : FILES_BUCKET_ID;
      console.log("Sử dụng bucket:", bucketId);

      try {
        // Tạo ID cho file
        const fileId = ID.unique();

        // Đảm bảo tên file có phần mở rộng hợp lệ
        let fileName = file.name;
        let fileToUpload = file; // Tạo biến mới để có thể thay đổi
        const fileExt = fileName.split(".").pop()?.toLowerCase();

        // Xử lý định dạng jfif - chuyển thành jpg
        if (fileExt === "jfif") {
          fileName = fileName.substring(0, fileName.lastIndexOf(".")) + ".jpg";
          console.log("Đã chuyển đổi phần mở rộng .jfif sang .jpg:", fileName);

          // Tạo một Blob mới với phần mở rộng .jpg
          const blob = await file.arrayBuffer();
          fileToUpload = new File([blob], fileName, { type: file.type });
        }
        // Thêm phần mở rộng .bin nếu không có phần mở rộng hoặc không nhận dạng được
        else if (
          !fileName.includes(".") ||
          fileName.split(".").pop()?.length === 0
        ) {
          fileName = `${fileName}.bin`;
          console.log("Đã thêm phần mở rộng .bin cho file:", fileName);
        }

        // Kiểm tra kích thước file
        const maxSize = 15 * 1024 * 1024; // 15MB
        if (fileToUpload.size > maxSize) {
          return c.json(
            {
              error: "File size is too large (max 15MB)",
            },
            400
          );
        }

        console.log("Bắt đầu upload file với ID:", fileId);

        // Upload file
        let uploadedFile;
        try {
          uploadedFile = await storage.createFile(
            bucketId,
            fileId,
            fileToUpload
          );
          console.log("Upload file thành công:", uploadedFile.$id);
        } catch (uploadError: any) {
          console.error("Lỗi khi upload file:", uploadError);

          if (uploadError.type === "storage_file_type_unsupported") {
            return c.json(
              {
                error:
                  "File type is not supported on the server. Please choose a different file type.",
                details: uploadError.message,
              },
              400
            );
          }

          if (uploadError.type === "storage_file_size_exceeded") {
            return c.json(
              {
                error:
                  "File size exceeds the maximum allowed limit on the server.",
                details: uploadError.message,
              },
              400
            );
          }

          return c.json(
            {
              error: "Cannot upload file to storage",
              details: uploadError.message,
            },
            400
          );
        }

        // Tạo URL cho file đã upload
        const appwriteEndpoint =
          process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
          "https://cloud.appwrite.io/v1";
        const appwriteProject = process.env.NEXT_PUBLIC_APPWRITE_PROJECT || "";

        // Tạo URL trực tiếp - đảm bảo là chuỗi (không phải Promise)
        const directFileUrl = `${appwriteEndpoint}/storage/buckets/${bucketId}/files/${uploadedFile.$id}/view?project=${appwriteProject}`;
        console.log("File URL (trực tiếp):", directFileUrl);

        // Tạo tin nhắn chứa file
        try {
          const message = await databases.createDocument(
            DATABASE_ID,
            MESSAGES_ID,
            ID.unique(),
            {
              chatsId,
              memberId,
              content: "",
              fileUrl: directFileUrl,
              imageUrl: isImage ? directFileUrl : undefined,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              CreatedAt: new Date(),
            }
          );

          console.log("Tạo tin nhắn thành công:", message.$id);
          return c.json({ data: message });
        } catch (messageError: any) {
          console.error("Lỗi khi tạo tin nhắn:", messageError);
          return c.json(
            {
              error: "Cannot create message with file",
              details: messageError.message,
            },
            500
          );
        }
      } catch (error: any) {
        console.error("Lỗi tổng thể khi xử lý file:", error);
        return c.json(
          {
            error: "Cannot process file upload",
            details: error.message,
          },
          500
        );
      }
    } catch (error: any) {
      console.error("Lỗi chung trong route upload:", error);
      return c.json(
        {
          error: "Cannot process file upload request",
          details: error.message,
        },
        500
      );
    }
  })

  // Chat member routes
  .post(
    "/:chatsId/members",
    sessionMiddleware,
    zValidator("json", chatMemberSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { chatsId } = c.req.param();
      const { memberId } = c.req.valid("json");

      try {
        // Lấy thông tin chat
        const chat = await databases.getDocument<Chats>(
          DATABASE_ID,
          CHATS_ID,
          chatsId
        );

        // Kiểm tra quyền thêm thành viên
        const currentMember = await getMember({
          databases,
          workspaceId: chat.workspaceId,
          userId: user.$id,
        });

        if (!currentMember) {
          return c.json({ error: "You don't have access" }, 401);
        }

        // Kiểm tra người dùng là admin của chat
        const chatMember = await databases.listDocuments(
          DATABASE_ID,
          CHAT_MEMBERS_ID,
          [
            Query.equal("chatsId", chatsId),
            Query.equal("memberId", currentMember.$id),
          ]
        );

        // Tất cả thành viên chat đều có quyền thao tác, không còn phân biệt role nữa
        if (!chatMember.documents.length) {
          return c.json(
            { error: "You don't have permission to add members" },
            401
          );
        }

        // Lấy thông tin của thành viên được thêm
        const newMemberInfo = await databases.getDocument(
          DATABASE_ID,
          MEMBERS_ID,
          memberId
        );

        // Thêm thành viên
        const newMember = await databases.createDocument(
          DATABASE_ID,
          CHAT_MEMBERS_ID,
          ID.unique(),
          {
            chatsId,
            memberId,
            content: "",
            CreatedAt: new Date(),
          }
        );

        // Tạo tin nhắn hệ thống thông báo có thành viên mới
        await databases.createDocument(DATABASE_ID, MESSAGES_ID, ID.unique(), {
          chatsId,
          memberId: currentMember.$id,
          content: `${currentMember.name || "User"} added ${
            newMemberInfo?.name || "a new member"
          } to the chat`,
          isSystemMessage: true,
          CreatedAt: new Date(),
        });

        return c.json({ data: newMember });
      } catch (error) {
        console.error("Error adding chat member:", error);
        return c.json({ error: "Cannot add member" }, 500);
      }
    }
  )

  .get(
    "/:chatsId/members",
    sessionMiddleware,
    zValidator("query", chatMemberFilterSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { chatsId } = c.req.param();
      const { query, limit } = c.req.valid("query");

      try {
        // Lấy thông tin chat
        const chat = await databases.getDocument<Chats>(
          DATABASE_ID,
          CHATS_ID,
          chatsId
        );

        // Kiểm tra thành viên
        const member = await getMember({
          databases,
          workspaceId: chat.workspaceId,
          userId: user.$id,
        });

        if (!member) {
          return c.json({ error: "You don't have access" }, 401);
        }

        // Lấy thành viên của chat
        const filters = [Query.equal("chatsId", chatsId)];

        if (query) {
          filters.push(Query.search("name", query));
        }

        const chatMembers = await databases.listDocuments(
          DATABASE_ID,
          CHAT_MEMBERS_ID,
          [...filters, Query.limit(limit || 50)]
        );

        return c.json({
          data: {
            documents: chatMembers.documents,
            total: chatMembers.total,
          },
        });
      } catch (error) {
        console.error("Error listing chat members:", error);
        return c.json({ error: "Cannot get chat members" }, 500);
      }
    }
  )

  // .delete("/:chatsId/members/:memberId", sessionMiddleware, async (c) => {
  //   const databases = c.get("databases");
  //   const user = c.get("user");
  //   const { chatsId, memberId } = c.req.param();

  //   try {
  //     // Lấy thông tin chat
  //     const chat = await databases.getDocument<Chats>(DATABASE_ID, CHATS_ID, chatsId);

  //     // Kiểm tra quyền xóa thành viên
  //     const currentMember = await getMember({
  //       databases,
  //       workspaceId: chat.workspaceId,
  //       userId: user.$id,
  //     });

  //     if (!currentMember) {
  //       return c.json({ error: "You don't have access" }, 401);
  //     }

  //     // Lấy thông tin thành viên chat hiện tại
  //     const chatMember = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
  //       Query.equal("chatsId", chatsId),
  //       Query.equal("memberId", currentMember.$id),
  //     ]);

  //     // Chỉ admin hoặc chính thành viên đó mới có thể xóa
  //     if (!chatMember.documents.length || currentMember.$id !== memberId) {
  //       return c.json({ error: "You don't have permission to delete this member" }, 401);
  //     }

  //     // Lấy thông tin của thành viên bị xóa
  //     const removedMemberInfo = await databases.getDocument(DATABASE_ID, MEMBERS_ID, memberId);

  //     // Lấy id của chat member dựa trên memberId
  //     const memberToRemove = await databases.listDocuments(DATABASE_ID, CHAT_MEMBERS_ID, [
  //       Query.equal("chatsId", chatsId),
  //       Query.equal("memberId", memberId),
  //     ]);

  //     if (!memberToRemove.documents.length) {
  //       return c.json({ error: "Member not found" }, 404);
  //     }

  //     // Xóa thành viên
  //     await databases.deleteDocument(
  //       DATABASE_ID,
  //       CHAT_MEMBERS_ID,
  //       memberToRemove.documents[0].$id
  //     );

  //     // Tạo tin nhắn hệ thống thông báo có thành viên rời đi
  //     await databases.createDocument(DATABASE_ID, MESSAGES_ID, ID.unique(), {
  //       chatsId,
  //       memberId: memberId, // Sử dụng ID của người rời đi để hiển thị đúng tên
  //       content: `${removedMemberInfo?.name || "Một thành viên"} đã rời khỏi cuộc trò chuyện`,
  //       isSystemMessage: true,
  //       CreatedAt: new Date(),
  //     });

  //     return c.json({ data: { $id: memberToRemove.documents[0].$id } });
  //   } catch (error) {
  //     console.error("Error removing chat member:", error);
  //     return c.json({ error: "Cannot remove member" }, 500);
  //   }
  // })

  // Route để tạo chat mặc định cho workspace đã tồn tại
  .post(
    "/initialize-default",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
        workspaceName: z.string(),
      })
    ),
    async (c) => {
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
          return c.json(
            { error: "You don't have access to this workspace" },
            401
          );
        }

        // Kiểm tra xem đã có nhóm chat nào thuộc workspace này chưa
        const existingChats = await databases.listDocuments(
          DATABASE_ID,
          CHATS_ID,
          [
            Query.equal("workspaceId", workspaceId),
            Query.equal("isGroup", true),
          ]
        );

        // Nếu đã có nhóm chat, trả về nhóm chat đầu tiên
        if (existingChats.total > 0) {
          return c.json({
            data: existingChats.documents[0],
            message: "Default chat already exists",
          });
        }

        // Tạo nhóm chat mặc định
        const defaultChat = await databases.createDocument(
          DATABASE_ID,
          CHATS_ID,
          ID.unique(),
          {
            workspaceId,
            name: workspaceName,
            isGroup: true,
          }
        );

        // Lấy tất cả thành viên của workspace
        const workspaceMembers = await databases.listDocuments(
          DATABASE_ID,
          MEMBERS_ID,
          [Query.equal("workspaceId", workspaceId)]
        );

        // Thêm tất cả thành viên vào nhóm chat
        for (const wsm of workspaceMembers.documents) {
          await databases.createDocument(
            DATABASE_ID,
            CHAT_MEMBERS_ID,
            ID.unique(),
            {
              chatsId: defaultChat.$id,
              memberId: wsm.$id,
              content: `${wsm.name || "A member"} joined the chat`,
              CreatedAt: new Date(),
            }
          );
        }

        return c.json({ data: defaultChat });
      } catch (error) {
        console.error("Error initializing default chat:", error);
        return c.json({ error: "Cannot create default chat" }, 500);
      }
    }
  )

  // Add this endpoint after other endpoints
  .post(
    "/unread",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workspaceId } = c.req.valid("json");

      try {
        // Verify workspace membership
        const member = await getMember({
          databases,
          workspaceId,
          userId: user.$id,
        });

        if (!member) {
          return c.json(
            { error: "You are not a member of this workspace" },
            401
          );
        }

        // Get all chats for the workspace that the user is a member of
        const chatMembers = await databases.listDocuments(
          DATABASE_ID,
          CHAT_MEMBERS_ID,
          [Query.equal("memberId", member.$id)]
        );

        const chatIds = chatMembers.documents.map((cm) => cm.chatsId);

        if (chatIds.length === 0) {
          return c.json({ count: 0 });
        }

        // Get all messages that the user hasn't read yet
        let totalUnread = 0;

        for (const chatId of chatIds) {
          // Get the latest message read by the user
          const userReads = await databases.listDocuments(
            DATABASE_ID,
            MESSAGE_READS_ID,
            [
              Query.equal("memberId", member.$id),
              Query.orderDesc("readAt"),
              Query.limit(1),
            ]
          );

          let lastReadAt: Date | null = null;
          if (userReads.documents.length > 0) {
            const lastRead = userReads.documents[0];
            lastReadAt = new Date(lastRead.readAt);
          }

          // Count unread messages
          const unreadFilter = [
            Query.equal("chatsId", chatId),
            Query.notEqual("memberId", member.$id), // Exclude user's own messages
          ];

          if (lastReadAt) {
            unreadFilter.push(
              Query.greaterThan("CreatedAt", lastReadAt.toISOString())
            );
          }

          const unreadMessages = await databases.listDocuments(
            DATABASE_ID,
            MESSAGES_ID,
            unreadFilter
          );
          totalUnread += unreadMessages.total;
        }

        return c.json({ count: totalUnread });
      } catch (error) {
        console.error("Error counting unread messages:", error);
        return c.json({ error: "Cannot count unread messages" }, 500);
      }
    }
  );

export default app;
