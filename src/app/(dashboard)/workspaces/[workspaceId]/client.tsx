"use client";

import React, { useState, useEffect } from "react";

import PageError from "@/components/page-error";
import PageLoader from "@/components/page-loader";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useCreateTaskModal } from "@/features/tasks/hooks/use-create-task-modal";
import { useGetWorkspaceAnalytic } from "@/features/workspaces/api/use-get-workspace-analyst";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCurrent } from "@/features/auth/api/use-current";
import { Analytics } from "@/components/analytics";
import { BoxReveal } from "@/components/magicui/box-reveal";
import { Task } from "@/features/tasks/types";
import { Button } from "@/components/ui/button";
import {
  CalendarDaysIcon,
  PlusIcon,
  ClipboardIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  FolderIcon,
  UsersIcon,
  UserPlusIcon,
} from "lucide-react";
import { DottedSeparator } from "@/components/dotted-separator";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { formatDistanceToNow } from "date-fns";
import { Project } from "@/features/projects/type";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { Member } from "@/features/members/types";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { TaskPieChart } from "@/components/charts/pie-chart";
import { TaskBarChart } from "@/components/charts/bar-chart";
import { TaskRadarChart } from "@/components/charts/radar-chart";
import { InviteMemberModal } from "@/features/members/components/invite-member-modal";

export const WorkspaceIdClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: analytics, isLoading: isLoadingAnalytics } =
    useGetWorkspaceAnalytic({ workspaceId });
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({
    workspaceId,
  });
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });

  const { data: currentUser, isLoading: isLoadingUser } = useCurrent();

  const isLoading =
    isLoadingAnalytics ||
    isLoadingTasks ||
    isLoadingProjects ||
    isLoadingMembers ||
    isLoadingUser;

  const [key, setKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setKey((prev) => prev + 1);
    }, 9000); // Reset every 9 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }
  if (!analytics || !tasks || !projects || !members || !currentUser) {
    return <PageError message="Failed to load data" />;
  }

  return (
    <div className="w-full h-full p-6 space-y-6">
      <div className="flex flex-col items-center justify-center space-y-4 mb-8">
        <BoxReveal key={`welcome-${key}`} boxColor="#5046e6" duration={0.5}>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Welcome back,{" "}
            <span className="text-blue-600">{currentUser.name || "User"}</span>!
          </h1>
        </BoxReveal>

        <BoxReveal key={`overview-${key}`} boxColor="#4f46e5" duration={0.7}>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Here's your workspace overview
          </p>
        </BoxReveal>

        <BoxReveal key={`actions-${key}`} boxColor="#6366f1" duration={0.9}>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Create Project</span>
            <span>•</span>
            <span>Create Task</span>
            <span>•</span>
            <span>View Analytics</span>
          </div>
        </BoxReveal>
      </div>

      <div className="w-full max-w-7xl mx-auto">
        <Analytics data={analytics} />
      </div>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TaskPieChart data={analytics} />
        <TaskBarChart data={analytics} />
        <TaskRadarChart data={analytics} />
      </div>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="md:col-span-2 xl:col-span-2">
          <TaskCalendar />
        </div>
        <div className="md:col-span-2 xl:col-span-2">
          <TaskList data={tasks.documents} total={tasks.total} />
        </div>
        <div className="md:col-span-1 xl:col-span-2">
          <ProjectList data={projects.documents} total={projects.total} />
        </div>
        <div className="md:col-span-1 xl:col-span-2">
          <MemberList data={members.documents} total={members.total} />
        </div>
      </div>
    </div>
  );
};

interface TaskListProps {
  data: Task[];
  total: number;
}

