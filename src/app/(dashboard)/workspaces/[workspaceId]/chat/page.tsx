"use client";
import { ChatList } from "@/features/chat/components/chat-list";
import { ChatArea } from "@/features/chat/components/chat-area";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col">

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
