"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const useConfirm = (
  title: string,
  message: string,
  variant: ButtonProps["variant"] = "primary"
): [() => JSX.Element, () => Promise<unknown>] => {
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = () => {
    return new Promise((resolve) => {
      setPromise({ resolve });
    });
  };

  const handleClose = () => {
    setPromise(null);
  };

  const handleConfirm = () => {
    promise?.resolve(true);
    handleClose();
  };

  const handleCancel = () => {
    promise?.resolve(false);
    handleClose();
  };

  const ConfirmationDialog = () => (
    <ResponsiveModal open={promise !== null} onOpenChange={handleClose}>
      <Card className="relative w-full max-w-lg mx-auto overflow-hidden border-none">
        {/* Animated Background Gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-neutral-50/50 to-white/80 
          backdrop-blur-xl animate-gradient"
        />

        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute right-4 top-4 p-2 rounded-full text-neutral-400
            hover:bg-neutral-100/80 hover:text-neutral-600
            focus:outline-none focus:ring-2 focus:ring-neutral-200
            transition-all duration-200"
        ></button>

        <CardContent className="relative p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            {/* Warning Icon with Glow Effect */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                <div
                  className={cn(
                    "relative h-12 w-12 rounded-full",
                    "bg-gradient-to-br from-red-50 to-red-100",
                    "flex items-center justify-center",
                    "ring-4 ring-red-100/50",
                    "transform transition-transform duration-300",
                    "group-hover:scale-110"
                  )}
                >
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>

            {/* Title & Description */}
            <CardHeader className="p-0 space-y-2">
              <CardTitle className="text-xl font-semibold text-neutral-800">
                {title}
              </CardTitle>
              <CardDescription className="text-base text-neutral-600">
                {message}
              </CardDescription>
            </CardHeader>

            {/* Action Buttons */}
            <div className="w-full mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:gap-3 justify-end">
              <Button
                onClick={handleCancel}
                variant="outline"
                className={cn(
                  "w-full sm:w-auto",
                  "border-neutral-200 hover:border-neutral-300",
                  "bg-white hover:bg-neutral-50",
                  "text-neutral-600 hover:text-neutral-700",
                  "transition-all duration-200"
                )}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                variant={variant}
                className={cn(
                  "w-full sm:w-auto min-w-[100px]",
                  variant === "destructive" && [
                    "bg-gradient-to-r from-red-500 to-red-600",
                    "hover:from-red-600 hover:to-red-700",
                    "text-white font-medium",
                    "shadow-lg shadow-red-500/20",
                    "hover:shadow-xl hover:shadow-red-500/30",
                    "transition-all duration-300",
                  ]
                )}
              >
                Confirm
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </ResponsiveModal>
  );

  return [ConfirmationDialog, confirm];
};
