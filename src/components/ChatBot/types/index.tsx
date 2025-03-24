export interface User {
  $id: string;
  name: string;
  email: string;
}

export interface ChatbotState {
  messages: Message[];
  isTyping: boolean;
  showIntro: boolean;
  hasWelcomed: boolean;
}