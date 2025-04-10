import React, { useEffect, useState } from "react";
import { MessageRead } from "../type";
import { chatApi } from "../api";

interface MessageReadStatusProps {
  messageId: string;
  chatsId: string;
  memberId: string;
  totalMembers: number;
  createdAt: string;
  status?: "sent" | "delivered" | "read";
}

export const MessageReadStatus = ({
  messageId,
  chatsId,
  memberId,
  totalMembers,
  createdAt,
  status,
}: MessageReadStatusProps) => {
  const [reads, setReads] = useState<MessageRead[]>([]);
  const [messageStatus, setMessageStatus] = useState<
    "sending" | "sent" | "delivered" | "read"
  >(status || "sending");

  // Mark current message as read when viewed
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await chatApi.markMessageAsRead(chatsId, messageId);
      } catch (error) {
        console.error("Failed to mark message as read:", error);
      }
    };

    markAsRead();
  }, [messageId, chatsId]);

  // Fetch read status
  useEffect(() => {
    // Kiểm tra nếu messageId bắt đầu bằng 'temp-' thì chưa thực sự gửi
    if (messageId.startsWith("temp-")) {
      setMessageStatus("sending");
      return;
    }

    const fetchReadStatus = async () => {
      try {
        const response = await chatApi.getMessageReads(chatsId, messageId);
        if (response.data?.documents) {
          const readRecords = response.data.documents;
          setReads(readRecords);

          // Cập nhật trạng thái tin nhắn
          if (readRecords.length === 0) {
            setMessageStatus("sent"); // Đã gửi nhưng chưa ai đọc
          } else if (readRecords.length < totalMembers - 1) {
            setMessageStatus("delivered"); // Có người đã đọc nhưng chưa phải tất cả
          } else {
            setMessageStatus("read"); // Tất cả đã đọc
          }
        }
      } catch (error) {
        console.error("Failed to fetch read status:", error);
      }
    };

    fetchReadStatus();

    // Set up interval to refresh read status every 10 seconds
    const intervalId = setInterval(fetchReadStatus, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [messageId, chatsId, totalMembers]);

  // Do not render for messages we received
  if (!messageId || reads.some((read) => read.memberId === memberId)) {
    return null;
  }

  // Calculate time difference since message sent
  const getTimeSinceSent = () => {
    const now = new Date();
    const sentTime = new Date(createdAt);
    const diffMs = now.getTime() - sentTime.getTime();

    // Convert to appropriate time unit
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);

    if (diffSecs < 60) {
      return "just now";
    } else if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${Math.round(diffHours / 24)} days ago`;
    }
  };

  return (
    <span className="ml-1 text-muted-foreground inline-flex items-center">
      {messageStatus === "sending" && (
        <span className="text-[10px] italic">Sending...</span>
      )}
      {messageStatus === "sent" && (
        <span className="text-[10px] italic">Sent {getTimeSinceSent()}</span>
      )}
      {messageStatus === "delivered" && (
        <span className="text-[10px] italic">Delivered</span>
      )}
      {messageStatus === "read" && (
        <span className="text-[10px] italic text-blue-500">Read</span>
      )}
    </span>
  );
};
