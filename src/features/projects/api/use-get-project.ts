import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";

interface UseGetProjectsProps {
  projectId: string;
}

export const useGetProject = ({ projectId }: UseGetProjectsProps) => {
  const query = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await client.api.projects[":projectId"].$get({
        param: { projectId },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch project. Please try again later.");
      }
      const { data } = await response.json();
      console.log({ data });
      return data;
    },
  });
  return query;
};
