"use client";

import { TrendingUp } from "lucide-react";
import { LabelList, RadialBar, RadialBarChart } from "recharts";
import { ProjectAnalyticsResponseType } from "@/features/projects/api/use-get-project-analyst";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  tasks: {
    label: "Tasks",
  },
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
  assigned: {
    label: "Assigned",
    color: "hsl(var(--chart-2))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-3))",
  },
  overdue: {
    label: "Overdue",
    color: "hsl(var(--chart-4))",
  },
  incomplete: {
    label: "Incomplete",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function TaskRadarChart({
  data,
}: {
  readonly data: ProjectAnalyticsResponseType["data"];
}) {
  const chartData = [
    {
      status: "total",
      tasks: data.taskCount,
      fill: "var(--color-total)",
      difference: data.taskDifference,
    },
    {
      status: "assigned",
      tasks: data.assignedTaskCount,
      fill: "var(--color-assigned)",
      difference: data.assignedTaskDifference,
    },
    {
      status: "completed",
      tasks: data.completedTaskCount,
      fill: "var(--color-completed)",
      difference: data.completedTaskDifference,
    },
    {
      status: "overdue",
      tasks: data.overdueTaskCount,
      fill: "var(--color-overdue)",
      difference: data.overdueTaskDifference,
    },
    {
      status: "incomplete",
      tasks: data.incompleteTaskCount,
      fill: "var(--color-incomplete)",
      difference: data.incompleteTaskDifference,
    },
  ].sort((a, b) => b.tasks - a.tasks); // Sort by value for better visualization

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Task Distribution</CardTitle>
        <CardDescription>All metrics compared</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={-90}
            endAngle={380}
            innerRadius={30}
            outerRadius={110}
          >
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey="status"
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return [
                      `${value} (${item.difference > 0 ? "+" : ""}${
                        item.difference
                      }%)`,
                      null,
                    ];
                  }}
                />
              }
            />
            <RadialBar dataKey="tasks" background className="fill-primary/20">
              <LabelList
                position="insideStart"
                dataKey="status"
                className="fill-white capitalize mix-blend-luminosity"
                fontSize={11}
              />
            </RadialBar>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Overall tasks {data.taskDifference > 0 ? "up" : "down"} by{" "}
          {Math.abs(data.taskDifference)}% <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Comparing current vs previous period
        </div>
      </CardFooter>
    </Card>
  );
}
