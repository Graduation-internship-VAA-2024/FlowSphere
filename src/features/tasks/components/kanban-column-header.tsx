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
    gradient: "from-red-500 to-red-400",
    shadow: "shadow-red-400/30",
    text: "text-red-700",
    badge: "bg-red-100",
    icon: Clock,
    iconClass: "text-red-500",
  },
  [TaskStatus.TODO]: {
    gradient: "from-orange-500 to-orange-400",
    shadow: "shadow-orange-400/30",
    text: "text-orange-700",
    badge: "bg-orange-100",
    icon: ListTodo,
    iconClass: "text-orange-500",
  },
  [TaskStatus.IN_PROGRESS]: {
    gradient: "from-yellow-500 to-yellow-400",
    shadow: "shadow-yellow-400/30",
    text: "text-yellow-700",
    badge: "bg-yellow-100",
    icon: TimerIcon,
    iconClass: "text-yellow-500",
  },
  [TaskStatus.IN_REVIEW]: {
    gradient: "from-blue-500 to-blue-400",
    shadow: "shadow-blue-400/30",
    text: "text-blue-700",
    badge: "bg-blue-100",
    icon: SearchCheck,
    iconClass: "text-blue-500",
  },
  [TaskStatus.DONE]: {
    gradient: "from-emerald-500 to-green-400",
    shadow: "shadow-emerald-400/30",
    text: "text-emerald-700",
    badge: "bg-emerald-100",
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
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
