"use client";
import { motion } from "framer-motion";

export const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] z-50">
      <div className="flex flex-col items-center gap-3">
        {/* Simple spinner */}
        <motion.div
          className="size-8 border-3 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />

        {/* Loading text with dots */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Loading</span>
          {[...Array(3)].map((_, i) => (
            <motion.span
              key={i}
              className="size-1 rounded-full bg-primary"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
