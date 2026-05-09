export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GemmaChatRequest {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface GemmaChatResponse {
  reply: string;
  model: string;
}

export interface GemmaModelsResponse {
  current: string;
  available: string[];
}
