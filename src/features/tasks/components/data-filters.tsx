import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { FolderCheckIcon, ListCheckIcon, User } from "lucide-react";
import { TaskStatus } from "@/features/tasks/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskFilters } from "../hooks/use-task-filters";
import { DatePicker } from "@/components/date-picker";

interface DataFiltersProps {
  hideProjectFilter?: boolean;
}

export const DataFilters = ({ hideProjectFilter }: DataFiltersProps) => {
  const workspaceId = useWorkspaceId();
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });
  const isLoading = isLoadingProjects || isLoadingMembers;
  const projectOptions = projects?.documents.map((project) => ({
    value: project.$id,
    label: project.name,
  }));
  const memberOptions = members?.documents.map(
    (member: { $id: string; name?: string; email?: string }) => ({
      value: member.$id,
      label: member.name || member.email || "Unknown User",
    })
  );

  const [{ status, assigneeId, projectId, dueDate }, setFilters] =
    useTaskFilters();

  const onStatusChange = (value: string) => {
    setFilters({
      status: value === "all" ? null : (value as TaskStatus),
    });
  };

  const onAssigneeChange = (value: string) => {
    setFilters({
      assigneeId: value === "all" ? null : (value as string),
    });
  };
  const onProjectChange = (value: string) => {
    setFilters({
      projectId: value === "all" ? null : (value as string),
    });
  };

  if (isLoading) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      <Select
        defaultValue={status ?? undefined}
        onValueChange={(value) => onStatusChange(value)}
      >
        <SelectTrigger className="w-full lg:w-auto h-8">
          <div className="flex items-center pr-2">
            <ListCheckIcon className="mr-2 size-4" />
            <SelectValue placeholder="Filter by status" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
          <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
          <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
          <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
          <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={assigneeId ?? undefined}
        onValueChange={(value) => onAssigneeChange(value)}
      >
        <SelectTrigger className="w-full lg:w-auto h-8">
          <div className="flex items-center pr-2">
            <User className="mr-2 size-4" />
            <SelectValue placeholder="All assignees" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          <SelectSeparator />
          {memberOptions?.map((member: { value: string; label: string }) => (
            <SelectItem key={member.value} value={member.value}>
              {member.label || "Unknown User"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!hideProjectFilter && (
        <Select
          defaultValue={projectId ?? undefined}
          onValueChange={(value) => onProjectChange(value)}
        >
          <SelectTrigger className="w-full lg:w-auto h-8">
            <div className="flex items-center pr-2">
              <FolderCheckIcon className="mr-2 size-4" />
              <SelectValue placeholder="All by project" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            <SelectSeparator />
            {projectOptions?.map((project) => (
              <SelectItem key={project.value} value={project.value}>
                {project.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <DatePicker
        placeholder="Select due date"
        className="h-8 w-full lg:w-auto"
        value={dueDate ? new Date(dueDate) : undefined}
        onChange={(date) => {
          setFilters({
            dueDate: date ? date.toISOString() : null,
          });
        }}
      />
    </div>
  );
};
