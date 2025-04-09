import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextareaWithCounterProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  maxLength?: number;
  maxRows?: number;
  showCounter?: boolean;
}

export function TextareaWithCounter({
  value,
  onChange,
  maxLength = 500,
  maxRows,
  showCounter = true,
  className,
  ...props
}: TextareaWithCounterProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  useEffect(() => {
    if (textAreaRef.current && maxRows) {
      // Reset height to auto to get the correct scrollHeight
      textAreaRef.current.style.height = "auto";

      // Calculate the line height in pixels (approximately)
      const lineHeight =
        parseInt(getComputedStyle(textAreaRef.current).lineHeight) || 20;

      // Calculate max height based on max rows
      const maxHeight = lineHeight * maxRows;

      // Set the height based on scrollHeight, but not exceeding maxHeight
      const newHeight = Math.min(textAreaRef.current.scrollHeight, maxHeight);
      textAreaRef.current.style.height = `${newHeight}px`;
    }
  }, [value, maxRows]);

  return (
    <div className="relative">
      <Textarea
        ref={textAreaRef}
        value={value}
        onChange={(e) => {
          const newValue = e.target.value;
          if (maxLength && newValue.length > maxLength) {
            return;
          }
          onChange(e);
          setCharCount(newValue.length);
        }}
        className={cn("pr-12", className)}
        {...props}
      />
      {showCounter && (
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {charCount}/{maxLength}
        </div>
      )}
    </div>
  );
}
