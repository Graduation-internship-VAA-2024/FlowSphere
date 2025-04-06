import { createAdminClient } from "@/lib/appwrite";
import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getMember } from "../utils";
import { DATABASE_ID, MEMBERS_ID } from "@/config";
import { Query } from "node-appwrite";
import { Member, MemberRole } from "../types";

const app = new Hono()
  .get(
    "/me",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const { users } = await createAdminClient();
      const databases = c.get("databases");
      const user = c.get("user");
      const { workspaceId } = c.req.valid("query");

      try {
        const member = await getMember({
          databases,
          workspaceId,
          userId: user.$id,
        });

        if (!member) {
          return c.json({ error: "Member not found" }, 404);
        }

        // Get user details
        const userDetails = await users.get(user.$id);

        return c.json({
          data: {
            ...member,
            name: userDetails.name,
            email: userDetails.email,
          },
        });
      } catch (error) {
        console.error("Error fetching member:", error);
        return c.json({ error: "Failed to get member information" }, 500);
      }
    }
  )
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const { users } = await createAdminClient();
      const databases = c.get("databases");

      const user = c.get("user");
      const { workspaceId } = c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Member not found" }, 401);
      }

      const members = await databases.listDocuments<Member>(
        DATABASE_ID,
        MEMBERS_ID,
        [Query.equal("workspaceId", workspaceId)]
      );

      const populatedMembers = await Promise.all(
        members.documents.map(async (member) => {
          const user = await users.get(member.userId);
          return {
            ...member,
            name: user.name,
            email: user.email,
          };
        })
      );
      return c.json({
        data: {
          ...members,
          documents: populatedMembers,
        },
      });
    }
  )
  .get("/:memberId", sessionMiddleware, async (c) => {
    const { memberId } = c.req.param();
    const { users } = await createAdminClient();
    const databases = c.get("databases");

    try {
      // Lấy thông tin thành viên
      const member = await databases.getDocument(
        DATABASE_ID,
        MEMBERS_ID,
        memberId
      );

      if (!member) {
        return c.json({ error: "Member not found" }, 404);
      }

      // Lấy thông tin user tương ứng
      const userDetails = await users.get(member.userId);

      return c.json({
        data: {
          ...member,
          name: userDetails.name,
          email: userDetails.email,
        },
      });
    } catch (error: any) {
      console.error("Error fetching member:", error);

      // Trả về lỗi cụ thể nếu không tìm thấy document
      if (error.code === 404) {
        return c.json({ error: "Member not found" }, 404);
      }

      return c.json({ error: "Failed to get member information" }, 500);
    }
  })
  .delete("/:memberId", sessionMiddleware, async (c) => {
    const { memberId } = c.req.param();
    const user = c.get("user");
    const databases = c.get("databases");

    const memberToDelete = await databases.getDocument(
      DATABASE_ID,
      MEMBERS_ID,
      memberId
    );

    const allMembersInWorkspace = await databases.listDocuments(
      DATABASE_ID,
      MEMBERS_ID,
      [Query.equal("workspaceId", memberToDelete.workspaceId)]
    );

    const member = await getMember({
      databases,
      workspaceId: memberToDelete.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Member not found" }, 401);
    }
    if (member.$id !== memberToDelete.$id && member.role !== MemberRole.ADMIN) {
      return c.json({ error: "You can't delete this user" }, 401);
    }

    if (allMembersInWorkspace.total === 1) {
      return c.json({ error: "You can't delete the last member" }, 400);
    }

    await databases.deleteDocument(DATABASE_ID, MEMBERS_ID, memberId);

    return c.json({ data: { $id: memberToDelete.$id } });
  })
  .patch(
    "/:memberId",
    sessionMiddleware,
    zValidator("json", z.object({ role: z.nativeEnum(MemberRole) })),
    async (c) => {
      const { memberId } = c.req.param();
      const user = c.get("user");
      const role = c.req.valid("json").role;
      const databases = c.get("databases");

      const memberToUpdate = await databases.getDocument(
        DATABASE_ID,
        MEMBERS_ID,
        memberId
      );

      const allMembersInWorkspace = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_ID,
        [Query.equal("workspaceId", memberToUpdate.workspaceId)]
      );

      const member = await getMember({
        databases,
        workspaceId: memberToUpdate.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Member not found" }, 401);
      }
      if (member.role !== MemberRole.ADMIN) {
        return c.json({ error: "You can't update this user" }, 401);
      }

      if (allMembersInWorkspace.total === 1) {
        return c.json({ error: "Cannot downgrade the last member" }, 400);
      }

      await databases.updateDocument(DATABASE_ID, MEMBERS_ID, memberId, {
        role,
      });

      return c.json({ data: { $id: memberToUpdate.$id } });
    }
  );
export default app;
