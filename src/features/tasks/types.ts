import { Models } from "node-appwrite";

export enum TaskStatus {
  BACKLOG = "BACKLOG",
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
}

export type Task = Models.Document & {
  name: string;
  status: TaskStatus;
  workspaceId: string;
  assigneeId: string;
  projectId: string;
  position: number;
  dueDate: string;
  description?: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
};

export interface TaskImage {
  id: string;
  url: string;
}

export interface TaskFile {
  id: string;
  url: string;
  name: string;
}
