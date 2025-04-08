import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ResponseType = InferResponseType<(typeof client.api.auth.logout)["$post"]>;

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.auth.logout["$post"]();
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Logged out successfully");
      // Thay đổi redirect path từ "/" thành "/sign-in"
      router.push("/sign-in");
      // Xóa cache của các queries liên quan
      queryClient.clear();
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast.error("Logout failed");
    },
  });

  return mutation;
};
