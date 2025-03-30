"use client";
import { ChatList } from "@/features/chat/components/chat-list";
import { ChatArea } from "@/features/chat/components/chat-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col">
      {/* Header with back button */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/workspaces`)}
          className="hover:scale-105 transition-transform"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">Chat</h1>
      </div>

      {/* Main chat content */}
      <div className="flex-1 min-h-0">
        <div className="flex gap-4 h-full">
          <ChatList />
          <ChatArea />
        </div>
      </div>
    </div>
  );
}
