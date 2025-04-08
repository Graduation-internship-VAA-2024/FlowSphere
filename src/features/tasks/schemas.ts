import { z } from "zod";
import { TaskStatus } from "./types";

// Schema cho mỗi hình ảnh trong mảng
const taskImageSchema = z.object({
  id: z.string(),
  url: z.string(),
});

// Schema cho mỗi tệp tin trong mảng
const taskFileSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string(),
});

export const createTaskSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  status: z.nativeEnum(TaskStatus),
  workspaceId: z.string().trim().min(1, "Required"),
  projectId: z.string().trim().min(1, "Required"),
  dueDate: z.coerce.date(),
  assigneeId: z.string().trim().min(1, "Required"),
  description: z.string().optional(),
  images: z.array(taskImageSchema).optional(),
  files: z.array(taskFileSchema).optional(),
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
  images: z.array(z.instanceof(File)).optional(),
  files: z.array(z.instanceof(File)).optional(),
  imageUrls: z.array(taskImageSchema).optional(),
  fileUrls: z.array(taskFileSchema).optional(),
});

export const logWorkSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  timeSpent: z.string().min(1, "Time spent is required"),
  dateStarted: z.string().min(1, "Start date is required"),
  description: z.string().optional(),
});

export const updateEstimateSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  remainingEstimate: z.string().min(1, "Remaining estimate is required"),
});
