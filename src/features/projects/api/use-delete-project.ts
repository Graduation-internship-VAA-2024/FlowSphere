import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.projects)[":projectId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.projects)[":projectId"]["$delete"]
>;

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.projects[":projectId"]["$delete"]({
        param,
      });
      if (!response.ok) {
        throw new Error("Failed to delete project. Please try again later.");
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      if (data.tasksDeleted && data.tasksDeleted > 0) {
        toast.success(
          `Project deleted with ${data.tasksDeleted} related tasks`
        );
      } else {
        toast.success("Project deleted");
      }

      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.$id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to delete project. Please try again later.");
    },
  });

  return mutation;
};
