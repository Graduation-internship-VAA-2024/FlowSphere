import { cn } from "@/lib/utils";
import { SettingsIcon, User2Icon } from "lucide-react";
import Link from "next/link";
import {
  GoCheckCircle,
  GoCheckCircleFill,
  GoHome,
  GoHomeFill,
} from "react-icons/go";
const routes = [
  {
    label: "Home",
    href: "",
    icon: GoHome,
    activeIcon: GoHomeFill,
  },
  {
    label: "My Tasks",
    href: "/tasks",
    icon: GoCheckCircle,
    activeIcon: GoCheckCircleFill,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: SettingsIcon,
    activeIcon: SettingsIcon,
  },
  {
    label: "Members",
    href: "/members",
    icon: User2Icon,
    activeIcon: User2Icon,
  },
];

export const Navigation = () => {
  return (
    <ul className="flex flex-col gap-y-4">
      {routes.map((item) => {
        const isActive = false;
        const Icon = isActive ? item.activeIcon : item.icon;
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "group relative overflow-hidden",
                "rounded-2xl transition-all duration-500",
                isActive ? "scale-105" : ""
              )}
            >
              {/* Glass background effect */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-white to-white/20 backdrop-blur-md 
                group-hover:from-white/80 group-hover:to-white/60 transition-all duration-500"
              />

              {/* Hover gradient border */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent 
                opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />

              <div
                className={cn(
                  "relative z-10 flex items-center gap-4 p-4",
                  "transform transition-all duration-500",
                  "group-hover:translate-x-2",
                  isActive ? "translate-x-2" : ""
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-xl bg-white/80 shadow-lg",
                    "transform transition-all duration-500",
                    "group-hover:scale-110 group-hover:rotate-6",
                    "group-hover:shadow-[0_0_20px_rgba(0,0,0,0.1)]"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-6",
                      isActive ? "text-primary" : "text-neutral-600",
                      "group-hover:text-primary transition-colors duration-500"
                    )}
                  />
                </div>

                <span
                  className={cn(
                    "font-medium text-lg",
                    isActive ? "text-primary" : "text-neutral-600",
                    "group-hover:text-primary transition-colors duration-500"
                  )}
                >
                  {item.label}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </ul>
  );
};
