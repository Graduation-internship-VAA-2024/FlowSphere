"use client";
import { cn } from "@/lib/utils";
import { SettingsIcon, User2Icon, MessageCircle } from "lucide-react";
import Link from "next/link";
import {
  GoCheckCircle,
  GoCheckCircleFill,
  GoHome,
  GoHomeFill,
} from "react-icons/go";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { usePathname } from "next/navigation";
import { useUnreadMessages } from "@/features/chat/hooks/use-unread-messages";

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
  {
    label: "Chat",
    href: "/chat",
    icon: MessageCircle,
    activeIcon: MessageCircle,
  },
];

export const Navigation = () => {
  const workspaceId = useWorkspaceId();
  const pathname = usePathname();
  const { unreadCount } = useUnreadMessages();
  
  return (
    <ul className="flex flex-col gap-y-2">
      {routes.map((item) => {
        const fullHref = `/workspaces/${workspaceId}${item.href}`;
        const isActive = pathname === fullHref;
        const Icon = isActive ? item.activeIcon : item.icon;
        return (
          <Link key={item.href} href={fullHref}>
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
                    "p-2 rounded-xl bg-white/80 shadow-lg relative",
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
                  
                  {/* Notification Badge for Chat */}
                  {item.label === "Chat" && unreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center w-5 h-5 animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
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