"use client";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface PageErrorProps {
  message?: string;
}

const PageError = ({
  message = "We apologize for the inconvenience. Please try again or return to the home page.",
}: PageErrorProps) => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/50 relative overflow-hidden">
      {" "}
      {/* Animated background elements */}{" "}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {" "}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />{" "}
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />{" "}
      </motion.div>
      <motion.div
        className="flex flex-col items-center gap-y-6 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <AlertTriangle
            className="h-12 w-12 text-destructive"
            strokeWidth={1.5}
          />
        </motion.div>

        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-destructive to-destructive/60 text-transparent bg-clip-text">
            Oops! Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="secondary"
            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <Link href="/" className="flex items-center gap-2">
              <span>Return Home</span>
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PageError;
