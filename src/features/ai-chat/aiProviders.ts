import { AIProviderId, AIProviderInfo, ChatMessage, TokenUsage } from "./types";

export const AI_PROVIDERS: AIProviderInfo[] = [
  {
    id: "openai",
    name: "OpenAI",
    isLocal: false,
    defaultModel: "gpt-4o-mini",
    availableModels: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    isLocal: false,
    defaultModel: "gemini-1.5-flash",
    availableModels: ["gemini-1.5-flash", "gemini-1.5-pro"],
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    isLocal: false,
    defaultModel: "claude-3-5-sonnet-20241022",
    availableModels: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    isLocal: false,
    defaultModel: "anthropic/claude-3.5-sonnet",
    availableModels: [
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o",
      "meta-llama/llama-3.3-70b-instruct",
      "google/gemini-flash-1.5",
    ],
  },
  {
    id: "sarvam",
    name: "Sarvam AI",
    isLocal: false,
    defaultModel: "sarvam-105b",
    availableModels: ["sarvam-105b", "sarvam-105b-conversations"],
  },
  {
    id: "groq",
    name: "Groq",
    isLocal: false,
    defaultModel: "llama-3.3-70b-versatile",
    availableModels: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
  },
  {
    id: "together",
    name: "Together AI",
    isLocal: false,
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    availableModels: ["meta-llama/Llama-3.3-70B-Instruct-Turbo"],
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    isLocal: true,
    defaultModel: "llama3",
    availableModels: ["llama3", "gemma3", "gemma4:e4b", "mistral", "deepseek-coder-v2", "phi3", "qwen2.5"],
    defaultEndpoint: "http://localhost:11434/v1/chat/completions",
  },
  {
    id: "lmstudio",
    name: "LM Studio (Local)",
    isLocal: true,
    defaultModel: "",
    availableModels: ["", "gemma4:e4b", "gemma3", "llama3", "deepseek-coder-v2", "qwen2.5", "mistral"],
    defaultEndpoint: "http://localhost:1234/v1/chat/completions",
  },
  {
    id: "custom",
    name: "Custom OpenAI API",
    isLocal: false,
    defaultModel: "default",
    availableModels: ["default"],
    defaultEndpoint: "https://api.openai.com/v1/chat/completions",
  },
];

export function getProviderInfo(id: AIProviderId): AIProviderInfo {
  return AI_PROVIDERS.find((p) => p.id === id) || AI_PROVIDERS[0];
}

// Estimate tokens based on word/character count (approx 4 chars = 1 token)
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.8);
}

// Estimate cost in USD per 1K tokens
export function calculateEstimatedCost(providerId: AIProviderId, promptTokens: number, completionTokens: number): number | undefined {
  const provider = getProviderInfo(providerId);
  if (provider.isLocal) return undefined;

  let promptRate = 0.00015; // per 1k tokens
  let completionRate = 0.0006;

  if (providerId === "openai") {
    promptRate = 0.00015;
    completionRate = 0.0006;
  } else if (providerId === "claude") {
    promptRate = 0.003;
    completionRate = 0.015;
  } else if (providerId === "groq") {
    promptRate = 0.00059;
    completionRate = 0.00079;
  }

  const cost = (promptTokens / 1000) * promptRate + (completionTokens / 1000) * completionRate;
  return Math.max(0.00001, Number(cost.toFixed(6)));
}

export interface StreamChatParams {
  providerId: AIProviderId;
  modelName: string;
  apiKey?: string;
  customEndpoint?: string;
  systemPrompt: string;
  messages: ChatMessage[];
  onChunk: (delta: string) => void;
  signal?: AbortSignal;
  temperature?: number;
}

