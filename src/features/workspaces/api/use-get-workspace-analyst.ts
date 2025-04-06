import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";
import { InferResponseType } from "hono";

interface UseGetWorkspaceAnalystProps {
  workspaceId: string;
}

export type ProjectAnalyticsResponseType = InferResponseType<
  (typeof client.api.workspaces)[":workspaceId"]["analytics"]["$get"],
  200
>;

export const useGetWorkspaceAnalytic = ({
  workspaceId,
}: UseGetWorkspaceAnalystProps) => {
  const query = useQuery({
    queryKey: ["workspace-analytics", workspaceId],
    queryFn: async () => {
      const response = await client.api.workspaces[":workspaceId"][
        "analytics"
      ].$get({
        param: { workspaceId },
      });
      if (!response.ok) {
        throw new Error(
          "Failed to fetch workspace analytics. Please try again later."
        );
      }
      const { data } = await response.json();
      console.log({ data });
      return data;
    },
  });
  return query;
};
