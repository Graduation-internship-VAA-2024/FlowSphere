// Giả sử bạn đang sử dụng một API để gửi tin nhắn
export const useSendMessage = () => {
  const sendMessage = async (message: string) => {
    // Giả lập gửi tin nhắn qua API
    console.log("Sending message:", message);
  };

  return sendMessage;
};
