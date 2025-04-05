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

    const { accout } = await createAdminClient();
    const session = await accout.createEmailPasswordSession(email, password);
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
    const { name, email, password } = c.req.valid("json");

    const { accout } = await createAdminClient();
    await accout.create(ID.unique(), email, password, name);
    const session = await accout.createEmailPasswordSession(email, password);
    setCookie(c, AUTH_COOKIE, session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
    });
    return c.json({ success: true });
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