export const TaskList = ({ data, total }: TaskListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createTask } = useCreateTaskModal();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[500px] flex flex-col"
    >
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 flex-1 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 dark:bg-blue-500/20 p-2 rounded-lg">
              <ClipboardIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Tasks</h3>
              <p className="text-sm text-muted-foreground">({total} total)</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={createTask}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        <DottedSeparator className="mb-6" />

        {data.length === 0 ? (
          <EmptyState
            icon={<ClipboardIcon className="h-12 w-12" />}
            title="No tasks yet"
            description="Get started by creating your first task"
            action={
              <Button onClick={createTask} className="mt-4">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            }
          />
        ) : (
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4">
              {data.map((task) => (
                <motion.div
                  key={task.$id}
                  whileHover={{ scale: 1.01 }}
                  className="transform transition-all duration-200"
                >
                  <Link href={`/workspaces/${workspaceId}/tasks/${task.$id}`}>
                    <Card className="bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className="text-base font-medium line-clamp-1">
                              {task.name}
                            </p>
                            <div className="flex items-center gap-x-3 text-sm">
                              {task.project?.name && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                >
                                  {task.project.name}
                                </Badge>
                              )}
                              <div className="flex items-center text-muted-foreground">
                                <CalendarDaysIcon className="h-4 w-4 mr-1" />
                                <span>
                                  {formatDistanceToNow(new Date(task.dueDate))}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full hover:bg-gray-50 dark:hover:bg-gray-800"
            asChild
          >
            <Link href={`/workspaces/${workspaceId}/tasks`}>
              View All Tasks
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

interface ProjectListProps {
  data: Project[];
  total: number;
}

export const ProjectList = ({ data, total }: ProjectListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createProject } = useCreateProjectModal();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[500px] flex flex-col"
    >
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 flex-1 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 dark:bg-purple-500/20 p-2 rounded-lg">
              <FolderIcon className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Projects</h3>
              <p className="text-sm text-muted-foreground">({total} total)</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={createProject}
            className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        <DottedSeparator className="mb-6" />

        {data.length === 0 ? (
          <EmptyState
            icon={<FolderIcon className="h-12 w-12" />}
            title="No projects yet"
            description="Get started by creating your first project"
            action={
              <Button onClick={createProject} className="mt-4">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            }
          />
        ) : (
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.map((project) => (
                <motion.div
                  key={project.$id}
                  whileHover={{ scale: 1.02 }}
                  className="transform transition-all duration-200"
                >
                  <Link
                    href={`/workspaces/${workspaceId}/projects/${project.$id}`}
                  >
                    <Card className="bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <ProjectAvatar
                            name={project.name}
                            image={project.imageUrl}
                            className="size-10"
                            fallbackClassName="text-base"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-base truncate">
                              {project.name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {project.tasks?.length || 0} tasks
                            </p>
                          </div>
                          <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full hover:bg-gray-50 dark:hover:bg-gray-800"
            asChild
          >
            <Link href={`/workspaces/${workspaceId}/projects`}>
              View All Projects
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

interface MemberListProps {
  data: Member[];
  total: number;
}

export const MemberList = ({ data, total }: MemberListProps) => {
  const workspaceId = useWorkspaceId();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[500px] flex flex-col"
    >
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 flex-1 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 dark:bg-green-500/20 p-2 rounded-lg">
              <UsersIcon className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Members</h3>
              <p className="text-sm text-muted-foreground">({total} total)</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>
        </div>

        <DottedSeparator className="mb-6" />

        {data.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-12 w-12" />}
            title="No members yet"
            description="Invite team members to collaborate"
            action={
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                className="mt-4"
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            }
          />
        ) : (
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-4">
              {data.map((member) => (
                <motion.div
                  key={member.$id}
                  whileHover={{ scale: 1.02 }}
                  className="transform transition-all duration-200"
                >
                  <Card className="bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <MemberAvatar name={member.name} className="size-10" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base truncate">
                            {member.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full hover:bg-gray-50 dark:hover:bg-gray-800"
            asChild
          >
            <Link href={`/workspaces/${workspaceId}/members`}>
              Manage Members
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <InviteMemberModal
        workspaceId={workspaceId}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </motion.div>
  );
};

export function TaskCalendar() {
  const workspaceId = useWorkspaceId();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const { data: tasks } = useGetTasks({ workspaceId });

  // Create a map of dates with tasks
  const datesWithTasks = React.useMemo(() => {
    if (!tasks?.documents) return [];

    // Convert tasks to dates
    return tasks.documents.map((task) => {
      const date = new Date(task.dueDate);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    });
  }, [tasks]);

  // DayPicker modifier to add dots under days with tasks
  const modifiers = {
    hasTasks: datesWithTasks,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[500px] flex flex-col"
    >
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 flex-1 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/10 dark:bg-orange-500/20 p-2 rounded-lg">
              <CalendarDaysIcon className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Calendar</h3>
              <p className="text-sm text-muted-foreground">Task schedule</p>
            </div>
          </div>
        </div>

        <DottedSeparator className="mb-6" />

        <div className="flex-1 flex items-center justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="w-full rounded-md border-none bg-white/50 dark:bg-gray-800/50 p-4"
            modifiers={modifiers}
            modifiersClassNames={{
              hasTasks:
                "font-semibold relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-blue-500 after:rounded-full",
            }}
            classNames={{
              months:
                "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
              month: "space-y-4 w-full",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button:
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex w-full",
              head_cell:
                "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 w-full",
              day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 mx-auto",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// EmptyState component
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] p-6 text-center">
      <div className="text-muted-foreground mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  );
};
