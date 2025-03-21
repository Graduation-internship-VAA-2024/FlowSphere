"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRef } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { DottedSeparator } from "@/components/dotted-separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateTask } from "../api/use-create-task";
import { createTaskSchema } from "../schemas";
import { DatePicker } from "@/components/date-picker";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectContent } from "@radix-ui/react-select";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { TaskStatus } from "../types";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";

interface CreateTaskFormProps {
  onCancel?: () => void;
  projectOptions: { id: string; name: string; imageUrl: string }[];
  memberOptions: { id: string; name: string }[];
}

export const CreateTaskForm = ({
  onCancel,
  projectOptions,
  memberOptions,
}: CreateTaskFormProps) => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const { mutate, isPending } = useCreateTask();
  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema.omit({ workspaceId: true })),
    defaultValues: { workspaceId },
  });

  const onSubmit = (values: z.infer<typeof createTaskSchema>) => {
    mutate(
      { json: { ...values, workspaceId } },
      {
        onSuccess: () => {
          form.reset();

          onCancel?.();
        },
      }
    );
  };

  return (
    <div className="relative w-full transform perspective-1000">
      {/* 3D Floating Effect Container */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/10 to-blue-500/10 
        rounded-2xl blur-2xl opacity-50 transform -rotate-x-12 scale-95"
      />

      <Card
        className="relative w-full border-none shadow-none overflow-hidden
        bg-white/80 backdrop-blur-xl rounded-2xl
        transform transition-all duration-500 hover:-rotate-x-2 hover:translate-y-[-2px]"
      >
        {/* Animated Gradient Border */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-500/20 
          to-primary/20 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity"
        />

        <CardHeader className="relative p-7 pb-0">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle
                className="text-2xl font-bold bg-gradient-to-r from-primary 
                to-blue-600 bg-clip-text text-transparent"
              >
                Create a Task{" "}
              </CardTitle>
              <p className="text-sm text-neutral-500">
                Create a task and assign it to a member
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-primary/50 animate-pulse" />
          </div>
        </CardHeader>

        <div className="px-7 py-4">
          <DottedSeparator className="opacity-50" />
        </div>

        <CardContent className="p-7">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Workspace Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-neutral-800 font-medium">
                      Task Name
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div
                          className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 
                          to-blue-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 
                          transition duration-300"
                        />
                        <Input
                          {...field}
                          placeholder="Enter task name"
                          className="relative bg-white/80 border-white/20 h-11
                            focus:ring-2 focus:ring-primary/20 focus:border-primary/30
                            hover:border-primary/30 transition duration-300"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Task Date Field */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-neutral-800 font-medium">
                      Due Date
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div
                          className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 
                          to-blue-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 
                          transition duration-300"
                        />
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          className="relative bg-white/80 border-white/20"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Assignee Field */}
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-neutral-800 font-medium">
                      Assignee
                    </FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <div className="relative group">
                          <div
                            className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 
                          to-blue-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 
                          transition duration-300"
                          />
                          <SelectTrigger>
                            <SelectValue placeholder="Select Assignee"></SelectValue>
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <SelectContent>
                        {memberOptions.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-x-2">
                              <MemberAvatar
                                name={member.name}
                                className="size-6"
                              />
                              <span>{member.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Status Field */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-neutral-800 font-medium">
                      Status
                    </FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <div className="relative group">
                          <div
                            className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 
                          to-blue-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 
                          transition duration-300"
                          />
                          <SelectTrigger>
                            <SelectValue placeholder="Select status"></SelectValue>
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <SelectContent>
                        <SelectItem value={TaskStatus.BACKLOG}>
                          Backlog
                        </SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>
                          In Progress
                        </SelectItem>
                        <SelectItem value={TaskStatus.IN_REVIEW}>
                          In Review
                        </SelectItem>
                        <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                        <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Project Field */}
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-neutral-800 font-medium">
                      Project
                    </FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <div className="relative group">
                          <div
                            className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 
                          to-blue-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 
                          transition duration-300"
                          />
                          <SelectTrigger>
                            <SelectValue placeholder="Select Project"></SelectValue>
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <SelectContent>
                        {projectOptions.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-x-2">
                              <ProjectAvatar
                                name={project.name}
                                className="size-6"
                                image={project.imageUrl}
                              />
                              <span>{project.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <DottedSeparator className="py-7 opacity-50" />

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  onClick={onCancel}
                  variant="secondary"
                  size="lg"
                  disabled={isPending}
                  className={cn(
                    "hover:bg-neutral-100/80 transition duration-300",
                    !onCancel && "invisible"
                  )}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending}
                  className={cn(
                    "relative w-full md:w-auto min-w-[160px] overflow-hidden",
                    "bg-gradient-to-r from-primary to-blue-600",
                    "text-white font-medium",
                    "shadow-lg shadow-primary/20",
                    "transition-all duration-300",
                    "hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
                    "active:shadow-md active:translate-y-0",
                    "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none",
                    // Add focus states for better accessibility
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
                    // Add touch states for mobile
                    "touch-none select-none"
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isPending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      "Create Workspace"
                    )}
                  </span>
                  {/* Interactive background effect */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 
                      translate-x-[-100%] animate-shimmer"
                  />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
