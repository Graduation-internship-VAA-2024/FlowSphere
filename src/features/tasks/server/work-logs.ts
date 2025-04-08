import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { logWorkSchema, updateEstimateSchema } from "../schemas";
import { getMember } from "@/features/members/utils";
import { DATABASE_ID, WORK_LOGS_ID, TASKS_ID } from "@/config";
import { ID, Query } from "node-appwrite";
import { z } from "zod";
import { Task, WorkLog } from "../types";

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
    const user = c.get("user");
    const { taskId } = c.req.param();

    console.log("Getting work logs for task:", taskId);
    console.log("User authenticated:", user.$id);

    try {
      // Get the task to verify user has access
      const task = await databases.getDocument<Task>(
        DATABASE_ID,
        TASKS_ID,
        taskId
      );

      console.log("Found task:", task.$id, task.name);

      const member = await getMember({
        databases,
        workspaceId: task.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Member not found" }, 401);
      }

      // Get work logs for the task
      const workLogs = await databases.listDocuments<WorkLog>(
        DATABASE_ID,
        WORK_LOGS_ID,
        [Query.equal("taskId", taskId), Query.orderDesc("$createdAt")]
      );

      console.log(
        `Found ${workLogs.documents.length} work logs for task ${taskId}`
      );

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

      // Get the task to verify user has access
      const task = await databases.getDocument<Task>(
        DATABASE_ID,
        TASKS_ID,
        data.taskId
      );

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

      // Create work log
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

      return c.json(workLog);
    }
  )
  .delete("/delete/:workLogId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workLogId } = c.req.param();

    // Get the work log
    const workLog = await databases.getDocument<WorkLog>(
      DATABASE_ID,
      WORK_LOGS_ID,
      workLogId
    );

    // Get the task to verify user has access
    const task = await databases.getDocument<Task>(
      DATABASE_ID,
      TASKS_ID,
      workLog.taskId
    );

    const member = await getMember({
      databases,
      workspaceId: task.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Member not found" }, 401);
    }

    // Delete work log
    await databases.deleteDocument(DATABASE_ID, WORK_LOGS_ID, workLogId);

    return c.json({ success: true });
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

      // Get the task to verify user has access
      const task = await databases.getDocument<Task>(
        DATABASE_ID,
        TASKS_ID,
        taskId
      );

      const member = await getMember({
        databases,
        workspaceId: task.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Member not found" }, 401);
      }

      // Update task with estimate
      const updatedTask = await databases.updateDocument(
        DATABASE_ID,
        TASKS_ID,
        taskId,
        {
          remainingEstimate: data.remainingEstimate,
        }
      );

      return c.json(updatedTask);
    }
  );

export default app;
