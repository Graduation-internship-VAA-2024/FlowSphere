import { useMutation } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";
import { changePasswordSchema } from "../schemas";
import { z } from "zod";

type ChangePasswordData = z.infer<typeof changePasswordSchema>;
type ResponseType = InferResponseType<
  (typeof client.api.auth)["change-password"]["$patch"]
>;

export const useChangePassword = () => {
  const mutation = useMutation<ResponseType, Error, ChangePasswordData>({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await client.api.auth["change-password"].$patch({
        json: data,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to change password");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to change password");
    },
  });

  return mutation;
};
