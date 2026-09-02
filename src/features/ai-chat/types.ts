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
  | "startup_mentor"
  | "stoic_philosopher"
  | "cyberpunk_hacker"
  | "fitness_coach"
  | "storyteller"
  | "gaming_buddy"
  | "study_partner"
  | "translator"
  | "travel_guide"
  | "romantic_partner"
  | "spouse"
  | "flirty_partner"
  | "sex_education_expert"
  | "custom";

export type PersonalityCategory = "all" | "productivity" | "creative" | "learning" | "companions";

export interface PersonalityConfig {
  id: PersonalityId;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  category?: PersonalityCategory;
  tagline?: string;
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
  aiName?: string;
  aiAge?: number;
}

export type APIKeysMap = Partial<Record<AIProviderId, string>> & {
  customEndpoint?: string;
};

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rateFromUSD: number;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee (INR)", rateFromUSD: 85.0 },
  { code: "USD", symbol: "$", name: "US Dollar (USD)", rateFromUSD: 1.0 },
  { code: "EUR", symbol: "€", name: "Euro (EUR)", rateFromUSD: 0.92 },
  { code: "GBP", symbol: "£", name: "British Pound (GBP)", rateFromUSD: 0.78 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen (JPY)", rateFromUSD: 155.0 },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar (CAD)", rateFromUSD: 1.38 },
  { code: "AUD", symbol: "AU$", name: "Australian Dollar (AUD)", rateFromUSD: 1.52 },
  { code: "AED", symbol: "AED ", name: "UAE Dirham (AED)", rateFromUSD: 3.67 },
  { code: "SAR", symbol: "SAR ", name: "Saudi Riyal (SAR)", rateFromUSD: 3.75 },
  { code: "BRL", symbol: "R$", name: "Brazilian Real (BRL)", rateFromUSD: 5.50 },
];

export function formatCost(costInUSD: number | undefined, currencyCode: string = "INR"): string {
  if (costInUSD === undefined || costInUSD <= 0) return "";
  const curr = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const converted = costInUSD * curr.rateFromUSD;

  if (curr.code === "INR") {
    if (converted < 0.01) return `${curr.symbol}${converted.toFixed(4)}`;
    return `${curr.symbol}${converted.toFixed(3)}`;
  }
  if (curr.code === "JPY") {
    return `${curr.symbol}${converted.toFixed(2)}`;
  }
  if (converted < 0.001) {
    return `${curr.symbol}${converted.toFixed(5)}`;
  }
  return `${curr.symbol}${converted.toFixed(4)}`;
}
