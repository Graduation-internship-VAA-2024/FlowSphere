import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
});
