import { Button } from "@/components/ui/button";
import { Task } from "../types";
import { PencilIcon, ClockIcon } from "lucide-react";
import { DottedSeparator } from "@/components/dotted-separator";
import { OverviewProperty } from "./overview-property";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { TaskDate } from "./task-date";
import { Badge } from "@/components/ui/badge";
import { snakeCaseToTitleCase } from "@/lib/utils";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";
import { useState } from "react";
import { WorkLogDialog } from "@/features/work-logs/components";

interface TaskOverviewProps {
  task: Task;
  onTaskUpdated?: () => void;
}

export const TaskOverview = ({ task, onTaskUpdated }: TaskOverviewProps) => {
  const { open } = useEditTaskModal();
  const [showLogWorkDialog, setShowLogWorkDialog] = useState(false);

  return (
    <div className="flex flex-col gap-y-4 col-span-1">
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Overview</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogWorkDialog(true)}
              className="flex items-center gap-1"
            >
              <ClockIcon className="size-4" />
              Log Work
            </Button>
            <Button onClick={() => open(task.$id)}>
              <PencilIcon className="size-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
        <DottedSeparator className="my-4" />
        <div className="flex flex-col gap-y-4">
          {" "}
          <OverviewProperty label="Assigned to">
            <MemberAvatar name={task.assignee.name} className="size-6" />
            <p className="text-gray-900 text-sm font-medium">
              {task.assignee.name || "Unassigned"}
            </p>
          </OverviewProperty>
          <OverviewProperty label="Due date">
            <TaskDate value={task.dueDate} className="text-sm font-medium" />
          </OverviewProperty>
          <OverviewProperty label="Status">
            <Badge variant={task.status}>
              {snakeCaseToTitleCase(task.status)}
            </Badge>
          </OverviewProperty>
          <OverviewProperty label="Remaining Estimate">
            {task.remainingEstimate ? (
              <span className="text-sm font-medium">
                {task.remainingEstimate}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground italic">
                Not set
              </span>
            )}
          </OverviewProperty>
        </div>
      </div>

      <WorkLogDialog
        task={task}
        open={showLogWorkDialog}
        onOpenChange={setShowLogWorkDialog}
        onTaskUpdated={onTaskUpdated}
      />
    </div>
  );
};
