import { MoreHorizontal } from "lucide-react";
import { Task, TaskStatus } from "../types";
import { TaskActions } from "./task-actions";
import { DottedSeparator } from "@/components/dotted-separator";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { TaskDate } from "./task-date";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { cn } from "@/lib/utils";

const statusColorConfig = {
  [TaskStatus.BACKLOG]: {
    background: "bg-gray-50",
    border: "border-gray-200",
    hover: "hover:bg-gray-100",
  },
  [TaskStatus.TODO]: {
    background: "bg-red-50",
    border: "border-red-200",
    hover: "hover:bg-red-100",
  },
  [TaskStatus.IN_PROGRESS]: {
    background: "bg-yellow-50",
    border: "border-yellow-200",
    hover: "hover:bg-yellow-100",
  },
  [TaskStatus.IN_REVIEW]: {
    background: "bg-blue-50",
    border: "border-blue-200",
    hover: "hover:bg-blue-100",
  },
  [TaskStatus.DONE]: {
    background: "bg-green-50",
    border: "border-green-200",
    hover: "hover:bg-green-100",
  },
};

interface KanbanCardProps {
  task: Task;
}

export const KanbanCard = ({ task }: KanbanCardProps) => {
  const statusColor = statusColorConfig[task.status];

  return (
    <div
      className={cn(
        "p-4 rounded-lg shadow-sm transition-all cursor-pointer w-full border",
        statusColor.background,
        statusColor.border,
        statusColor.hover
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-x-2 mb-3">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2">
          {task.name}
        </p>
        <TaskActions id={task.$id} projectId={task.projectId}>
          <MoreHorizontal className="size-5 stroke-1 text-neutral-700 hover:opacity-75 transition" />
        </TaskActions>
      </div>

      <DottedSeparator className="my-3" />

      {/* Member Section */}
      <div className="flex items-center gap-x-3 text-gray-700 text-sm mb-3">
        <MemberAvatar name={task.assignee.name} fallbackClassName="text-sm" />
        <div>
          <p className="font-medium">Member:</p>
          <p className="text-gray-900">{task.assignee.name || "Unassigned"}</p>
        </div>
      </div>

      {/* Project Section */}
      <div className="flex items-center gap-x-3 text-gray-700 text-sm">
        <ProjectAvatar
          name={task.project.name}
          image={task.project.imageUrl}
          fallbackClassName="text-sm"
        />
        <div>
          <p className="font-medium">Project:</p>
          <p className="text-gray-900">{task.project.name || "No project"}</p>
        </div>
      </div>

      <DottedSeparator className="my-3" />

      {/* Task Date */}
      <div className="flex items-center gap-x-2 text-xs text-gray-700">
        <p className="font-medium">Due Date:</p>
        <TaskDate value={task.dueDate} />
      </div>
    </div>
  );
};
