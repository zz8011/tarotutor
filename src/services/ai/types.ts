export type AiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface CloudProxyOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}
