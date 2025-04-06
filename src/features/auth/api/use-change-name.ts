import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";
import { changeNameSchema } from "../schemas";
import { z } from "zod";

type ChangeNameData = z.infer<typeof changeNameSchema>;
type ResponseType = InferResponseType<
  (typeof client.api.auth)["change-name"]["$patch"]
>;

export const useChangeName = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, ChangeNameData>({
    mutationFn: async (data: ChangeNameData) => {
      const response = await client.api.auth["change-name"].$patch({
        json: data,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to change name");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Name updated successfully");
      // Invalidate current user data to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["current"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update name");
    },
  });

  return mutation;
};
