import { useState, useEffect } from "react";
import { chatApi } from "../api";
import { MessageRead } from "../type";

export const useReadStatus = (messageId: string, chatId: string) => {
  const [data, setData] = useState<MessageRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchReadStatus = async () => {
      try {
        const response = await chatApi.getMessageReads(chatId, messageId);
        setData(response.data.documents);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadStatus();
  }, [messageId, chatId]);

  return { data, isLoading, error };
};
