import { useRouter } from "next/navigation";
import { TaskStatus } from "../types";
import { CheckCircle, CircleDashed, CircleDot, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface EventCardProps {
  id: string;
  title: string;
  project?: {
    name: string;
    workspaceId: string;
  };
  assignee?: {
    name: string;
    avatarUrl?: string;
  };
  status?: TaskStatus;
}

export const EventCard = ({
  id,
  title,
  project,
  assignee,
  status,
}: EventCardProps) => {
  const router = useRouter();

  const getStatusIcon = () => {
    switch (status) {
      case TaskStatus.DONE:
        return (
          <CheckCircle className="w-3.5 h-3.5 text-green-600 drop-shadow-sm" />
        );
      case TaskStatus.IN_PROGRESS:
        return (
          <CircleDot className="w-3.5 h-3.5 text-amber-600 drop-shadow-sm" />
        );
      case TaskStatus.TODO:
        return (
          <CircleDashed className="w-3.5 h-3.5 text-gray-600 drop-shadow-sm" />
        );
      case TaskStatus.IN_REVIEW:
        return <Clock className="w-3.5 h-3.5 text-blue-600 drop-shadow-sm" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-purple-600 drop-shadow-sm" />;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case TaskStatus.DONE:
        return "status-done";
      case TaskStatus.IN_PROGRESS:
        return "status-in-progress";
      case TaskStatus.TODO:
        return "status-todo";
      case TaskStatus.IN_REVIEW:
        return "status-in-review";
      default:
        return "status-backlog";
    }
  };

  const handleClick = () => {
    router.push(`/workspaces/${project?.workspaceId}/tasks/${id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`p-2 rounded-md shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] overflow-hidden group ${getStatusClass()}`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">{getStatusIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-gray-800 truncate group-hover:text-primary transition-colors duration-200">
            {title}
          </h4>
          {project && (
            <div className="mt-0.5 flex items-center gap-1">
              <span className="text-[10px] truncate text-gray-600 max-w-[80%] font-medium">
                {project.name}
              </span>
            </div>
          )}
        </div>
        {assignee && (
          <div className="flex-shrink-0">
            <Avatar className="h-5 w-5 ring-1 ring-white shadow-sm">
              <div className="bg-primary text-white w-full h-full flex items-center justify-center text-[8px] font-medium uppercase">
                {assignee?.name?.charAt(0) || "U"}
              </div>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  );
};
