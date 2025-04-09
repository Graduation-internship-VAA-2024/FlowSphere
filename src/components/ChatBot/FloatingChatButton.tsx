"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { SidePanelChat } from "./SidePanelChat";
import { useChatContext } from "./context/ChatContext";

export const FloatingChatButton = () => {
  const { isOpen, openChat, closeChat } = useChatContext();

  return (
    <>
      {!isOpen && (
        <motion.button
          onClick={openChat}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-primary text-white shadow-lg z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MessageCircle size={24} />
        </motion.button>
      )}

      <SidePanelChat />
    </>
  );
};
