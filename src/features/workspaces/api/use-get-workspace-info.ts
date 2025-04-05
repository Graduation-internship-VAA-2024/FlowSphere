import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";

interface UseGetWorkspaceInfoProps {
  workspaceId: string;
}

export const useGetWorkspaceInfo = ({
  workspaceId,
}: UseGetWorkspaceInfoProps) => {
  const query = useQuery({
    queryKey: ["workspace-info", workspaceId],
    queryFn: async () => {
      const response = await client.api.workspaces[":workspaceId"]["info"].$get(
        {
          param: { workspaceId },
        }
      );
      if (!response.ok) {
        throw new Error(
          "Failed to fetch workspace info. Please try again later."
        );
      }
      const { data } = await response.json();
      console.log({ data });
      return data;
    },
  });
  return query;
};
