"use client";
import { ChatUI } from "@/features/chat/components/chat-ui";
import { useParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Chats, ChatMembers } from "@/features/chat/type";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [selectedChat, setSelectedChat] = useState<Chats & { members?: ChatMembers[] } | null>(null);
  const [memberId, setMemberId] = useState<string>("");
  const [chats, setChats] = useState<(Chats & { members?: ChatMembers[] })[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatsLoading, setIsChatsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch member ID
  useEffect(() => {
    if (!workspaceId) return;

    const fetchMemberId = async () => {
      try {
        const response = await fetch(`/api/members/me?workspaceId=${workspaceId}`);
        
        if (response.status === 404) {
          // User is not a member of this workspace
          setError("You are not a member of this workspace. Please join the workspace to access chat.");
          setIsLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch member: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.data) {
          setMemberId(data.data.$id);
        } else {
          throw new Error("No member data received");
        }
      } catch (error) {
        console.error("Error fetching member:", error);
        setError(`Could not get member information: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberId();
  }, [workspaceId]);

  // Fetch chats
  useEffect(() => {
    if (!workspaceId) return;

    const fetchChats = async () => {
      try {
        const response = await fetch(`/api/chats?workspaceId=${workspaceId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch chats: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.data && data.data.documents) {
          setChats(data.data.documents);
          
          // If there are chats and none is selected, select the first one
          if (data.data.documents.length > 0 && !selectedChat) {
            setSelectedChat(data.data.documents[0]);
          }
        }
      } catch (error) {
        setError(`Could not load chats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsChatsLoading(false);
      }
    };

    fetchChats();
  }, [workspaceId, selectedChat]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (!selectedChat?.$id) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chats/${selectedChat.$id}/messages`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.data && data.data.documents) {
          setMessages(data.data.documents);
        }
      } catch (error) {
        console.error(`Could not load messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    fetchMessages();
  }, [selectedChat?.$id]);

  const handleSelectChat = (chat: Chats & { members?: ChatMembers[] }) => {
    setSelectedChat(chat);
  };

  const handleSyncMembers = async () => {
    if (!selectedChat?.$id) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch(`/api/chats/${selectedChat.$id}/sync-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workspaceId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to sync members: ${response.status}`);
      }
      
      // Refresh chats after sync
      const chatsResponse = await fetch(`/api/chats?workspaceId=${workspaceId}`);
      if (chatsResponse.ok) {
        const data = await chatsResponse.json();
        if (data.data && data.data.documents) {
          setChats(data.data.documents);
          
          // Update selected chat with new data
          const updatedSelectedChat = data.data.documents.find(
            (chat: Chats) => chat.$id === selectedChat.$id
          );
          if (updatedSelectedChat) {
            setSelectedChat(updatedSelectedChat);
          }
        }
      }
    } catch (error) {
      setError(`Failed to sync members: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!selectedChat?.$id || (!content.trim() && !file)) return;
    
    setIsSending(true);
    try {
      if (file) {
        // Handle file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatsId', selectedChat.$id);
        formData.append('memberId', memberId);
        
        await fetch('/api/chats/upload', {
          method: 'POST',
          body: formData
        });
      }
      
      if (content.trim()) {
        // Send text message
        await fetch(`/api/chats/${selectedChat.$id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chatsId: selectedChat.$id,
            memberId,
            content: content.trim()
          })
        });
      }
      
      // Refresh messages after sending
      const response = await fetch(`/api/chats/${selectedChat.$id}/messages`);
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.documents) {
          setMessages(data.data.documents);
        }
      }
    } catch (error) {
      console.error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setIsChatsLoading(true);
    
    // Trigger reloading data by forcing the useEffects to run again
    if (workspaceId) {
      // The member ID and chats fetching logic is in useEffects
      // Just reset the states, and the effects will handle the fetching
      setMemberId("");
      setChats([]);
    }
  };

  // Function to handle joining workspace
  const handleJoinWorkspace = async () => {
    // This is a placeholder for joining workspace functionality
    // You would need to implement this based on your workspace join process
    try {
      alert("Please implement workspace joining functionality");
      // Example implementation would be something like:
      // await fetch(`/api/workspaces/${workspaceId}/join`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ code: 'invite-code-here' }),
      // });
      // Then retry loading
      handleRetry();
    } catch (error) {
      console.error("Error joining workspace:", error);
      setError("Failed to join workspace. Please try again.");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Main chat content */}
      <div className="flex-1 min-h-0">
        <Suspense fallback={<ChatSkeleton />}>
          {error && error.includes("not a member") ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="mb-6 p-4 rounded-full bg-muted">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Join Workspace to Chat</h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You need to be a member of this workspace to access the chat feature.
              </p>
              <div className="flex gap-4">
                <Button onClick={handleJoinWorkspace} className="gap-2">
                  Join Workspace
                </Button>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Go Back
                </Button>
              </div>
            </div>
          ) : (
            <ChatUI 
              workspaceId={workspaceId}
              selectedChat={selectedChat}
              memberId={memberId}
              chats={chats}
              isLoading={isLoading}
              isChatsLoading={isChatsLoading}
              isSyncing={isSyncing}
              error={error}
              onSelectChat={handleSelectChat}
              onSyncMembers={handleSyncMembers}
              onRetry={handleRetry}
              onSendMessage={handleSendMessage}
              messages={messages}
              isSending={isSending}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}

// Skeleton loader for chat interface
function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      <Skeleton className="w-80 h-full" />
      <Skeleton className="flex-1 h-full" />
    </div>
  );
}