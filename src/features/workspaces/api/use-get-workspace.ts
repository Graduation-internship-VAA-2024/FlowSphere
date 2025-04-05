import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";

interface UseGetWorkspaceProps {
  workspaceId: string;
}

export const useGetWorkspace = ({ workspaceId }: UseGetWorkspaceProps) => {
  const query = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      const response = await client.api.workspaces[":workspaceId"].$get({
        param: { workspaceId },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch workspace. Please try again later.");
      }
      const { data } = await response.json();
      console.log({ data });
      return data;
    },
  });
  return query;
};
