// Hook để lấy lịch sử tin nhắn (giả lập)
export const useChatHistory = () => {
  const getHistory = () => {
    return ["Hello!", "How are you?", "I'm fine, thanks!"];
  };

  return getHistory;
};
