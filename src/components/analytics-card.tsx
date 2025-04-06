import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnalyticsCardProps {
  title: string;
  value: number;
  variant: "up" | "down";
  increaseValue: number;
}

export const AnalyticsCard = ({
  title,
  value,
  variant,
  increaseValue,
}: AnalyticsCardProps) => {
  const iconColor = variant === "up" ? "text-green-500" : "text-red-500";
  const increaseValueColor =
    variant === "up" ? "text-green-500" : "text-red-500";
  const Icon = variant === "up" ? FaCaretUp : FaCaretDown;

  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        rotateX: 4,
      }}
      transition={{ type: "spring", stiffness: 300 }}
      className="perspective-1000"
    >
      <Card className="relative overflow-hidden border bg-white dark:bg-gray-100 shadow-md">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm text-gray-700 dark:text-gray-800 font-medium">
              {title}
            </CardDescription>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full",
                "bg-gray-100 dark:bg-white/90"
              )}
            >
              <Icon className={cn(iconColor, "size-3")} />
              <span className={cn(increaseValueColor, "text-xs font-bold")}>
                {increaseValue}%
              </span>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CardTitle className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
              {value.toLocaleString()}
            </CardTitle>
          </motion.div>
        </CardHeader>
      </Card>
    </motion.div>
  );
};
