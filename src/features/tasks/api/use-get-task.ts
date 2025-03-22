import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";

interface UseGetTaskProps {
  workspaceId: string;
}

export const useGetTask = ({ workspaceId }: UseGetTaskProps) => {
  const query = useQuery({
    queryKey: ["tasks", workspaceId],
    queryFn: async () => {
      const response = await client.api.tasks.$get({
        query: { workspaceId },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tasks. Please try again later.");
      }
      const { data } = await response.json();
      return data;
    },
  });
  return query;
};
