import "server-only";
import {
  Account,
  Client,
  Databases,
  Models,
  Storage,
  type Account as AccountType,
  type Databases as DatabasesType,
  type Storage as StorageType,
  type Users as UsersType,
} from "node-appwrite";

import { getCookie } from "hono/cookie";

import { createMiddleware } from "hono/factory";
import { AUTH_COOKIE } from "@/features/auth/constants";
import { createAdminClient } from "@/lib/appwrite";

type AdditionalContext = {
  Variables: {
    account: AccountType;
    databases: DatabasesType;
    storage: StorageType;
    users: UsersType;
    user: Models.User<Models.Preferences>;
    admin: {
      databases: DatabasesType;
      storage: StorageType;
    };
  };
};

export const sessionMiddleware = createMiddleware<AdditionalContext>(
  async (c, next) => {
    try {
      // Client for user operations (với session)
      const userClient = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

      const session = getCookie(c, AUTH_COOKIE);
      if (!session) {
        return c.json({ error: "Unauthorized", status: 401 });
      }
      userClient.setSession(session);

      // Tạo tài khoản và cơ sở dữ liệu từ session người dùng
      const account = new Account(userClient);
      const databases = new Databases(userClient);

      try {
        // Thử lấy thông tin user để kiểm tra session hợp lệ
        const user = await account.get();
        console.log("User authenticated:", user.$id);

        // Tạo client riêng cho storage với API key
        const storageClient = new Client()
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
          .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
          .setKey(process.env.NEXT_APPWRITE_KEY!);

        // Tạo storage service với API key
        const storage = new Storage(storageClient);

        // Tạo admin client có quyền truy cập đầy đủ
        const admin = createAdminClient();

        c.set("account", account);
        c.set("databases", databases);
        c.set("storage", storage);
        c.set("user", user);
        c.set("admin", {
          databases: admin.databases,
          storage: admin.storage,
        });
      } catch (authError) {
        console.error("Authentication error:", authError);
        return c.json({ error: "Authentication failed", status: 401 });
      }

      await next();
    } catch (error) {
      console.error("Session middleware error:", error);
      return c.json({ error: "Server error", status: 500 });
    }
  }
);
