'use client';
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@/features/auth/components/user-button";
import { ChatbotDialog } from '@/components/ChatBot/ChatBot';
import { MessageCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion } from 'framer-motion';

interface StandloneLayoutProps {
  children: React.ReactNode;
}

const StandloneLayout = ({ children }: StandloneLayoutProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Add keyboard shortcut handler
  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+I (or Cmd+I on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
        event.preventDefault(); // Prevent default browser behavior
        toggleChat();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleChat]);
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-50">
      {/* Background Decorations with enhanced animations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-64 h-64 rounded-full 
          bg-primary/5 blur-3xl animate-pulse"
        />
        <div
          className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full 
          bg-purple-500/5 blur-3xl animate-pulse delay-700"
        />
        <div
          className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full 
          bg-blue-500/5 blur-3xl animate-pulse delay-1000"
        />
      </div>

      {/* Sticky Navigation Container */}
      <div className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/30 transition-all duration-300">
        <div className="max-w-screen-2xl mx-auto px-4">
          <nav
            className="flex justify-between items-center h-[73px] my-4 px-6
            bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20
            shadow-lg shadow-black/[0.03] hover:shadow-xl hover:shadow-black/[0.05]
            transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Link href="/" className="relative group">
              <div
                className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-blue-500/10 
                rounded-lg blur opacity-0 group-hover:opacity-100 transition-all duration-300"
              />
              <div className="relative flex items-center gap-2">
                <Image
                  src="/logo.svg"
                  alt="logo"
                  width={152}
                  height={56}
                  className="transform transition-transform duration-300 group-hover:scale-105"
                />
                <div className="h-6 w-px bg-neutral-200/50 mx-2" />
                <span
                  className="text-sm font-medium text-neutral-600 group-hover:text-primary 
                  transition-colors duration-300"
                >
                  Dashboard
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <div
                className="hidden sm:flex items-center gap-2 px-4 py-2 
                bg-white/50 rounded-lg border border-white/20 shadow-sm"
              >
                <span className="text-xs font-medium text-neutral-500">
                  Quick Actions
                </span>
                <kbd
                  className="px-2 py-1 text-xs font-mono font-medium text-neutral-600 
                  bg-neutral-100/80 rounded border border-neutral-200/50"
                >
                  ⌘K
                </kbd>
              </div>

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
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 via-violet-500/20 to-blue-500/20 
                    rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <motion.div
                  whileHover={{ rotate: 15 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <MessageCircle className="w-5 h-5" />
                </motion.div>
                <span className="font-medium text-sm">Ask AI</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium 
                  bg-white/10 rounded border border-white/20 ml-1">
                  Ctrl+I
                </kbd>
              </motion.button>
              
              <UserButton />
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content with smooth scroll */}
      <div className="relative z-10 mx-auto max-w-screen-2xl p-4">
        <div className="py-8 overflow-y-auto scrollbar-hide">{children}</div>
      </div>

      {/* Footer Gradient */}
      <div
        className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t 
        from-white/50 to-transparent pointer-events-none"
      />
      <ChatbotDialog isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </main>
  );
};

export default StandloneLayout;
