import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MemberAvatarProps {
  name: string;
  className?: string;
  fallbackClassName?: string;
}

// Định nghĩa các bảng màu khác nhau
const colorPalettes = [
  {
    from: "from-rose-500",
    via: "via-pink-500",
    to: "to-purple-500",
    hover: "hover:from-rose-400 hover:to-purple-400",
    ring: "hover:ring-pink-300/50",
    shadow: "hover:shadow-pink-500/25",
    fallbackFrom: "from-rose-600/50",
    fallbackTo: "to-purple-600/50",
    hoverFrom: "group-hover:from-rose-500/50",
    hoverTo: "group-hover:to-purple-500/50",
  },
  {
    from: "from-blue-500",
    via: "via-cyan-500",
    to: "to-teal-500",
    hover: "hover:from-blue-400 hover:to-teal-400",
    ring: "hover:ring-cyan-300/50",
    shadow: "hover:shadow-cyan-500/25",
    fallbackFrom: "from-blue-600/50",
    fallbackTo: "to-teal-600/50",
    hoverFrom: "group-hover:from-blue-500/50",
    hoverTo: "group-hover:to-teal-500/50",
  },
  {
    from: "from-amber-500",
    via: "via-orange-500",
    to: "to-red-500",
    hover: "hover:from-amber-400 hover:to-red-400",
    ring: "hover:ring-orange-300/50",
    shadow: "hover:shadow-orange-500/25",
    fallbackFrom: "from-amber-600/50",
    fallbackTo: "to-red-600/50",
    hoverFrom: "group-hover:from-amber-500/50",
    hoverTo: "group-hover:to-red-500/50",
  },
  {
    from: "from-emerald-500",
    via: "via-green-500",
    to: "to-lime-500",
    hover: "hover:from-emerald-400 hover:to-lime-400",
    ring: "hover:ring-green-300/50",
    shadow: "hover:shadow-green-500/25",
    fallbackFrom: "from-emerald-600/50",
    fallbackTo: "to-lime-600/50",
    hoverFrom: "group-hover:from-emerald-500/50",
    hoverTo: "group-hover:to-lime-500/50",
  },
  {
    from: "from-violet-500",
    via: "via-purple-500",
    to: "to-indigo-500",
    hover: "hover:from-violet-400 hover:to-indigo-400",
    ring: "hover:ring-purple-300/50",
    shadow: "hover:shadow-purple-500/25",
    fallbackFrom: "from-violet-600/50",
    fallbackTo: "to-indigo-600/50",
    hoverFrom: "group-hover:from-violet-500/50",
    hoverTo: "group-hover:to-indigo-500/50",
  },
];

export const MemberAvatar = ({
  name,
  className,
  fallbackClassName,
}: MemberAvatarProps) => {
  // Chọn màu dựa trên chữ cái đầu tiên
  const firstChar = name.charAt(0).toLowerCase();
  const colorIndex = firstChar.charCodeAt(0) % colorPalettes.length;
  const palette = colorPalettes[colorIndex];

  return (
    <Avatar
      className={cn(
        "relative",
        "rotate-45 overflow-hidden",
        "bg-gradient-to-br",
        palette.from,
        palette.via,
        palette.to,
        "group",
        palette.hover,
        "ring-2 ring-white/50 shadow-lg",
        palette.ring,
        palette.shadow,
        "transition-all duration-300",
        "size-9",
        className
      )}
    >
      <AvatarFallback
        className={cn(
          "-rotate-45",
          "font-bold text-base text-white",
          "flex items-center justify-center",
          "h-full w-full",
          "bg-gradient-to-br",
          palette.fallbackFrom,
          palette.fallbackTo,
          "transition-colors duration-300",
          palette.hoverFrom,
          palette.hoverTo,
          fallbackClassName
        )}
      >
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};
