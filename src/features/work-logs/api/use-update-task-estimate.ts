import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

interface UpdateEstimateParams {
  taskId: string;
  remainingEstimate: string;
}

export const useUpdateTaskEstimate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEstimateParams) => {
      try {
        console.log("Updating task estimate with data:", data);

        const response = await client.api["work-logs"].estimate[
          ":taskId"
        ].$patch({
          param: { taskId: data.taskId },
          json: data,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Task estimate update failed:", errorData);
          throw new Error(
            `Failed to update task estimate: ${
              (errorData as any).error || "Unknown error"
            }`
          );
        }

        const result = await response.json();
        console.log("Task estimate update successful:", result);
        return result;
      } catch (error) {
        console.error("Error updating task estimate:", error);
        throw error;
      }
    },
    onSuccess: (result, variables) => {
      console.log("Mutation succeeded:", { result, variables });
      toast.success("Task estimate updated successfully");
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast.error(
        `Failed to update task estimate: ${
          error.message || "Please try again later."
        }`
      );
    },
  });
};
