
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const TooltipTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ 
  children, 
  asChild = false 
}) => {
  return <>{children}</>;
};

const TooltipContent: React.FC<{
  className?: string;
  children: React.ReactNode;
  sideOffset?: number;
}> = ({ className, children, sideOffset = 4 }) => {
  return (
    <div
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
};

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  side = "top", 
  align = "center" 
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
      </div>
      {isOpen && (
        <div
          ref={contentRef}
          className={cn(
            "absolute z-50 px-3 py-1.5 text-sm rounded-md border bg-popover text-popover-foreground shadow-md",
            {
              "-translate-y-full -mt-1": side === "top",
              "translate-y-0 mt-1": side === "bottom",
              "-translate-x-full -ml-1": side === "left",
              "translate-x-0 ml-1": side === "right",
            },
            {
              "left-0": align === "start",
              "left-1/2 -translate-x-1/2": align === "center",
              "right-0": align === "end",
            }
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }; 
