import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createTaskSchema, updateTaskSchema } from "../schemas";
import { getMember } from "@/features/members/utils";
import {
  DATABASE_ID,
  MEMBERS_ID,
  PROJECTS_ID,
  TASKS_ID,
  IMAGES_BUCKET_ID,
  FILES_BUCKET_ID,
  WORKSPACES_ID,
} from "@/config";
import { ID, Query } from "node-appwrite";
import { z } from "zod";
import { Task, TaskStatus } from "../types";
import { createAdminClient } from "@/lib/appwrite";
import { Project } from "@/features/projects/type";
import {
  sendTaskAssignmentEmail,
  sendTaskUnassignmentEmail,
} from "@/lib/email";

const app = new Hono()
  .onError((err, c) => {
    console.error("API Error:", err.message);
    console.error(
      "Error details:",
      JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    );
    return c.json({ error: err.message }, 500);
  })
  .delete("/:taskId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const { taskId } = c.req.param();
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
    await databases.deleteDocument(DATABASE_ID, TASKS_ID, taskId);
    return c.json({ data: { $id: task.$id } });
  })
  .get(
    "/",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        projectId: z.string().nullish(),
        assigneeId: z.string().nullish(),
        status: z.nativeEnum(TaskStatus).nullish(),
        search: z.string().nullish(),
        dueDate: z.string().nullish(),
      })
    ),
    async (c) => {
      const { users } = await createAdminClient();
      const databases = c.get("databases");
      const user = c.get("user");
      const { workspaceId, projectId, assigneeId, status, search, dueDate } =
        c.req.valid("query");
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });
      if (!member) {
        return c.json({ error: "Member not found" }, 401);
      }

      const query = [
        Query.equal("workspaceId", workspaceId),
        Query.orderDesc("$createdAt"),
      ];

      if (projectId) {
        console.log(projectId);
        query.push(Query.equal("projectId", projectId));
      }
      if (status) {
        console.log(status);
        query.push(Query.equal("status", status));
      }
      if (assigneeId) {
        console.log(assigneeId);
        query.push(Query.equal("assigneeId", assigneeId));
      }
      if (search) {
        console.log(search);
        query.push(Query.search("name", search));
      }
      if (dueDate) {
        console.log(dueDate);
        query.push(Query.equal("dueDate", dueDate));
      }
      const tasks = await databases.listDocuments<Task>(
        DATABASE_ID,
        TASKS_ID,
        query
      );
      const projectIds = tasks.documents.map((task) => task.projectId);
      const assigneeIds = tasks.documents.map((task) => task.assigneeId);
      const projects = await databases.listDocuments<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        projectIds.length > 0 ? [Query.contains("$id", projectIds)] : []
      );
      const members = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_ID,
        assigneeIds.length > 0 ? [Query.contains("$id", assigneeIds)] : []
      );

      const assignees = await Promise.all(
        members.documents.map(async (member) => {
          try {
            const user = await users.get(member.userId);
            return {
              ...member,
              name: user.name || user.email || "Unknown User",
              email: user.email || "unknown@example.com",
            };
          } catch (error: any) {
            if (error.type !== "user_not_found") {
              console.error("Error fetching user:", error);
            }
            return {
              ...member,
              name: "Unknown User",
              email: "unknown@example.com",
            };
          }
        })
      );

      const populatedTasks = tasks.documents.map((task) => {
        const project = projects.documents.find(
          (project) => project.$id === task.projectId
        );

        const assignee = assignees.find(
          (assignee) => assignee.$id === task.assigneeId
        );
        return {
          ...task,
          project,
          assignee,
        };
      });

      return c.json({
        data: {
          ...tasks,
          documents: populatedTasks,
        },
      });
    }
  )
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", createTaskSchema),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { name, status, workspaceId, projectId, dueDate, assigneeId } =
        c.req.valid("json");
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });
      if (!member) {
        return c.json({ error: "Member not found" }, 401);
      }
      const highestPositionTask = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal("status", status),
          Query.equal("workspaceId", workspaceId),
          Query.orderAsc("position"),
          Query.limit(1),
        ]
      );
      const newPosition =
        highestPositionTask.documents.length > 0
          ? highestPositionTask.documents[0].position + 1000
          : 1000;
      const task = await databases.createDocument(
        DATABASE_ID,
        TASKS_ID,
        ID.unique(),
        {
          name,
          status,
          workspaceId,
          projectId,
          dueDate,
          assigneeId,
          position: newPosition,
        }
      );

      try {
        // Get the assignee's information to send the email
        const { users } = await createAdminClient();
        const assignee = await databases.getDocument(
          DATABASE_ID,
          MEMBERS_ID,
          assigneeId
        );

        const assigneeUser = await users.get(assignee.userId);

        // Get the project name
        const project = await databases.getDocument(
          DATABASE_ID,
          PROJECTS_ID,
          projectId
        );

        // Get the workspace info
        const workspaceDoc = await databases.getDocument(
          DATABASE_ID,
          WORKSPACES_ID,
          workspaceId
        );

        // Get the current user's name (the creator/assigner)
        const assigner = await users.get(user.$id);

        // Prepare the task link
        const taskLink = `${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${workspaceId}/tasks/${task.$id}`;

        // Send the email notification to the assignee
        await sendTaskAssignmentEmail(
          assigneeUser.email, // to
          name, // taskName
          taskLink, // taskLink
          dueDate.toString(), // dueDate (converted to string)
          project.name, // projectName
          workspaceDoc.name, // workspaceName
          status, // status
          assigner.name || assigner.email // senderName
        );
      } catch (error) {
        console.error("Failed to send task assignment email:", error);
        // Don't fail the task creation if email sending fails
      }

      return c.json({ data: task });
    }
  )
  .patch(
    "/:taskId",
    sessionMiddleware,
    zValidator("form", updateTaskSchema),
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");
      const { taskId } = c.req.param();
      const {
        name,
        status,
        description,
        projectId,
        dueDate,
        assigneeId,
        image,
        file,
      } = c.req.valid("form");

      try {
        const existingTask = await databases.getDocument<Task>(
          DATABASE_ID,
          TASKS_ID,
          taskId
        );

        const member = await getMember({
          databases,
          workspaceId: existingTask.workspaceId,
          userId: user.$id,
        });
        if (!member) {
          return c.json({ error: "Member not found" }, 401);
        }

        // Xử lý hình ảnh
        let uploadedImageUrl: string | undefined = undefined;
        if (image instanceof File) {
          // Kiểm tra kích thước hình ảnh (giới hạn 2MB)
          if (image.size > 2 * 1024 * 1024) {
            return c.json({ error: "Image must be less than 2MB" }, 400);
          }

          const fileObj = await storage.createFile(
            IMAGES_BUCKET_ID,
            ID.unique(),
            image
          );
          const arrayBuffer = await storage.getFileView(
            IMAGES_BUCKET_ID,
            fileObj.$id
          );
          uploadedImageUrl = `data:image/png;base64,${Buffer.from(
            arrayBuffer
          ).toString("base64")}`;
        } else {
          uploadedImageUrl = image;
        }

        // Xử lý tệp
        let uploadedFileUrl: string | undefined = undefined;
        let fileName: string | undefined = undefined;
        if (file instanceof File) {
          // Kiểm tra kích thước tệp (giới hạn 2MB)
          if (file.size > 2 * 1024 * 1024) {
            return c.json({ error: "File must be less than 2MB" }, 400);
          }

          const uploadedFile = await storage.createFile(
            FILES_BUCKET_ID,
            ID.unique(),
            file
          );
          const arrayBuffer = await storage.getFileView(
            FILES_BUCKET_ID,
            uploadedFile.$id
          );
          uploadedFileUrl = `data:application/octet-stream;base64,${Buffer.from(
            arrayBuffer
          ).toString("base64")}`;
          fileName = file.name;
        } else {
          uploadedFileUrl = file;
        }

        const updateData: Record<string, any> = {};

        if (name !== undefined) updateData.name = name;
        if (status !== undefined) updateData.status = status;
        if (description !== undefined) updateData.description = description;
        if (projectId !== undefined) updateData.projectId = projectId;
        if (dueDate !== undefined) updateData.dueDate = dueDate;
        if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
        if (uploadedImageUrl !== undefined)
          updateData.imageUrl = uploadedImageUrl;
        if (uploadedFileUrl !== undefined) updateData.fileUrl = uploadedFileUrl;
        if (fileName !== undefined) updateData.fileName = fileName;

        if (Object.keys(updateData).length === 0) {
          return c.json({ message: "No data to update" });
        }

        console.log("Updating task:", taskId);
        console.log("Update data:", JSON.stringify(updateData, null, 2));

        const task = await databases.updateDocument(
          DATABASE_ID,
          TASKS_ID,
          taskId,
          updateData
        );
        console.log("Task updated successfully");

        // Check if the assignee was changed
        if (assigneeId && assigneeId !== existingTask.assigneeId) {
          try {
            const { users } = await createAdminClient();

            // Get the new assignee's information
            const newAssignee = await databases.getDocument(
              DATABASE_ID,
              MEMBERS_ID,
              assigneeId
            );
            const newAssigneeUser = await users.get(newAssignee.userId);

            // Get the previous assignee's information
            const prevAssignee = await databases.getDocument(
              DATABASE_ID,
              MEMBERS_ID,
              existingTask.assigneeId
            );
            const prevAssigneeUser = await users.get(prevAssignee.userId);

            // Get the project name
            const projectId = updateData.projectId || existingTask.projectId;
            const project = await databases.getDocument(
              DATABASE_ID,
              PROJECTS_ID,
              projectId
            );

            // Get the workspace info
            const workspaceDoc = await databases.getDocument(
              DATABASE_ID,
              WORKSPACES_ID,
              existingTask.workspaceId
            );

            // Get the current user's name (the updater)
            const assigner = await users.get(user.$id);

            // Prepare the task link
            const taskLink = `${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${existingTask.workspaceId}/tasks/${task.$id}`;

            // Use the updated task name or the existing one
            const taskName = updateData.name || existingTask.name;

            // Use the updated status or the existing one
            const taskStatus = updateData.status || existingTask.status;

            // Use the updated due date or the existing one
            const taskDueDate = updateData.dueDate || existingTask.dueDate;

            // 1. Send notification to the new assignee
            await sendTaskAssignmentEmail(
              newAssigneeUser.email, // to
              taskName, // taskName
              taskLink, // taskLink
              taskDueDate.toString(), // dueDate
              project.name, // projectName
              workspaceDoc.name, // workspaceName
              taskStatus, // status
              assigner.name || assigner.email // senderName
            );

            // 2. Send notification to the previous assignee
            await sendTaskUnassignmentEmail(
              prevAssigneeUser.email, // to
              taskName, // taskName
              taskLink, // taskLink
              newAssigneeUser.name || newAssigneeUser.email, // newAssigneeName
              project.name, // projectName
              workspaceDoc.name, // workspaceName
              assigner.name || assigner.email // senderName
            );
          } catch (error) {
            console.error("Failed to send task reassignment emails:", error);
            // Don't fail the task update if email sending fails
          }
        }

        return c.json({ data: task });
      } catch (error) {
        console.error("Error in update task:", error);
        return c.json({ error: "Failed to update task" }, 500);
      }
    }
  )
  .patch(
    "/:taskId/json",
    sessionMiddleware,
    zValidator(
      "json",
      updateTaskSchema.extend({
        imageUrl: z.string().optional(),
        fileUrl: z.string().optional(),
        fileName: z.string().optional(),
      })
    ),
    async (c) => {
      try {
        console.log("Received request to update task with json");
        const databases = c.get("databases");
        const user = c.get("user");
        const { taskId } = c.req.param();

        // Lấy dữ liệu JSON đã được xác thực từ zValidator
        const validated = c.req.valid("json");
        console.log("JSON data received for task:", taskId);
        console.log("Validated data:", JSON.stringify(validated, null, 2));

        const {
          name,
          status,
          description,
          projectId,
          dueDate,
          assigneeId,
          imageUrl,
          fileUrl,
          fileName,
        } = validated;

        console.log("Task update fields:", {
          taskId,
          hasName: !!name,
          hasStatus: !!status,
          hasDescription: !!description,
          hasProjectId: !!projectId,
          hasDueDate: !!dueDate,
          hasAssigneeId: !!assigneeId,
          hasImageUrl: !!imageUrl,
          hasFileUrl: !!fileUrl,
          hasFileName: !!fileName,
        });

        const existingTask = await databases.getDocument<Task>(
          DATABASE_ID,
          TASKS_ID,
          taskId
        );

        const member = await getMember({
          databases,
          workspaceId: existingTask.workspaceId,
          userId: user.$id,
        });
        if (!member) {
          return c.json({ error: "Member not found" }, 401);
        }

        const updateData: Record<string, any> = {};

        if (name !== undefined) updateData.name = name;
        if (status !== undefined) updateData.status = status;
        if (description !== undefined) updateData.description = description;
        if (projectId !== undefined) updateData.projectId = projectId;
        if (dueDate !== undefined) updateData.dueDate = dueDate;
        if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
        if (fileName !== undefined) updateData.fileName = fileName;

        if (Object.keys(updateData).length === 0) {
          console.log("No fields to update");
          return c.json({ message: "No data to update" });
        }

        console.log("Updating task:", taskId);
        console.log("Update data:", JSON.stringify(updateData, null, 2));

        const task = await databases.updateDocument(
          DATABASE_ID,
          TASKS_ID,
          taskId,
          updateData
        );
        console.log("Task updated successfully");

        // Check if the assignee was changed
        if (assigneeId && assigneeId !== existingTask.assigneeId) {
          try {
            const { users } = await createAdminClient();

            // Get the new assignee's information
            const newAssignee = await databases.getDocument(
              DATABASE_ID,
              MEMBERS_ID,
              assigneeId
            );
            const newAssigneeUser = await users.get(newAssignee.userId);

            // Get the previous assignee's information
            const prevAssignee = await databases.getDocument(
              DATABASE_ID,
              MEMBERS_ID,
              existingTask.assigneeId
            );
            const prevAssigneeUser = await users.get(prevAssignee.userId);

            // Get the project name
            const projectId = updateData.projectId || existingTask.projectId;
            const project = await databases.getDocument(
              DATABASE_ID,
              PROJECTS_ID,
              projectId
            );

            // Get the workspace info
            const workspaceDoc = await databases.getDocument(
              DATABASE_ID,
              WORKSPACES_ID,
              existingTask.workspaceId
            );

            // Get the current user's name (the updater)
            const assigner = await users.get(user.$id);

            // Prepare the task link
            const taskLink = `${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${existingTask.workspaceId}/tasks/${task.$id}`;

            // Use the updated task name or the existing one
            const taskName = updateData.name || existingTask.name;

            // Use the updated status or the existing one
            const taskStatus = updateData.status || existingTask.status;

            // Use the updated due date or the existing one
            const taskDueDate = updateData.dueDate || existingTask.dueDate;

            // 1. Send notification to the new assignee
            await sendTaskAssignmentEmail(
              newAssigneeUser.email, // to
              taskName, // taskName
              taskLink, // taskLink
              taskDueDate.toString(), // dueDate
              project.name, // projectName
              workspaceDoc.name, // workspaceName
              taskStatus, // status
              assigner.name || assigner.email // senderName
            );

            // 2. Send notification to the previous assignee
            await sendTaskUnassignmentEmail(
              prevAssigneeUser.email, // to
              taskName, // taskName
              taskLink, // taskLink
              newAssigneeUser.name || newAssigneeUser.email, // newAssigneeName
              project.name, // projectName
              workspaceDoc.name, // workspaceName
              assigner.name || assigner.email // senderName
            );
          } catch (error) {
            console.error("Failed to send task reassignment emails:", error);
            // Don't fail the task update if email sending fails
          }
        }

        return c.json({ data: task });
      } catch (error) {
        console.error("Error in update task:", error);
        return c.json({ error: "Failed to update task" }, 500);
      }
    }
  )
  .get("/:taskId", sessionMiddleware, async (c) => {
    const currentUser = c.get("user");
    const databases = c.get("databases");
    const { users } = await createAdminClient();
    const { taskId } = c.req.param();

    const task = await databases.getDocument<Task>(
      DATABASE_ID,
      TASKS_ID,
      taskId
    );

    const currentMember = await getMember({
      databases,
      workspaceId: task.workspaceId,
      userId: currentUser.$id,
    });
    if (!currentMember) {
      return c.json({ error: "Member not found" }, 401);
    }
    const project = await databases.getDocument<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      task.projectId
    );

    const member = await databases.getDocument(
      DATABASE_ID,
      MEMBERS_ID,
      task.assigneeId
    );

    const user = await users.get(member.userId);

    const assignee = {
      ...member,
      name: user.name || user.email,
      email: user.email,
    };

    return c.json({
      data: {
        ...task,
        project,
        assignee,
      },
    });
  })
  .post(
    "/bulk-update",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        tasks: z.array(
          z.object({
            $id: z.string(),
            status: z.nativeEnum(TaskStatus),
            position: z.number().int().positive().min(1000).max(1_000_000),
          })
        ),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const { tasks } = await c.req.valid("json");
      const user = c.get("user");
      const tasksToUpdate = await databases.listDocuments<Task>(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.contains(
            "$id",
            tasks.map((task) => task.$id)
          ),
        ]
      );

      const workspaceIds = new Set(
        tasksToUpdate.documents.map((task) => task.workspaceId)
      );

      if (workspaceIds.size !== 1) {
        return c.json(
          { error: "Tasks must belong to the same workspace" },
          400
        );
      }

      const workspaceId = workspaceIds.values().next().value;

      if (!workspaceId) {
        return c.json({ error: "Workspace not found" }, 404);
      }

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });
      if (!member) {
        return c.json({ error: "Member not found" }, 401);
      }

      const updatedTasks = await Promise.all(
        tasks.map(async (task) => {
          const { $id, status, position } = task;
          return databases.updateDocument<Task>(DATABASE_ID, TASKS_ID, $id, {
            status,
            position,
          });
        })
      );

      return c.json({ data: updatedTasks });
    }
  );

export default app;
