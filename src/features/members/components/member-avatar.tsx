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
        "relative overflow-hidden",
        "rounded-xl transform-gpu transition-all duration-300",
        "ring-2 ring-black/[0.02] group-hover:ring-primary/20",
        "shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)] group-hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.18)]",
        "after:absolute after:inset-0",
        "after:bg-gradient-to-br after:from-white/20 after:to-transparent",
        "after:opacity-0 group-hover:after:opacity-100",
        "after:transition-opacity after:duration-300",
        className
      )}
    >
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br from-primary via-primary/90 to-primary/80",
          "text-white font-bold uppercase text-lg",
          "transform-gpu transition-all duration-300",
          "group-hover:from-primary/90 group-hover:to-primary/70",
          "group-hover:scale-105",
          "rounded-xl",
          fallbackClassName
        )}
      >
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};
