"use client";
import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlusCircle, Columns, Calendar, Columns2 } from "lucide-react";
import { useCreateTaskModal } from "../hooks/use-create-task-modal";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetTasks } from "../api/use-get-tasks";
import { useQueryState } from "nuqs";
import { DataFilters } from "./data-filters";
import { useTaskFilters } from "../hooks/use-task-filters";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { DataKanban } from "./data-kanban";
import { cn } from "@/lib/utils";

export const TaskViewSwitcher = () => {
  const [{ status, assigneeId, projectId, dueDate }] = useTaskFilters();
  const [view, setView] = useQueryState("task-view", {
    defaultValue: "table",
  });
  const workspaceId = useWorkspaceId();
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({
    workspaceId,
    projectId,
    assigneeId,
    status,
    dueDate,
  });

  const { open } = useCreateTaskModal();
  return (
    <Tabs
      defaultValue={view}
      onValueChange={setView}
      className="flex-1 w-full border rounded-lg"
    >
      <div className="h-full flex flex-col overflow-auto p-4">
        <div className="flex flex-col gap-y-2 lg:flex-row justify-between items-center">
          <TabsList className="w-full lg:w-auto bg-neutral-50/50 backdrop-blur-sm p-1 rounded-lg">
            <TabsTrigger
              className={cn(
                "h-9 w-full lg:w-auto gap-x-2 rounded-md transition-all duration-300",
                "data-[state=active]:bg-white data-[state=active]:text-primary",
                "data-[state=active]:shadow-sm hover:bg-white/50"
              )}
              value="table"
            >
              <Columns2 className="size-4" />
              Table
            </TabsTrigger>
            <TabsTrigger
              className={cn(
                "h-9 w-full lg:w-auto gap-x-2 rounded-md transition-all duration-300",
                "data-[state=active]:bg-white data-[state=active]:text-primary",
                "data-[state=active]:shadow-sm hover:bg-white/50"
              )}
              value="kanban"
            >
              <Columns className="size-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger
              className={cn(
                "h-9 w-full lg:w-auto gap-x-2 rounded-md transition-all duration-300",
                "data-[state=active]:bg-white data-[state=active]:text-primary",
                "data-[state=active]:shadow-sm hover:bg-white/50"
              )}
              value="calender"
            >
              <Calendar className="size-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={open}
            size="sm"
            className="w-full lg:w-auto bg-primary/90 hover:bg-primary transition-colors"
          >
            <PlusCircle className="mr-2 size-4" /> New Task
          </Button>
        </div>
        <DottedSeparator className="my-4" />
        <DataFilters />
        <DottedSeparator className="my-4" />
        {isLoadingTasks ? (
          <div className="w-full border rounded-lg h-[200px] flex flex-col items-center justify-center ">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="table" className="mt-0">
              <DataTable columns={columns} data={tasks?.documents ?? []} />
            </TabsContent>
            <TabsContent value="kanban" className="mt-0">
              <DataKanban data={tasks?.documents ?? []} />
            </TabsContent>
            <TabsContent value="calender" className="mt-0">
              {JSON.stringify(tasks)}
            </TabsContent>
          </>
        )}
      </div>
    </Tabs>
  );
};
