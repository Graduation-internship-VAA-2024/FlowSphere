import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ProjectAvatarProps {
  image?: string;
  name: string;
  className?: string;
  fallbackClassName?: string;
}

export const ProjectAvatar = ({
  image,
  name,
  className,
  fallbackClassName,
}: ProjectAvatarProps) => {
  if (image) {
    return (
      <div
        className={cn(
          "relative overflow-hidden",
          "rounded-2xl transform-gpu transition-all duration-300",
          "ring-1 ring-black/[0.05] group-hover:ring-primary/25",
          "bg-gradient-to-br from-white to-neutral-50",
          "shadow-[0_2px_8px_-1px_rgba(0,0,0,0.08)] group-hover:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.12)]",
          "after:absolute after:inset-0 after:z-10",
          "after:bg-gradient-to-br after:from-white/30 after:to-white/0",
          "after:opacity-0 group-hover:after:opacity-100",
          "after:transition-opacity after:duration-200",
          "size-8", // Smaller size
          className
        )}
      >
        <Image
          src={image}
          alt={name}
          fill
          className={cn(
            "object-cover transition-transform duration-200",
            "group-hover:scale-110"
          )}
        />
      </div>
    );
  }

  return (
    <Avatar
      className={cn(
        "relative overflow-hidden",
        "rounded-2xl transform-gpu transition-all duration-200",
        "ring-1 ring-black/[0.05] group-hover:ring-primary/25",
        "shadow-[0_2px_8px_-1px_rgba(0,0,0,0.08)] group-hover:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.12)]",
        "after:absolute after:inset-0",
        "after:bg-gradient-to-br after:from-white/20 after:to-transparent",
        "after:opacity-0 group-hover:after:opacity-100",
        "after:transition-opacity after:duration-200",
        "size-8", // Smaller size
        className
      )}
    >
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br from-primary/90 via-primary/80 to-primary/70",
          "text-white font-semibold uppercase text-sm",
          "transform-gpu transition-all duration-200",
          "group-hover:from-primary/80 group-hover:to-primary/60",
          "group-hover:scale-110",
          "rounded-2xl",
          fallbackClassName
        )}
      >
        {name[0]}
      </AvatarFallback>
    </Avatar>
  );
};