export async function streamAIChat({
  providerId,
  modelName,
  apiKey,
  customEndpoint,
  systemPrompt,
  messages,
  onChunk,
  signal,
  temperature,
}: StreamChatParams): Promise<TokenUsage> {
  const provider = getProviderInfo(providerId);
  const startTime = Date.now();

  // Smart model resolution: fallback to defaultModel if missing/auto, or omit if LM Studio (empty string)
  const resolvedModel = (modelName && modelName !== "auto")
    ? modelName
    : provider.defaultModel;

  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  const promptText = systemPrompt + messages.map((m) => m.content).join(" ");
  const promptTokens = estimateTokens(promptText);

  // 1. Anthropic Claude API
  if (providerId === "claude") {
    if (!apiKey) throw new Error("Anthropic Claude API Key is required. Please set it in Key Settings.");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "dangerously-allow-browser": "true",
      },
      body: JSON.stringify({
        model: resolvedModel || "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.content,
        })),
        stream: true,
        ...(temperature !== undefined ? { temperature } : {}),
      }),
      signal,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Claude API error ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponseText = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const jsonStr = line.replace(/^data:\s*/, "").trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              fullResponseText += parsed.delta.text;
              onChunk(parsed.delta.text);
            }
          } catch { /* parse chunk */ }
        }
      }
    }

    const completionTokens = estimateTokens(fullResponseText);
    const responseTimeMs = Date.now() - startTime;
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      responseTimeMs,
      estimatedCost: calculateEstimatedCost(providerId, promptTokens, completionTokens),
    };
  }

  // 2. Google Gemini API
  if (providerId === "gemini") {
    if (!apiKey) throw new Error("Google Gemini API Key is required. Please set it in Key Settings.");
    const targetModel = resolvedModel || "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?key=${apiKey}`;
    const contents = [
      { role: "user", parts: [{ text: `[System Instruction: ${systemPrompt}]` }] },
      ...messages.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
    ];

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        ...(temperature !== undefined ? { generationConfig: { temperature } } : {}),
      }),
      signal,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gemini API error ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponseText = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        try {
          const jsonMatches = chunk.match(/\{[\s\S]*?\}/g);
          if (jsonMatches) {
            for (const matchStr of jsonMatches) {
              try {
                const parsed = JSON.parse(matchStr);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  fullResponseText += text;
                  onChunk(text);
                }
              } catch { /* json parse chunk */ }
            }
          }
        } catch { /* decode */ }
      }
    }

    const completionTokens = estimateTokens(fullResponseText);
    const responseTimeMs = Date.now() - startTime;
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      responseTimeMs,
      estimatedCost: calculateEstimatedCost(providerId, promptTokens, completionTokens),
    };
  }

  // 3. OpenAI & OpenAI-Compatible Endpoints (Groq, OpenRouter, Sarvam, Together, Ollama, LM Studio, Custom)
  let endpoint = customEndpoint || provider.defaultEndpoint || "https://api.openai.com/v1/chat/completions";
  if (providerId === "openrouter") endpoint = "https://openrouter.ai/api/v1/chat/completions";
  if (providerId === "sarvam") endpoint = "https://api.sarvam.ai/v1/chat/completions";
  if (providerId === "groq") endpoint = "https://api.groq.com/openai/v1/chat/completions";
  if (providerId === "together") endpoint = "https://api.together.xyz/v1/chat/completions";

  if (!provider.isLocal && !apiKey) {
    throw new Error(`${provider.name} API Key is required. Please add your key in Key Settings.`);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  if (providerId === "sarvam" && apiKey) {
    headers["api-subscription-key"] = apiKey;
  }
  if (providerId === "openrouter") {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = "LiveTalk AI Chat";
  }

  // For LM Studio / Auto-detect: if resolvedModel is empty, omit model property
  const modelToSend = resolvedModel || undefined;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelToSend,
        messages: formattedMessages,
        stream: true,
        ...(temperature !== undefined ? { temperature } : {}),
      }),
      signal,
    });
  } catch (networkErr: any) {
    console.error(`[AI Chat] Network error connecting to ${endpoint}:`, networkErr);
    if (provider.isLocal) {
      throw new Error(
        `Cannot connect to ${provider.name} at ${endpoint}. Make sure the server is running and CORS is enabled. (${networkErr.message})`
      );
    }
    throw networkErr;
  }

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    let errMsg = errJson.error?.message || `${provider.name} error (${response.status})`;
    console.error(`[AI Chat] ${provider.name} API error:`, errMsg, errJson);
    // User-friendly message for quota/credit issues
    if (response.status === 402 || errJson.error?.code === "insufficient_quota_error") {
      errMsg = `${provider.name}: No credits available. Please add credits at your ${provider.name} dashboard or switch to a different AI provider.`;
    }
    throw new Error(errMsg);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullResponseText = "";

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        const jsonStr = line.replace(/^data:\s*/, "").trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullResponseText += delta;
            onChunk(delta);
          }
        } catch { /* json parse stream */ }
      }
    }
  }

  const completionTokens = estimateTokens(fullResponseText);
  const responseTimeMs = Date.now() - startTime;

  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    responseTimeMs,
    estimatedCost: calculateEstimatedCost(providerId, promptTokens, completionTokens),
    isLocal: provider.isLocal,
  };
}

