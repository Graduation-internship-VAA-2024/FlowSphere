import { rpc } from "@/lib/rpc";
import { Chats, ChatMembers, Messages } from "../type";

// API cho các cuộc trò chuyện
export const chatApi = {
  // Lấy danh sách cuộc trò chuyện theo workspace
  getChats: (workspaceId: string) =>
    rpc<{ data: { documents: (Chats & { members?: ChatMembers[] })[]; total: number } }>({
      method: "GET",
      path: "/api/chats",
      query: { workspaceId },
    }),

  // Tạo cuộc trò chuyện mới
  createChat: (data: { workspaceId: string; name: string; isGroup: boolean }) =>
    rpc<{ data: Chats }>({
      method: "POST",
      path: "/api/chats",
      body: data,
    }),

  // Tạo nhóm chat mặc định cho workspace đã tồn tại
  initializeDefaultChat: (workspaceId: string, workspaceName: string) =>
    rpc<{ data: Chats }>({
      method: "POST",
      path: "/api/chats/initialize-default",
      body: { workspaceId, workspaceName },
    }),

  // Đồng bộ thành viên trong workspace vào chat nhóm
  syncMembers: (chatId: string, workspaceId: string) =>
    rpc<{ data: { added: number; removed: number; total: number; message?: string } }>({
      method: "POST",
      path: `/api/chats/${chatId}/sync-members`,
      body: { workspaceId },
    }),

  // Lấy thông tin chi tiết cuộc trò chuyện
  getChat: (chatsId: string) =>
    rpc<{ data: Chats & { members?: ChatMembers[] } }>({
      method: "GET",
      path: `/api/chats/${chatsId}`,
    }),

  // Cập nhật thông tin cuộc trò chuyện
  updateChat: (chatsId: string, data: { name?: string; isGroup?: boolean }) =>
    rpc<{ data: Chats }>({
      method: "PATCH",
      path: `/api/chats/${chatsId}`,
      body: data,
    }),

  // Xóa cuộc trò chuyện
  deleteChat: (chatsId: string) =>
    rpc<{ data: { $id: string } }>({
      method: "DELETE",
      path: `/api/chats/${chatsId}`,
    }),

  // Gửi tin nhắn mới
  sendMessage: (data: {
    chatsId: string;
    memberId: string;
    content?: string;
    fileUrl?: string;
    imageUrl?: string;
  }) =>
    rpc<{ data: Messages }>({
      method: "POST",
      path: `/api/chats/${data.chatsId}/messages`,
      body: data,
    }),

  // Lấy danh sách tin nhắn của cuộc trò chuyện
  getMessages: (chatsId: string) =>
    rpc<{ data: { documents: Messages[]; total: number } }>({
      method: "GET",
      path: `/api/chats/${chatsId}/messages`,
    }),

  // Thêm thành viên vào cuộc trò chuyện
  addMember: (data: { chatsId: string; memberId: string; role?: "member" | "admin" }) =>
    rpc<{ data: ChatMembers }>({
      method: "POST",
      path: `/api/chats/${data.chatsId}/members`,
      body: data,
    }),

  // Lấy danh sách thành viên của cuộc trò chuyện
  getMembers: (chatsId: string, query?: string) =>
    rpc<{ data: { documents: ChatMembers[]; total: number } }>({
      method: "GET",
      path: `/api/chats/${chatsId}/members`,
      query: { chatsId: chatsId, query },
    }),

  // Xóa thành viên khỏi cuộc trò chuyện
  removeMember: (chatsId: string, memberId: string) =>
    rpc<{ data: { $id: string } }>({
      method: "DELETE",
      path: `/api/chats/${chatsId}/members/${memberId}`,
    }),

  // Upload file cho cuộc trò chuyện
  uploadFile: async (file: File, chatsId: string, memberId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatsId", chatsId);
    formData.append("memberId", memberId);

    const response = await fetch("/api/chats/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    return response.json();
  },
}; 