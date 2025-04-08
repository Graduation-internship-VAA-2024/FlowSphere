import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

interface DeleteWorkLogParams {
  workLogId: string;
  taskId: string;
}

export const useDeleteWorkLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workLogId, taskId }: DeleteWorkLogParams) => {
      const response = await client.api["work-logs"].delete[
        ":workLogId"
      ].$delete({
        param: { workLogId },
      });

      if (!response.ok) {
        throw new Error("Failed to delete work log. Please try again later.");
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast.success("Work log deleted successfully");

      queryClient.invalidateQueries({
        queryKey: ["work-logs", variables.taskId],
      });
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
    },
    onError: () => {
      toast.error("Failed to delete work log. Please try again later.");
    },
  });
};
