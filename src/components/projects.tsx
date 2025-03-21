"use client";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiAddCircleFill } from "react-icons/ri";
import { motion } from "framer-motion";

export const Projects = () => {
  const projectId = null;
  const pathname = usePathname();
  const { open } = useCreateProjectModal();
  const workspaceId = useWorkspaceId();
  const { data } = useGetProjects({ workspaceId });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-y-1.5 relative bg-gradient-to-br from-white/40 to-white/60 p-3 rounded-lg backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-x-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-primary to-primary/60 shadow-lg shadow-primary/25"
          />
          <p className="text-xs font-extrabold tracking-widest text-neutral-800 bg-clip-text text-transparent bg-gradient-to-r from-primary to-neutral-800">
            PROJECTS
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="group relative p-1"
        >
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 opacity-0 
            transition-all duration-300 group-hover:opacity-100"
          />
          <RiAddCircleFill
            onClick={open}
            className="size-6 text-primary transition-all duration-300 
            group-hover:rotate-90 group-hover:shadow-lg"
          />
        </motion.button>
      </div>

      {/* Projects */}
      <div className="space-y-1">
        {data?.documents.map((project, index) => {
          const href = `/workspaces/${workspaceId}/projects/${projectId}`;
          const isActive = pathname === href;

          return (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={project.$id}
            >
              <Link href={href}>
                <div
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md transition-all duration-300 cursor-pointer",
                    "hover:bg-white/80 hover:shadow-sm hover:scale-[1.02]",
                    "text-neutral-600 font-medium",
                    isActive &&
                      "bg-white shadow-sm text-primary border-l-2 border-primary"
                  )}
                >
                  <ProjectAvatar image={project.imageUrl} name={project.name} />
                  <span className="truncate text-sm">{project.name}</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
