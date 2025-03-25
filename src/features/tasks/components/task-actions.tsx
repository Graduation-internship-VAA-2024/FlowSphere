import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  DeleteIcon,
  Edit2Icon,
  ExternalLinkIcon,
  FolderOpen,
} from "lucide-react";

interface TaskActionsProps {
  id: string;
  projectId: string;
  children: React.ReactNode;
}

export const TaskActions = ({ id, projectId, children }: TaskActionsProps) => {
  return (
    <div className="flex justify-end">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={cn(
            "w-56",
            "border border-gray-100",
            "shadow-lg shadow-gray-100/50",
            "animate-in fade-in-0 zoom-in-95",
            "bg-white/80 backdrop-blur-sm"
          )}
        >
          <DropdownMenuItem
            onClick={() => {}}
            disabled={false}
            className={cn(
              "group flex items-center",
              "font-medium p-3",
              "transition-colors duration-150",
              "hover:bg-blue-50/80 focus:bg-blue-50/80",
              "data-[disabled]:opacity-50"
            )}
          >
            <ExternalLinkIcon
              className={cn(
                "mr-2 size-4 stroke-2",
                "text-blue-500",
                "transition-transform duration-200",
                "group-hover:scale-110"
              )}
            />
            <span className="group-hover:text-blue-600">Task Details</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {}}
            disabled={false}
            className={cn(
              "group flex items-center",
              "font-medium p-3",
              "transition-colors duration-150",
              "hover:bg-violet-50/80 focus:bg-violet-50/80"
            )}
          >
            <Edit2Icon
              className={cn(
                "mr-2 size-4 stroke-2",
                "text-violet-500",
                "transition-transform duration-200",
                "group-hover:scale-110"
              )}
            />
            <span className="group-hover:text-violet-600">Edit Task</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {}}
            disabled={false}
            className={cn(
              "group flex items-center",
              "font-medium p-3",
              "transition-colors duration-150",
              "hover:bg-emerald-50/80 focus:bg-emerald-50/80"
            )}
          >
            <FolderOpen
              className={cn(
                "mr-2 size-4 stroke-2",
                "text-emerald-500",
                "transition-transform duration-200",
                "group-hover:scale-110"
              )}
            />
            <span className="group-hover:text-emerald-600">Open Project</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 opacity-50" />

          <DropdownMenuItem
            onClick={() => {}}
            disabled={false}
            className={cn(
              "group flex items-center",
              "font-medium p-3",
              "transition-all duration-150",
              "hover:bg-red-50/80 focus:bg-red-50/80",
              "hover:pl-4" // Slide effect
            )}
          >
            <DeleteIcon
              className={cn(
                "mr-2 size-4 stroke-2",
                "text-red-500",
                "transition-all duration-200",
                "group-hover:scale-110 group-hover:rotate-12"
              )}
            />
            <span
              className={cn(
                "group-hover:text-red-600",
                "group-hover:font-semibold"
              )}
            >
              Delete Task
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
