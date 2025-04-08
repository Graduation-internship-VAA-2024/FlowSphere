import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";

interface UseGetWorkLogsProps {
  taskId: string;
  enabled?: boolean;
}

export const useGetWorkLogs = ({
  taskId,
  enabled = true,
}: UseGetWorkLogsProps) => {
  const query = useQuery({
    queryKey: ["work-logs", taskId],
    queryFn: async () => {
      try {
        const response = await client.api["work-logs"][":taskId"].$get({
          param: { taskId },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch work logs. Please try again later.");
        }

        const result = await response.json();
        console.log("Work logs data:", result);
        return result;
      } catch (error) {
        console.error("Error fetching work logs:", error);
        throw error;
      }
    },
    enabled: enabled && !!taskId,
    retry: 1,
  });

  return query;
};
