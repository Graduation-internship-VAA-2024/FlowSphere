"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

interface TooltipContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  content: React.ReactNode;
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
}

const TooltipContext = React.createContext<TooltipContextType | undefined>(
  undefined
);

const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

const TooltipTrigger: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const context = React.useContext(TooltipContext);

  if (!context) {
    return <>{children}</>;
  }

  return (
    <div
      className="inline-block"
      onMouseEnter={() => context.setIsOpen(true)}
      onMouseLeave={() => context.setIsOpen(false)}
      onClick={() => context.setIsOpen(!context.isOpen)}
    >
      {children}
    </div>
  );
};

const TooltipContent: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => {
  const context = React.useContext(TooltipContext);

  if (!context || !context.isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute z-50 px-3 py-1.5 text-sm rounded-md border bg-popover text-popover-foreground shadow-md",
        {
          "-translate-y-full -mt-1": context.side === "top",
          "translate-y-0 mt-1": context.side === "bottom",
          "-translate-x-full -ml-1": context.side === "left",
          "translate-x-0 ml-1": context.side === "right",
        },
        {
          "left-0": context.align === "start",
          "left-1/2 -translate-x-1/2": context.align === "center",
          "right-0": context.align === "end",
        },
        className
      )}
    >
      {children || context.content}
    </div>
  );
};

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  side = "top",
  align = "center",
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <TooltipContext.Provider
      value={{ isOpen, setIsOpen, content, side, align }}
    >
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  );
};

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
