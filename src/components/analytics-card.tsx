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
  const iconColor = variant === "up" ? "text-emerald-500" : "text-red-500";
  const increaseValueColor =
    variant === "up" ? "text-green-500" : "text-red-500";
  const Icon = variant === "up" ? FaCaretUp : FaCaretDown;

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="perspective-1000"
    >
      <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 border-none w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl transform hover:translate-z-2">
        <CardHeader className="p-6">
          <div className="flex items-center justify-between gap-x-2.5">
            <CardDescription className="flex items-center gap-x-2 font-medium">
              <span className="truncate text-base text-gray-700 dark:text-gray-300">
                {title}
              </span>
            </CardDescription>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-x-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full shadow-md"
            >
              <Icon className={cn(iconColor, "size-5")} />
              <span className={cn(increaseValueColor, "text-sm font-semibold")}>
                {increaseValue}%
              </span>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CardTitle className="text-4xl font-extrabold mt-4 text-gray-800 dark:text-gray-100">
              {value.toLocaleString()}
            </CardTitle>
          </motion.div>
        </CardHeader>
      </Card>
    </motion.div>
  );
};
