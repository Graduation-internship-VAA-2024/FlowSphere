import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";

interface UseGetTaskProps {
  taskId: string;
}

export const useGetTask = ({ taskId }: UseGetTaskProps) => {
  const query = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      try {
        console.log("Fetching task:", taskId);

        const response = await client.api.tasks[":taskId"].$get({
          param: { taskId },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch task. Please try again later.");
        }

        const { data } = await response.json();

        console.log("Task data:", {
          id: data.$id,
          name: data.name,
          status: data.status,
          assignee: data.assignee?.name,
          remainingEstimate: data.remainingEstimate || "Not set",
          dueDate: data.dueDate,
        });

        return data;
      } catch (error) {
        console.error("Error fetching task:", error);
        throw error;
      }
    },
  });
  return query;
};