export interface TestKeyParams {
  providerId: AIProviderId;
  apiKey?: string;
  customEndpoint?: string;
}

export interface TestKeyResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}

export async function testAIProviderKey({
  providerId,
  apiKey,
  customEndpoint,
}: TestKeyParams): Promise<TestKeyResult> {
  const provider = getProviderInfo(providerId);
  const startTime = Date.now();

  if (!provider.isLocal && !apiKey && providerId !== "custom") {
    return { success: false, message: "API key is missing" };
  }

  try {
    // 1. Anthropic Claude
    if (providerId === "claude") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey || "",
          "anthropic-version": "2023-06-01",
          "dangerously-allow-browser": "true",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (response.ok) {
        return { success: true, message: `Connected (${latencyMs}ms)`, latencyMs };
      }
      const errJson = await response.json().catch(() => ({}));
      return { success: false, message: errJson.error?.message || `HTTP ${response.status}` };
    }

    // 2. Google Gemini
    if (providerId === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Hi" }] }],
          generationConfig: { maxOutputTokens: 1 },
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (response.ok) {
        return { success: true, message: `Connected (${latencyMs}ms)`, latencyMs };
      }
      const errJson = await response.json().catch(() => ({}));
      return { success: false, message: errJson.error?.message || `HTTP ${response.status}` };
    }

    // 3. OpenAI & OpenAI-compatible providers
    let endpoint = customEndpoint || provider.defaultEndpoint || "https://api.openai.com/v1/chat/completions";
    if (providerId === "openrouter") endpoint = "https://openrouter.ai/api/v1/chat/completions";
    if (providerId === "sarvam") endpoint = "https://api.sarvam.ai/v1/chat/completions";
    if (providerId === "groq") endpoint = "https://api.groq.com/openai/v1/chat/completions";
    if (providerId === "together") endpoint = "https://api.together.xyz/v1/chat/completions";

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
    if (providerId === "sarvam" && apiKey) {
      headers["api-subscription-key"] = apiKey;
    }
    if (providerId === "openrouter") {
      headers["HTTP-Referer"] = window.location.origin;
      headers["X-Title"] = "LiveTalk AI Chat";
    }

    const testModel = provider.defaultModel || undefined;

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 1,
        stream: false,
      }),
    });

    const latencyMs = Date.now() - startTime;
    if (response.ok) {
      return { success: true, message: `Connected (${latencyMs}ms)`, latencyMs };
    }

    const errJson = await response.json().catch(() => ({}));
    return { success: false, message: errJson.error?.message || `HTTP ${response.status}` };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    if (provider.isLocal) {
      return {
        success: false,
        message: `Offline (${provider.name} not running at ${provider.defaultEndpoint})`,
        latencyMs,
      };
    }
    return { success: false, message: err.message || "Network request failed", latencyMs };
  }
}

