import { useState } from "react";
import { Task, TaskStatus } from "../types";

const boards: TaskStatus[] = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];
import { DragDropContext } from "@hello-pangea/dnd";
import { KanbanColumnHeader } from "./kanban-column-header";

type TaskState = {
  [key in TaskStatus]: Task[];
};

interface DataKanbanProps {
  data: Task[];
}

export const DataKanban = ({ data }: DataKanbanProps) => {
  const [tasks, setTasks] = useState<TaskState>(() => {
    const initialState: TaskState = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.DONE]: [],
      [TaskStatus.BACKLOG]: [],
      [TaskStatus.IN_REVIEW]: [],
    };

    data.forEach((task) => {
      initialState[task.status].push(task);
    });

    Object.keys(initialState).forEach((status) => {
      initialState[status as TaskStatus].sort(
        (a, b) => a.position - b.position
      );
    });

    return initialState;
  });

  return (
    <DragDropContext onDragEnd={() => {}}>
      <div className="flex overflow-x-auto">
        {boards.map((board) => {
          return (
            <div
              key={board}
              className="flex-1 mx-2 bg-muted p-1.5 rounded-md min-w-[250px]"
            >
              <KanbanColumnHeader
                board={board}
                taskCount={tasks[board].length}
              />
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
