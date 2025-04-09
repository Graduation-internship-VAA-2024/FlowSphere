import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIOverlayButtonProps {
  onClick: () => void;
  className?: string;
}

export function AIOverlayButton({ onClick, className }: AIOverlayButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      className={cn(
        "absolute top-2 right-2 z-20 flex items-center justify-center",
        "p-2 rounded-full bg-primary bg-opacity-95 text-white shadow-lg",
        "transform transition-all duration-200",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0.9, scale: 0.9 }}
      animate={{
        opacity: isHovered ? 1 : 0.9,
        scale: isHovered ? 1 : 0.95,
      }}
    >
      <Sparkles className="h-4 w-4" />
      <AnimatePresence>
        {isHovered && (
          <motion.span
            className="ml-1 text-xs font-medium whitespace-nowrap overflow-hidden"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            Analyze with AI
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
