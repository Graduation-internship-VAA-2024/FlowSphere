"use client";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspace";
import { RiAddCircleFill } from "react-icons/ri";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { WorkspaceAvatar } from "@/features/workspaces/components/workspace-avatar";
import { cn } from "@/lib/utils";
import Image from "next/image";

export const WorkspaceSwitcher = () => {
  const { data: workspaces } = useGetWorkspaces();

  return (
    <div className="flex flex-col gap-y-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-x-3">
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-primary/60 shadow-lg shadow-primary/25" />
          <p className="text-xs font-bold tracking-widest text-neutral-800">
            WORKSPACE
          </p>
        </div>
        <button className="group relative p-1">
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 opacity-0 
              transition-all duration-300 group-hover:opacity-100 group-hover:scale-110"
          />
          <RiAddCircleFill
            className="size-6 text-primary transition-all duration-300 
              group-hover:rotate-90 group-hover:scale-110 group-hover:shadow-lg"
          />
        </button>
      </div>

      {/* Select */}
      <Select>
        <SelectTrigger
          className={cn(
            "relative w-full overflow-hidden rounded-2xl border-0",
            "bg-gradient-to-br from-white via-white to-neutral-50/90",
            "p-4 transition-all duration-300",
            "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]",
            "hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.15)]",
            "hover:translate-y-[-2px]",
            "focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
            "after:absolute after:inset-0 after:rounded-2xl",
            "after:bg-gradient-to-br after:from-white/40 after:to-white/0",
            "after:opacity-0 hover:after:opacity-100",
            "after:transition-opacity after:duration-300"
          )}
        >
          <SelectValue
            placeholder={
              <div className="flex items-center gap-x-3">
                <div
                  className="size-8 rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-100 
                    shadow-inner"
                />
                <span className="text-neutral-600 font-medium">
                  Select workspace
                </span>
              </div>
            }
          />
        </SelectTrigger>

        <SelectContent
          className={cn(
            "w-full overflow-hidden rounded-2xl border-0",
            "bg-gradient-to-br from-white to-neutral-50/95",
            "backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)]",
            "border border-white/20"
          )}
        >
          <div className="max-h-[320px] overflow-y-auto p-2 space-y-1">
            {workspaces?.documents && workspaces.documents.length > 0 ? (
              workspaces.documents.map((workspace) => (
                <SelectItem
                  key={workspace.$id}
                  value={workspace.$id}
                  className={cn(
                    "rounded-xl transition-all duration-300",
                    "hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent",
                    "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary/20 data-[state=checked]:to-transparent",
                    "group relative overflow-hidden",
                    "after:absolute after:inset-0 after:rounded-xl",
                    "after:bg-gradient-to-r after:from-white/40 after:to-transparent",
                    "after:opacity-0 hover:after:opacity-100",
                    "after:transition-opacity after:duration-300"
                  )}
                >
                  <div className="flex items-center gap-4 p-3">
                    <WorkspaceAvatar
                      image={workspace.imageUrl}
                      name={workspace.name}
                      className="size-10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="font-semibold text-neutral-800 transition-colors duration-300 
                          group-hover:text-primary"
                      >
                        {workspace.name}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className="relative w-32 h-32 mb-4">
                  <Image
                    src="/no-items.jpg"
                    alt="No workspaces"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <p className="text-sm text-neutral-600 text-center font-medium">
                  No workspaces found
                </p>
                <p className="text-xs text-neutral-500 text-center mt-1">
                  Create a new workspace to get started
                </p>
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};
