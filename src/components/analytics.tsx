import { ProjectAnalyticsResponseType } from "@/features/projects/api/use-get-project-analyst";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { AnalyticsCard } from "./analytics-card";
import { DottedSeparator } from "./dotted-separator";
import { motion } from "framer-motion";

export const Analytics = ({ data }: ProjectAnalyticsResponseType) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full p-6 bg-white dark:bg-gray-200 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Project Analytics Overview
      </h2>
      <ScrollArea className="border rounded-md w-full whitespace-nowrap shrink-0 bg-neutral-200 dark:bg-gray-900/50 backdrop-blur-sm">
        <motion.div
          className="w-full flex flex-row p-2 gap-x-2"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div className="flex items-center flex-1" variants={item}>
            <AnalyticsCard
              title="Total Tasks"
              value={data.taskCount}
              variant={data.taskDifference > 0 ? "up" : "down"}
              increaseValue={data.taskDifference}
            />
          </motion.div>
          <DottedSeparator className="mx-2" direction="vertical" />
          <motion.div className="flex items-center flex-1" variants={item}>
            <AnalyticsCard
              title="Assigned Tasks"
              value={data.assignedTaskCount}
              variant={data.assignedTaskDifference > 0 ? "up" : "down"}
              increaseValue={data.assignedTaskDifference}
            />
          </motion.div>
          <DottedSeparator className="mx-2" direction="vertical" />
          <motion.div className="flex items-center flex-1" variants={item}>
            <AnalyticsCard
              title="Completed Tasks"
              value={data.completedTaskCount}
              variant={data.completedTaskDifference > 0 ? "up" : "down"}
              increaseValue={data.completedTaskDifference}
            />
          </motion.div>
          <DottedSeparator className="mx-2" direction="vertical" />
          <motion.div className="flex items-center flex-1" variants={item}>
            <AnalyticsCard
              title="Overdue Tasks"
              value={data.overdueTaskCount}
              variant={data.overdueTaskDifference > 0 ? "up" : "down"}
              increaseValue={data.overdueTaskDifference}
            />
          </motion.div>
          <DottedSeparator className="mx-2" direction="vertical" />
          <motion.div className="flex items-center flex-1" variants={item}>
            <AnalyticsCard
              title="Incomplete Tasks"
              value={data.incompleteTaskCount}
              variant={data.incompleteTaskDifference > 0 ? "up" : "down"}
              increaseValue={data.incompleteTaskDifference}
            />
          </motion.div>
        </motion.div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
