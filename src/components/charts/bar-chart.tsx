"use client";

import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import { ProjectAnalyticsResponseType } from "@/features/projects/api/use-get-project-analyst";
import {
  Card,
  CardContent,
  CardDescription,
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

export function TaskBarChart({
  data,
}: Readonly<{
  data: ProjectAnalyticsResponseType["data"];
}>) {
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
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Distribution</CardTitle>
        <CardDescription>All task statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              left: 100,
              right: 20,
              top: 20,
              bottom: 20,
            }}
          >
            <YAxis
              dataKey="status"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label
              }
            />
            <XAxis type="number" hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) =>
                    chartConfig[label as keyof typeof chartConfig]?.label
                  }
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return [
                      `${value} (${item.difference > 0 ? "+" : ""}${
                        item.difference
                      }%)`,
                      `${
                        chartConfig[item.status as keyof typeof chartConfig]
                          ?.label
                      } Tasks`,
                    ];
                  }}
                />
              }
            />
            <Bar dataKey="tasks" radius={[4, 4, 4, 4]} fill="currentColor">
              {chartData.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={entry.fill}
                  className="transition-colors duration-200 hover:opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
