export interface User {
  $id: string;
  name: string;
  email: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp?: number;
}

export interface ChatbotState {
  messages: Message[];
  isTyping: boolean;
  showIntro: boolean;
  hasWelcomed: boolean;
  currentIntent?: Intent;
  workspaceContext?: WorkspaceContext;
}

export interface Intent {
  type: 'create_workspace' | 'create_project' | 'unknown';
  confidence: number;
  data?: any;
}

export interface WorkspaceContext {
  workspaceId?: string;
  workspaceName?: string;
  isCreating: boolean;
  projectIntent?: ProjectIntent;
}

export interface ProjectIntent {
  isCreating: boolean;
  name?: string;
  type?: string;
}