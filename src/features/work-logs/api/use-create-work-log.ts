import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

interface WorkLogFormData {
  taskId: string;
  timeSpent: string;
  dateStarted: string;
  description?: string;
  workspaceId?: string;
  progress?: number;
}

export const useCreateWorkLog = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: WorkLogFormData) => {
      const response = await client.api["work-logs"].create.$post({
        json: values,
      });

      if (!response.ok) {
        throw new Error("Failed to log work. Please try again later.");
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast.success("Work logged successfully");

      // Extract taskId to invalidate the correct queries
      const taskId = variables.taskId;
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: ["work-logs", taskId] });
        queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      }
    },
    onError: () => {
      toast.error("Failed to log work. Please try again later.");
    },
  });

  return mutation;
};
