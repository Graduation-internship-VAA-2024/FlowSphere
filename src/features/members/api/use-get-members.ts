import { useQuery } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";

interface UseGetMembersProps {
  workspaceId?: string;
  initialData?: any;
  enabled?: boolean;
}

// API cho thành viên
export const membersApi = {
  getMembers: (workspaceId: string) =>
    rpc({
      method: "GET",
      path: `/api/members`,
      query: { workspaceId },
    }),
};

export const useGetMembers = ({
  workspaceId,
  initialData,
  enabled = true,
}: UseGetMembersProps) => {
  return useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }
      const response = await membersApi.getMembers(workspaceId);
      return response.data;
    },
    initialData,
    enabled: !!workspaceId && enabled,
  });
};
