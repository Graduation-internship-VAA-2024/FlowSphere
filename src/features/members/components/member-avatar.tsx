import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MemberAvatarProps {
  name: string;
  className?: string;
  fallbackClassName?: string;
}

export const MemberAvatar = ({
  name,
  className,
  fallbackClassName,
}: MemberAvatarProps) => {
  return (
    <Avatar
      className={cn(
        "relative",
        // Diamond shape base
        "rotate-45 overflow-hidden",
        // Base styles
        "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500",
        "group hover:from-emerald-400 hover:to-cyan-400",
        // Border and shadow effects
        "ring-2 ring-white/50 shadow-lg",
        "hover:ring-emerald-300/50 hover:shadow-emerald-500/25",
        // Smooth transitions
        "transition-all duration-300",
        // Size
        "size-9",
        className
      )}
    >
      <AvatarFallback
        className={cn(
          // Counter-rotate to keep text straight
          "-rotate-45",
          // Text styling
          "font-bold text-base text-white",
          // Center content
          "flex items-center justify-center",
          // Size
          "h-full w-full",
          // Gradient background for text area
          "bg-gradient-to-br from-emerald-600/50 to-cyan-600/50",
          // Transitions
          "transition-colors duration-300",
          // Hover effects
          "group-hover:from-emerald-500/50 group-hover:to-cyan-500/50",
          fallbackClassName
        )}
      >
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};
