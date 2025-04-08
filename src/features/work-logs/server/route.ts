import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getMember } from "@/features/members/utils";
import { DATABASE_ID, WORK_LOGS_ID, TASKS_ID } from "@/config";
import { ID, Query, Databases } from "node-appwrite";
import { Task, WorkLog } from "@/features/tasks/types";
import { logWorkSchema, updateEstimateSchema } from "../schemas";
import { createAdminClient } from "@/lib/appwrite";

// Helper function to convert time format (e.g., "2h 30m") to seconds
function convertTimeToSeconds(timeString: string): number {
  let totalSeconds = 0;

  // Match hours
  const hoursMatch = timeString.match(/(\d+)h/);
  if (hoursMatch) {
    totalSeconds += parseInt(hoursMatch[1]) * 3600;
  }

  // Match minutes
  const minutesMatch = timeString.match(/(\d+)m/);
  if (minutesMatch) {
    totalSeconds += parseInt(minutesMatch[1]) * 60;
  }

  return totalSeconds;
}

// Function to check if user is member of workspace (reused)
async function checkUserAccess(
  databases: Databases,
  taskId: string,
  userId: string
) {
  // Get the task to verify user has access
  const task = (await databases.getDocument(
    DATABASE_ID,
    TASKS_ID,
    taskId
  )) as Task;

  const member = await getMember({
    databases,
    workspaceId: task.workspaceId,
    userId,
  });

  if (!member) {
    throw new Error("Member not found");
  }

  return task;
}

const app = new Hono()
  .onError((err, c) => {
    console.error("API Error:", err.message);
    console.error(
      "Error details:",
      JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    );

    // Return full error details in development
    if (process.env.NODE_ENV === "development") {
      return c.json(
        {
          error: err.message,
          details: JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
        },
        500
      );
    }

    return c.json({ error: err.message }, 500);
  })
  .get("/:taskId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const { users } = createAdminClient();
    const user = c.get("user");
    const { taskId } = c.req.param();

    console.log("Getting work logs for task:", taskId);
    console.log("User authenticated:", user.$id);

    try {
      // Get the task to verify user has access
      const task = (await databases.getDocument(
        DATABASE_ID,
        TASKS_ID,
        taskId
      )) as Task;

      console.log("Found task:", task.$id, task.name);

      const member = await getMember({
        databases,
        workspaceId: task.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Member not found" }, 401);
      }

      // Get work logs for the task - user now has permission
      const workLogs = await databases.listDocuments(
        DATABASE_ID,
        WORK_LOGS_ID,
        [Query.equal("taskId", taskId), Query.orderDesc("$createdAt")]
      );

      console.log(
        `Found ${workLogs.documents.length} work logs for task ${taskId}`
      );

      // Enrich with user information
      if (workLogs.documents.length > 0) {
        const userIds = Array.from(
          new Set(workLogs.documents.map((log) => log.userId))
        );
        const userInfoMap: Record<string, any> = {};

        // Fetch user information
        await Promise.all(
          userIds.map(async (userId) => {
            try {
              const userInfo = await users.get(userId);
              userInfoMap[userId] = {
                name: userInfo.name || userInfo.email,
                email: userInfo.email,
              };
            } catch (error) {
              console.error(`Error fetching user ${userId}:`, error);
              userInfoMap[userId] = { name: "Unknown User" };
            }
          })
        );

        // Add user information to each log
        workLogs.documents = workLogs.documents.map((log) => ({
          ...log,
          userInfo: userInfoMap[log.userId] || { name: "Unknown User" },
        }));
      }

      return c.json(workLogs);
    } catch (error) {
      console.error(`Error getting work logs for task ${taskId}:`, error);
      throw error;
    }
  })
  .post(
    "/create",
    sessionMiddleware,
    zValidator("json", logWorkSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const data = c.req.valid("json");

      console.log("Creating work log with data:", data);

      try {
        // Get the task to verify user has access
        const task = (await databases.getDocument(
          DATABASE_ID,
          TASKS_ID,
          data.taskId
        )) as Task;

        const member = await getMember({
          databases,
          workspaceId: task.workspaceId,
          userId: user.$id,
        });

        if (!member) {
          return c.json({ error: "Member not found" }, 401);
        }

        // Convert time format to seconds
        const timeSpentSeconds = convertTimeToSeconds(data.timeSpent);

        // Create work log - user now has permission
        const workLog = await databases.createDocument(
          DATABASE_ID,
          WORK_LOGS_ID,
          ID.unique(),
          {
            ...data,
            userId: user.$id,
            timeSpentSeconds,
          }
        );

        console.log("Work log created successfully:", workLog.$id);

        return c.json(workLog);
      } catch (error) {
        console.error("Error creating work log:", error);
        throw error;
      }
    }
  )
  .delete("/delete/:workLogId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workLogId } = c.req.param();

    try {
      // Get the work log
      const workLog = (await databases.getDocument(
        DATABASE_ID,
        WORK_LOGS_ID,
        workLogId
      )) as WorkLog;

      // Only allow deletion if the user is the creator of the work log
      if (workLog.userId !== user.$id) {
        return c.json({ error: "Not authorized to delete this work log" }, 403);
      }

      // Verify user has access to the task's workspace
      await checkUserAccess(databases, workLog.taskId, user.$id);

      // Delete work log
      await databases.deleteDocument(DATABASE_ID, WORK_LOGS_ID, workLogId);

      return c.json({ success: true });
    } catch (error) {
      console.error("Error deleting work log:", error);
      throw error;
    }
  })
  .patch(
    "/estimate/:taskId",
    sessionMiddleware,
    zValidator("json", updateEstimateSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { taskId } = c.req.param();
      const data = c.req.valid("json");

      try {
        // Verify user has access to the task's workspace
        await checkUserAccess(databases, taskId, user.$id);

        // Update only the remaining estimate
        const updatedTask = await databases.updateDocument(
          DATABASE_ID,
          TASKS_ID,
          taskId,
          {
            remainingEstimate: data.remainingEstimate,
          }
        );

        return c.json(updatedTask);
      } catch (error) {
        console.error("Error updating task estimate:", error);
        throw error;
      }
    }
  )
  // Debug endpoint
  .get("/debug", (c) => {
    console.log("Work logs debug endpoint accessed");
    return c.json({ message: "Work logs debug endpoint is working" });
  });

export default app;
