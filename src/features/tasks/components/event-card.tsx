import { Project } from "@/features/projects/type";
import { TaskStatus } from "../types";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useRouter } from "next/navigation";
import { User2, FolderKanban } from "lucide-react";

interface EventCardProps {
  title: string;
  assignee: any;
  project: Project;
  status: TaskStatus;
  id: string;
}

const statusColorMap: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "border-l-gray-500",
  [TaskStatus.TODO]: "border-l-red-500",
  [TaskStatus.IN_PROGRESS]: "border-l-yellow-500",
  [TaskStatus.IN_REVIEW]: "border-l-blue-500",
  [TaskStatus.DONE]: "border-l-green-500",
};

export const EventCard = ({
  title,
  assignee,
  project,
  status,
  id,
}: EventCardProps) => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    router.push(`/workspaces/${workspaceId}/tasks/${id}`);
  };

  return (
    <div className="px-2 py-1">
      <div
        onClick={onClick}
        className={cn(
          "p-3 text-sm bg-white text-primary border rounded-lg border-l-4 cursor-pointer transition",
          statusColorMap[status]
        )}
      >
        <p className="font-semibold truncate">{title}</p>
        <div className="flex items-center gap-x-4 mt-2">
          {/* Avatar người dùng với icon nhỏ overlay */}
          <div className="relative">
            <MemberAvatar
              name={assignee?.name}
              className="border border-gray-200"
            />
            <span className="absolute bottom-0 right-0  w-3 h-3 bg-white rounded-full flex items-center justify-center">
              <User2 className="w-2 h-2 text-gray-500" />
            </span>
          </div>

          {/* Avatar dự án với icon nhỏ overlay */}
          <div className="relative">
            <ProjectAvatar
              name={project?.name}
              image={project?.imageUrl}
              className="border border-gray-200"
            />
            <span className="absolute bottom-0 right-0  w-3 h-3 bg-white rounded-full flex items-center justify-center">
              <FolderKanban className="w-2 h-2 text-gray-500" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
