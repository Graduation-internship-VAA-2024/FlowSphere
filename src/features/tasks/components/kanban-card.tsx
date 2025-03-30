import { MoreHorizontal } from "lucide-react";
import { Task } from "../types";
import { TaskActions } from "./task-actions";
import { DottedSeparator } from "@/components/dotted-separator";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { TaskDate } from "./task-date";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";

interface KanbanCardProps {
  task: Task;
}

export const KanbanCard = ({ task }: KanbanCardProps) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer w-full border border-blue-200">
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
