import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ChatHeader } from "./chat-header";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { useChat } from "../hooks/use-chat";

export const ChatArea = () => {
  const { messages, sendMessage, isLoading } = useChat();
  
  return (
    <Card className="flex-1 flex flex-col">
      <ChatHeader />
      
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChatMessage message={message} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </Card>
  );
};