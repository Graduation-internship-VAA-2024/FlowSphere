import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";

interface TaskDateProps {
  value: string;
  className?: string;
}

export const TaskDate = ({ value, className }: TaskDateProps) => {
  const today = new Date();
  const endDate = new Date(value);
  const diffInDays = differenceInDays(endDate, today);

  let textColor = "text-muted-foreground";
  if (diffInDays <= 3) {
    textColor = "text-red-600";
  } else if (diffInDays <= 7) {
    textColor = "text-amber-600";
  } else if (diffInDays <= 14) {
    textColor = "text-yellow-600";
  } else if (diffInDays <= 21) {
    textColor = "text-lime-600";
  } else if (diffInDays <= 28) {
    textColor = "text-green-600";
  }

  return (
    <div className={textColor}>
      <span className={cn("truncate", className)}>{format(value, "PP")}</span>
    </div>
  );
};
