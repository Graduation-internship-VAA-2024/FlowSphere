"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import { TrendingUp } from "lucide-react";
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
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  overdue: {
    label: "Overdue",
    color: "hsl(var(--chart-2))",
  },
  incomplete: {
    label: "Incomplete",
    color: "hsl(var(--chart-3))",
  },
  assigned: {
    label: "Assigned",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function TaskPieChart({
  data,
}: Readonly<{
  data: ProjectAnalyticsResponseType["data"];
}>) {
  const chartData = [
    {
      status: "completed",
      value: data.completedTaskCount,
      fill: "var(--color-completed)",
    },
    {
      status: "overdue",
      value: data.overdueTaskCount,
      fill: "var(--color-overdue)",
    },
    {
      status: "incomplete",
      value: data.incompleteTaskCount,
      fill: "var(--color-incomplete)",
    },
    {
      status: "assigned",
      value: data.assignedTaskCount,
      fill: "var(--color-assigned)",
    },
  ];

  const totalTasks = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Task Distribution</CardTitle>
        <CardDescription>Overview by status</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalTasks.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Tasks
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {((data.completedTaskCount / totalTasks) * 100).toFixed(1)}%
          completion rate
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Total tasks tracked this month
        </div>
      </CardFooter>
    </Card>
  );
}
