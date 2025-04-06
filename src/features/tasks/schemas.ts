import { z } from "zod";
import { TaskStatus } from "./types";

export const createTaskSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  status: z.nativeEnum(TaskStatus),
  workspaceId: z.string().trim().min(1, "Required"),
  projectId: z.string().trim().min(1, "Required"),
  dueDate: z.coerce.date(),
  assigneeId: z.string().trim().min(1, "Required"),
  description: z.string().optional(),
});

export const updateTaskSchema = z.object({
  name: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  projectId: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  description: z.string().optional(),
  image: z.union([z.instanceof(File), z.string()]).optional(),
  file: z.union([z.instanceof(File), z.string()]).optional(),
});
