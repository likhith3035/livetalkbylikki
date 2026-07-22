export type AIProviderId =
  | "openai"
  | "gemini"
  | "claude"
  | "openrouter"
  | "sarvam"
  | "groq"
  | "together"
  | "ollama"
  | "lmstudio"
  | "custom";

export interface AIProviderInfo {
  id: AIProviderId;
  name: string;
  isLocal: boolean;
  defaultModel: string;
  availableModels: string[];
  defaultEndpoint?: string;
}

export type PersonalityId =
  | "assistant"
  | "friendly_friend"
  | "funny_friend"
  | "teacher"
  | "doctor"
  | "coding_expert"
  | "gaming_buddy"
  | "study_partner"
  | "translator"
  | "travel_guide"
  | "romantic_partner"
  | "spouse"
  | "flirty_partner"
  | "sex_education_expert"
  | "custom";

export interface PersonalityConfig {
  id: PersonalityId;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  responseTimeMs: number;
  estimatedCost?: number;
  isLocal?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: number;
  usage?: TokenUsage;
  providerId?: AIProviderId;
  modelName?: string;
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  personality: PersonalityConfig;
  providerId: AIProviderId;
  modelName: string;
  messages: ChatMessage[];
  customEndpoint?: string;
  isPinned?: boolean;
  temperature?: number;
}

export type APIKeysMap = Partial<Record<AIProviderId, string>> & {
  customEndpoint?: string;
};
