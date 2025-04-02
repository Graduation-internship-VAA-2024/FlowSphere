import { snakeCaseToTitleCase, cn } from "@/lib/utils";
import { TaskStatus } from "../types";
import {
  Clock,
  ListTodo,
  TimerIcon,
  SearchCheck,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateTaskModal } from "../hooks/use-create-task-modal";

const statusConfig = {
  [TaskStatus.BACKLOG]: {
    gradient: "from-gray-600 to-gray-500",
    shadow: "shadow-gray-500/30",
    text: "text-gray-700",
    badge: "bg-gray-100",
    icon: Clock,
    iconClass: "text-gray-600",
  },
  [TaskStatus.TODO]: {
    gradient: "from-red-600 to-red-500",
    shadow: "shadow-red-500/30",
    text: "text-red-700",
    badge: "bg-red-100",
    icon: ListTodo,
    iconClass: "text-red-600",
  },
  [TaskStatus.IN_PROGRESS]: {
    gradient: "from-yellow-600 to-yellow-500",
    shadow: "shadow-yellow-500/30",
    text: "text-yellow-700",
    badge: "bg-yellow-100",
    icon: TimerIcon,
    iconClass: "text-yellow-600",
  },
  [TaskStatus.IN_REVIEW]: {
    gradient: "from-blue-600 to-blue-500",
    shadow: "shadow-blue-500/30",
    text: "text-blue-700",
    badge: "bg-blue-100",
    icon: SearchCheck,
    iconClass: "text-blue-600",
  },
  [TaskStatus.DONE]: {
    gradient: "from-green-600 to-green-500",
    shadow: "shadow-green-500/30",
    text: "text-green-700",
    badge: "bg-green-100",
    icon: CheckCircle2,
    iconClass: "text-green-600",
  },
};

interface KanbanColumnHeaderProps {
  board: TaskStatus;
  taskCount: number;
}

export const KanbanColumnHeader = ({
  board,
  taskCount,
}: KanbanColumnHeaderProps) => {
  const config = statusConfig[board];
  const Icon = config.icon;
  const { open } = useCreateTaskModal();

  return (
    <div className="relative group">
      {/* Gradient Background */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg opacity-50 blur-md transition-all duration-500",
          `bg-gradient-to-r ${config.gradient}`
        )}
      />

      <div
        className={cn(
          "relative px-4 py-3 flex items-center justify-between",
          "rounded-lg shadow-md transition-all duration-300",
          "hover:shadow-lg hover:scale-105",
          config.shadow
        )}
      >
        {/* Left Section (Icon + Title) */}
        <div className="flex items-center gap-x-3">
          <Icon
            className={cn(
              "size-5 transition-transform duration-300",
              "group-hover:scale-110",
              config.iconClass
            )}
          />
          <h2
            className={cn(
              "text-sm font-semibold tracking-wide transition-colors duration-300",
              "group-hover:text-white",
              config.text
            )}
          >
            {snakeCaseToTitleCase(board)}
          </h2>
        </div>

        {/* Right Section (Task Count + Add Button) */}
        <div className="flex items-center gap-x-2">
          <div
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              "shadow-sm border transition-all duration-300",
              "group-hover:scale-110 group-hover:shadow-md",
              config.badge,
              config.text
            )}
          >
            {taskCount}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-opacity-10 transition-all"
            onClick={open}
          >
            <Plus className="size-5 text-gray-500 group-hover:text-gray-700" />
          </Button>
        </div>
      </div>
    </div>
  );
};
