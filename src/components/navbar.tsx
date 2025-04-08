"use client";

import { UserButton } from "@/features/auth/components/user-button";
import { MobileSidebar } from "./mobile-sidebar";
import { useState } from "react";
import { ChatbotDialog } from "@/components/ChatBot/ChatBot";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { usePathname } from "next/navigation";

const pathnameMap = {
  tasks: {
    title: "My Tasks",
    description: "View and manage your tasks",
  },
  projects: {
    title: "My Projects",
    description: "View and manage your projects",
  },
};

const defaultMap = {
  title: "Home",
  description: "Monitor all of your tasks and projects",
};

export const Navbar = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const pathname = usePathname();
  const pathnameParts = pathname?.split("/") || [];
  const pathnameKey = pathnameParts[3] as keyof typeof pathnameMap;
  const { title, description } = pathnameMap[pathnameKey] || defaultMap;
  return (
    <nav className="pt-6 px-6 flex items-center justify-between">
      <div className="flex-col hidden lg:flex gap-1">
        <SparklesText
          text={title}
          className="text-2xl font-semibold"
          colors={{ first: "#4f46e5", second: "#818cf8" }}
          sparklesCount={15}
        />
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="flex items-center gap-4">
        <MobileSidebar />
        <motion.button
          onClick={() => setIsChatOpen(true)}
          className="group flex items-center gap-2 px-4 py-2.5 
            bg-gradient-to-r from-primary/80 via-violet-500/80 to-blue-500/80
            hover:from-primary hover:via-violet-500 hover:to-blue-500
            text-white rounded-xl shadow-lg 
            shadow-primary/20 hover:shadow-primary/40
            transition-all duration-300 transform hover:-translate-y-0.5
            border border-white/20 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            whileHover={{ rotate: 15 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <MessageCircle className="w-5 h-5" />
          </motion.div>
          <span className="font-medium text-sm">Ask AI</span>
          <kbd
            className="px-1.5 py-0.5 text-[10px] font-mono font-medium 
            bg-white/10 rounded border border-white/20 ml-1"
          >
            Ctrl+I
          </kbd>
        </motion.button>
        <UserButton />
      </div>

      <ChatbotDialog isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </nav>
  );
};
