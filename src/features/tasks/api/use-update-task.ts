import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.tasks)[":taskId"]["json"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks)[":taskId"]["json"]["$patch"]
>;

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.tasks[":taskId"]["json"]["$patch"]({
        json,
        param,
      });
      if (!response.ok) {
        throw new Error("Failed to update task. Please try again later.");
      }
      return await response.json();
    },
    onSuccess: (response) => {
      toast.success("Task updated");

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if ("data" in response && response.data.$id) {
        queryClient.invalidateQueries({
          queryKey: ["task", response.data.$id],
        });
        queryClient.invalidateQueries({
          queryKey: ["project-analytics"],
        });
        queryClient.invalidateQueries({
          queryKey: ["workspace-analytics"],
        });
      }
    },
    onError: () => {
      toast.error("Failed to update task. Please try again later.");
    },
  });

  return mutation;
};
