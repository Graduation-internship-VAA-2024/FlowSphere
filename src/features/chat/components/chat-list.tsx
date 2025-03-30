import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export const ChatList = () => {
  return (
    <Card className="w-80 p-4 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-primary">Messages</h2>
        <Button variant="ghost" size="icon">
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>

      <Input 
        placeholder="Search conversations..." 
        className="bg-neutral-50"
      />

      <motion.div className="space-y-2 overflow-auto flex-1">
        {[1,2,3].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 cursor-pointer group transition-all"
          >
            <Avatar />
            <div className="flex-1">
              <p className="font-medium group-hover:text-primary transition-colors">
                User {i + 1}
              </p>
              <p className="text-sm text-neutral-500">Last message...</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </Card>
  );
};