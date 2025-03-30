// Giả lập nhận tin nhắn
export const useReceiveMessage = () => {
  const receiveMessage = (callback: (message: string) => void) => {
    // Giả lập nhận tin nhắn và gọi callback
    setTimeout(() => callback("New message received!"), 2000);
  };

  return receiveMessage;
};
