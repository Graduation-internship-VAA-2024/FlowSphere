import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useInviteWorkspace = () => {
  return useMutation({
    mutationFn: async ({
      workspaceId,
      email,
    }: {
      workspaceId: string;
      email: string;
    }) => {
      const response = await client.api.workspaces[":workspaceId"]["invite"][
        "$post"
      ]({
        param: { workspaceId },
        json: { email },
      });

      if (!response.ok) {
        const error = await response.json();
        if ("error" in error) {
          throw new Error("Failed to invite user: " + error.error);
        }
        throw new Error("Failed to invite user: Unknown error");
      }

      return response.json();
    },
  });
};
