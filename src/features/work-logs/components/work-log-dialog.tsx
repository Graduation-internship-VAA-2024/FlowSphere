import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ClockIcon, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { logWorkSchema, updateEstimateSchema } from "../schemas";
import { useCreateWorkLog } from "../api/use-create-work-log";
import { useGetWorkLogs } from "../api/use-get-work-logs";
import { useDeleteWorkLog } from "../api/use-delete-work-log";
import { useUpdateTaskEstimate } from "../api/use-update-task-estimate";
import { useCurrent } from "@/features/auth/api/use-current";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { Task } from "@/features/tasks/types";

interface WorkLogDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
}

interface UpdateEstimateFormData {
  remainingEstimate: string;
}

export function WorkLogDialog({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
}: WorkLogDialogProps) {
  const [taskData, setTaskData] = useState({
    $id: task.$id,
    name: task.name,
    originalEstimate: task.originalEstimate || "",
    remainingEstimate: task.remainingEstimate || "",
  });

  // Get current user
  const { data: currentUser } = useCurrent();

  // Effect to update task data from props
  useEffect(() => {
    setTaskData({
      $id: task.$id,
      name: task.name,
      originalEstimate: task.originalEstimate || "",
      remainingEstimate: task.remainingEstimate || "",
    });
  }, [task.$id, task.name, task.originalEstimate, task.remainingEstimate]);

  // Fetch work logs
  const {
    data: workLogsData,
    isLoading,
    error,
    refetch,
  } = useGetWorkLogs({
    taskId: task.$id,
    enabled: open,
  });

  useEffect(() => {
    if (workLogsData) {
      console.log("Work logs fetched successfully:", workLogsData);
      if (workLogsData.documents && workLogsData.documents.length > 0) {
        console.log("First work log:", workLogsData.documents[0]);
      }
    }
  }, [workLogsData]);

  // Log work form
  const logForm = useForm({
    resolver: zodResolver(logWorkSchema.omit({ taskId: true })),
    defaultValues: {
      timeSpent: "",
      remainingEstimate: taskData.remainingEstimate,
      dateStarted: format(new Date(), "yyyy-MM-dd"),
      description: "",
    },
  });

  // Reset form when task changes
  useEffect(() => {
    logForm.reset({
      timeSpent: "",
      remainingEstimate: taskData.remainingEstimate,
      dateStarted: format(new Date(), "yyyy-MM-dd"),
      description: "",
    });
  }, [taskData, logForm]);

  // Create work log mutation
  const { mutate: createWorkLog, isPending: isCreating } = useCreateWorkLog();

  // Delete work log mutation
  const { mutate: deleteWorkLog, isPending: isDeleting } = useDeleteWorkLog();

  // Update estimate mutation - define at top level
  const { mutate: updateEstimate, isPending: isUpdating } =
    useUpdateTaskEstimate();

  // Calculate total time logged
  const formatLoggedTime = () => {
    if (!workLogsData?.documents || workLogsData.documents.length === 0) {
      return "0h";
    }

    // Sum up all time spent seconds
    const totalSeconds = workLogsData.documents.reduce(
      (acc, log) => acc + (log.timeSpentSeconds || 0),
      0
    );

    // Convert to hours and minutes
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  const onSubmitLogWork = (data: any) => {
    console.log("Submitting work log:", { ...data, taskId: taskData.$id });
    createWorkLog(
      {
        ...data,
        taskId: taskData.$id,
      },
      {
        onSuccess: () => {
          toast.success("Work logged successfully");
          logForm.reset({
            timeSpent: "",
            remainingEstimate: taskData.remainingEstimate,
            dateStarted: format(new Date(), "yyyy-MM-dd"),
            description: "",
          });
          refetch();
          onTaskUpdated?.();
        },
        onError: (error) => {
          console.error("Failed to log work:", error);
          toast.error(
            error instanceof Error ? error.message : "An unknown error occurred"
          );
        },
      }
    );
  };

  const handleDeleteLog = (workLogId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this work log?"
    );
    if (confirmDelete) {
      deleteWorkLog(
        { workLogId, taskId: taskData.$id },
        {
          onSuccess: () => {
            toast.success("Work log deleted successfully");
            refetch();
            onTaskUpdated?.();
          },
          onError: (error) => {
            console.error("Failed to delete work log:", error);
            toast.error(
              error instanceof Error
                ? error.message
                : "An unknown error occurred"
            );
          },
        }
      );
    }
  };

  const [activeTab, setActiveTab] = useState("log-work");

  // UpdateEstimateForm component
  const UpdateEstimateForm = () => {
    const updateEstimateForm = useForm<UpdateEstimateFormData>({
      resolver: zodResolver(updateEstimateSchema.omit({ taskId: true })),
      defaultValues: {
        remainingEstimate: "",
      },
    });

    const onSubmit = (data: UpdateEstimateFormData) => {
      console.log("Submitting task estimate update:", data);
      updateEstimate(
        {
          taskId: taskData.$id,
          remainingEstimate: data.remainingEstimate,
        },
        {
          onSuccess: () => {
            toast.success("Estimate updated successfully");
            updateEstimateForm.reset();
            if (workLogsData) {
              refetch();
            }
          },
          onError: (error) => {
            console.error("Failed to update task estimate:", error);
            toast.error(
              error instanceof Error
                ? error.message
                : "An unknown error occurred"
            );
          },
        }
      );
    };

    return (
      <Form {...updateEstimateForm}>
        <form
          onSubmit={updateEstimateForm.handleSubmit(onSubmit)}
          className="grid gap-4"
        >
          <FormField
            control={updateEstimateForm.control}
            name="remainingEstimate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remaining Estimate</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 2h 30m" {...field} />
                </FormControl>
                <FormDescription>
                  Format: 2h 30m (hours and minutes)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Estimate
          </Button>
        </form>
      </Form>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Time tracking</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="log-work">Log Work</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="log-work" className="space-y-4 py-4">
            <div className="flex items-center gap-4 mb-6">
              <ClockIcon className="text-muted-foreground h-8 w-8" />
              <div className="flex-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatLoggedTime()} logged</span>
                  <span>{taskData.remainingEstimate} remaining</span>
                </div>
              </div>
            </div>

            <Form {...logForm}>
              <form
                onSubmit={logForm.handleSubmit(onSubmitLogWork)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={logForm.control}
                    name="timeSpent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Log time</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. 2h 30m"
                            disabled={isCreating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={logForm.control}
                    name="remainingEstimate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time remaining</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. 6h"
                            disabled={isCreating || isUpdating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={logForm.control}
                  name="dateStarted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date started <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="date" disabled={isCreating} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={logForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the work done..."
                          className="min-h-[100px]"
                          disabled={isCreating}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="ml-auto"
                  >
                    {isCreating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Log Work
                  </Button>
                </div>
              </form>
            </Form>

            <Separator className="my-4" />
            <h3 className="text-lg font-medium mb-2">Update Estimate Only</h3>
            <UpdateEstimateForm />
          </TabsContent>

          <TabsContent value="history" className="py-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center text-destructive p-4">
                Error loading work logs
              </div>
            ) : !workLogsData?.documents ||
              workLogsData.documents.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                No work logs found for this task
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {workLogsData.documents.map((log: any) => (
                  <div
                    key={log.$id}
                    className="bg-muted/50 p-4 rounded-lg relative group"
                  >
                    <div className="flex items-start gap-3">
                      <MemberAvatar
                        name={log.userInfo?.name || "Unknown User"}
                        className="h-6 w-6"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium leading-none">
                              {log.userInfo?.name || "Unknown User"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(log.dateStarted), "MMM d, yyyy")}{" "}
                              • Logged {log.timeSpent ? log.timeSpent : "time"}
                            </p>
                          </div>
                          {currentUser && log.userId === currentUser.$id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteLog(log.$id)}
                              disabled={isDeleting}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4 text-destructive"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </Button>
                          )}
                        </div>
                        {log.description && (
                          <div className="mt-2 text-sm">{log.description}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
