import { z } from "zod";

export const logWorkSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  timeSpent: z.string().min(1, "Time spent is required"),
  dateStarted: z.string().min(1, "Start date is required"),
  description: z.string().optional(),
});

export type LogWorkFormValues = z.infer<typeof logWorkSchema>;

export const updateEstimateSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  remainingEstimate: z.string().min(1, "Remaining estimate is required"),
});

export type EstimateFormValues = z.infer<typeof updateEstimateSchema>;
