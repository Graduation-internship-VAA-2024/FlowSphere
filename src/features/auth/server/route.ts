import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  changeNameSchema,
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from "../schemas";
import { createAdminClient } from "@/lib/appwrite";
import { ID } from "node-appwrite";
import { deleteCookie, setCookie } from "hono/cookie";
import { AUTH_COOKIE } from "../constants";
import { sessionMiddleware } from "@/lib/session-middleware";
const app = new Hono()
  .get("/current", sessionMiddleware, (c) => {
    const user = c.get("user");
    return c.json({ data: user });
  })
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);
    setCookie(c, AUTH_COOKIE, session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
    });
    return c.json({ success: true });
  })
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const { account } = await createAdminClient();
    const { email, password, name } = c.req.valid("json");

    try {
      // Try to create a session to check if email exists
      try {
        await account.createEmailPasswordSession(email, password);
        return c.json({ error: "Email already registered" }, 400);
      } catch (error: any) {
        // Email doesn't exist, continue with registration
        if (error?.code !== 401) {
          throw error;
        }
      }

      // Create account
      const userId = ID.unique();
      await account.create(userId, email, password, name);

      // Create session
      const session = await account.createEmailPasswordSession(email, password);

      // Set session cookie
      setCookie(c, AUTH_COOKIE, session.secret, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        maxAge: 60 * 60 * 24 * 30,
      });

      return c.json({ success: true });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error?.code === 409) {
        return c.json({ error: "Email already registered" }, 400);
      }
      return c.json({ error: "Failed to register" }, 500);
    }
  })
  .post("/logout", sessionMiddleware, async (c) => {
    const account = c.get("account");
    deleteCookie(c, AUTH_COOKIE);
    await account.deleteSession("current");
    return c.json({ success: true });
  })
  .patch(
    "/change-password",
    sessionMiddleware,
    zValidator("json", changePasswordSchema),
    async (c) => {
      try {
        const { oldPassword, newPassword } = c.req.valid("json");
        const account = c.get("account");

        try {
          // Use updatePassword with oldPassword parameter for verification
          await account.updatePassword(newPassword, oldPassword);
          return c.json({ success: true });
        } catch (error) {
          console.error("Password change error:", error);
          return c.json({ error: "Current password is incorrect" }, 400);
        }
      } catch (error) {
        console.error("Password change error:", error);
        return c.json({ error: "Failed to change password" }, 500);
      }
    }
  )
  .patch(
    "/change-name",
    sessionMiddleware,
    zValidator("json", changeNameSchema),
    async (c) => {
      try {
        const { name } = c.req.valid("json");
        const account = c.get("account");

        try {
          // Update the user's name
          await account.updateName(name);
          return c.json({ success: true });
        } catch (error) {
          console.error("Name change error:", error);
          return c.json({ error: "Failed to update name" }, 400);
        }
      } catch (error) {
        console.error("Name change error:", error);
        return c.json({ error: "Failed to update name" }, 500);
      }
    }
  );

export default app;
