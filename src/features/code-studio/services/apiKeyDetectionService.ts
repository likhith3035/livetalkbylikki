/**
 * Universal API Key Auto-Detector and Multi-Source Synchronizer
 * Automatically detects AI provider from key format, synchronizes keys across
 * existing app storage (livetalk_ai_api_keys, echo_ai_api_key, URL params, and env vars).
 */

export type AIProvider = "gemini" | "openai" | "groq" | "openrouter" | "claude" | "deepseek" | "sarvam";

export interface StudioAPIKeys {
  gemini?: string;
  openai?: string;
  groq?: string;
  openrouter?: string;
  claude?: string;
  deepseek?: string;
  sarvam?: string;
}

export interface KeyDetectionResult {
  provider: AIProvider | "unknown";
  confidence: "high" | "medium" | "low";
  displayName: string;
  sanitizedKey: string;
}

const STORAGE_KEY_PROMPT = "livetalk_ai_api_keys";
const STORAGE_KEY_STUDIO = "code_studio_api_keys";
const STORAGE_KEY_ECHO = "echo_ai_api_key";

/**
 * Detect AI Provider from API Key Prefix / Signature
 */
export function detectKeyProvider(rawKey: string): KeyDetectionResult {
  const trimmed = rawKey.trim();

  if (!trimmed) {
    return {
      provider: "unknown",
      confidence: "low",
      displayName: "Unknown Provider",
      sanitizedKey: "",
    };
  }

  // Google Gemini: always starts with "AIzaSy"
  if (trimmed.startsWith("AIzaSy")) {
    return {
      provider: "gemini",
      confidence: "high",
      displayName: "Google Gemini",
      sanitizedKey: trimmed,
    };
  }

  // Groq: starts with "gsk_"
  if (trimmed.startsWith("gsk_")) {
    return {
      provider: "groq",
      confidence: "high",
      displayName: "Groq Cloud (Ultra Fast)",
      sanitizedKey: trimmed,
    };
  }

  // OpenRouter: starts with "sk-or-v1-"
  if (trimmed.startsWith("sk-or-v1-")) {
    return {
      provider: "openrouter",
      confidence: "high",
      displayName: "OpenRouter (Open Models)",
      sanitizedKey: trimmed,
    };
  }

  // Anthropic Claude: starts with "sk-ant-"
  if (trimmed.startsWith("sk-ant-")) {
    return {
      provider: "claude",
      confidence: "high",
      displayName: "Anthropic Claude",
      sanitizedKey: trimmed,
    };
  }

  // OpenAI: starts with "sk-proj-", "sk-admin-", "sk-svcacct-", or standard "sk-"
  if (
    trimmed.startsWith("sk-proj-") ||
    trimmed.startsWith("sk-admin-") ||
    trimmed.startsWith("sk-svcacct-") ||
    (trimmed.startsWith("sk-") && trimmed.length >= 48)
  ) {
    return {
      provider: "openai",
      confidence: "high",
      displayName: "OpenAI GPT-4o",
      sanitizedKey: trimmed,
    };
  }

  // Sarvam AI: starts with "sarvam_" or matches 32-character hex key (subscription key format)
  if (
    trimmed.startsWith("sarvam_") ||
    trimmed.startsWith("sarvam-") ||
    (/^[a-f0-9]{32}$/i.test(trimmed) && !trimmed.startsWith("gsk_") && !trimmed.startsWith("AIzaSy"))
  ) {
    return {
      provider: "sarvam",
      confidence: "high",
      displayName: "Sarvam AI (₹100 Free Credit)",
      sanitizedKey: trimmed,
    };
  }

  // DeepSeek: often starts with "sk-" followed by 32 alphanumeric chars (shorter than OpenAI project keys)
  if (trimmed.startsWith("sk-") && trimmed.length <= 36) {
    return {
      provider: "deepseek",
      confidence: "medium",
      displayName: "DeepSeek AI",
      sanitizedKey: trimmed,
    };
  }

  return {
    provider: "unknown",
    confidence: "low",
    displayName: "Custom Provider",
    sanitizedKey: trimmed,
  };
}

export interface DetectedSourceInfo {
  provider: AIProvider;
  sourceName: string;
  keyPreview: string;
  rawKey: string;
}

/**
 * Scan all known browser and application sources for API keys:
 * 1. Environment variables (Vite)
 * 2. Shared Prompt Analyzer / AI Chat storage (livetalk_ai_api_keys)
 * 3. Studio local storage (code_studio_api_keys)
 * 4. Echo single API key (echo_ai_api_key)
 * 5. Common storage keys (e.g. groq_api_key, gemini_api_key, openai_api_key, openrouter_api_key)
 * 6. Full localStorage & sessionStorage prefix discovery
 * 7. URL query and hash parameters (?apiKey=... or ?groqKey=...)
 */
export function scanAllKeySources(): { keys: StudioAPIKeys; sources: DetectedSourceInfo[] } {
  const keys: StudioAPIKeys = {};
  const sources: DetectedSourceInfo[] = [];

  const registerKey = (provider: AIProvider, rawKey: string, sourceName: string) => {
    const trimmed = rawKey.trim();
    if (!trimmed) return;
    if (!keys[provider]) {
      keys[provider] = trimmed;
      sources.push({
        provider,
        sourceName,
        keyPreview: `••••${trimmed.slice(-4)}`,
        rawKey: trimmed,
      });
    }
  };

  // 1. Environment variables
  if (typeof import.meta !== "undefined" && import.meta.env) {
    if (import.meta.env.VITE_SARVAM_API_KEY) registerKey("sarvam", import.meta.env.VITE_SARVAM_API_KEY, "Environment (VITE_SARVAM_API_KEY)");
    if (import.meta.env.VITE_GEMINI_API_KEY) registerKey("gemini", import.meta.env.VITE_GEMINI_API_KEY, "Environment (VITE_GEMINI_API_KEY)");
    if (import.meta.env.VITE_OPENAI_API_KEY) registerKey("openai", import.meta.env.VITE_OPENAI_API_KEY, "Environment (VITE_OPENAI_API_KEY)");
    if (import.meta.env.VITE_GROQ_API_KEY) registerKey("groq", import.meta.env.VITE_GROQ_API_KEY, "Environment (VITE_GROQ_API_KEY)");
    if (import.meta.env.VITE_OPENROUTER_API_KEY) registerKey("openrouter", import.meta.env.VITE_OPENROUTER_API_KEY, "Environment (VITE_OPENROUTER_API_KEY)");
    if (import.meta.env.VITE_CLAUDE_API_KEY) registerKey("claude", import.meta.env.VITE_CLAUDE_API_KEY, "Environment (VITE_CLAUDE_API_KEY)");
    if (import.meta.env.VITE_DEEPSEEK_API_KEY) registerKey("deepseek", import.meta.env.VITE_DEEPSEEK_API_KEY, "Environment (VITE_DEEPSEEK_API_KEY)");
  }

  // 2. Shared App AI Chat / Prompt Analyzer storage
  try {
    const rawPrompt = localStorage.getItem(STORAGE_KEY_PROMPT);
    if (rawPrompt) {
      const parsed = JSON.parse(rawPrompt);
      if (parsed.sarvam) registerKey("sarvam", parsed.sarvam, "Shared App AI Chat (livetalk_ai_api_keys)");
      if (parsed.gemini) registerKey("gemini", parsed.gemini, "Shared App AI Chat (livetalk_ai_api_keys)");
      if (parsed.openai) registerKey("openai", parsed.openai, "Shared App AI Chat (livetalk_ai_api_keys)");
      if (parsed.groq) registerKey("groq", parsed.groq, "Shared App AI Chat (livetalk_ai_api_keys)");
      if (parsed.openrouter) registerKey("openrouter", parsed.openrouter, "Shared App AI Chat (livetalk_ai_api_keys)");
      if (parsed.claude) registerKey("claude", parsed.claude, "Shared App AI Chat (livetalk_ai_api_keys)");
      if (parsed.deepseek) registerKey("deepseek", parsed.deepseek, "Shared App AI Chat (livetalk_ai_api_keys)");
    }
  } catch {
    /* ignore error */
  }

  // 3. Studio local storage
  try {
    const rawStudio = localStorage.getItem(STORAGE_KEY_STUDIO);
    if (rawStudio) {
      const parsed = JSON.parse(rawStudio);
      if (parsed.sarvam) registerKey("sarvam", parsed.sarvam, "Code Studio Storage");
      if (parsed.gemini) registerKey("gemini", parsed.gemini, "Code Studio Storage");
      if (parsed.openai) registerKey("openai", parsed.openai, "Code Studio Storage");
      if (parsed.groq) registerKey("groq", parsed.groq, "Code Studio Storage");
      if (parsed.openrouter) registerKey("openrouter", parsed.openrouter, "Code Studio Storage");
      if (parsed.claude) registerKey("claude", parsed.claude, "Code Studio Storage");
      if (parsed.deepseek) registerKey("deepseek", parsed.deepseek, "Code Studio Storage");
    }
  } catch {
    /* ignore error */
  }

  // 4. Echo single API key fallback
  try {
    const singleEcho = localStorage.getItem(STORAGE_KEY_ECHO);
    if (singleEcho && singleEcho.trim()) {
      const detected = detectKeyProvider(singleEcho);
      if (detected.provider !== "unknown") {
        registerKey(detected.provider, singleEcho.trim(), "Echo AI Storage");
      }
    }
  } catch {
    /* ignore error */
  }

  // 5. Individual commonly used localStorage / sessionStorage keys
  const individualKeys: { keyName: string; provider?: AIProvider }[] = [
    { keyName: "sarvam_api_key", provider: "sarvam" },
    { keyName: "sarvam_key", provider: "sarvam" },
    { keyName: "groq_api_key", provider: "groq" },
    { keyName: "groq_key", provider: "groq" },
    { keyName: "gemini_api_key", provider: "gemini" },
    { keyName: "gemini_key", provider: "gemini" },
    { keyName: "google_api_key", provider: "gemini" },
    { keyName: "openai_api_key", provider: "openai" },
    { keyName: "open_ai_key", provider: "openai" },
    { keyName: "openai_key", provider: "openai" },
    { keyName: "openrouter_api_key", provider: "openrouter" },
    { keyName: "openrouter_key", provider: "openrouter" },
    { keyName: "claude_api_key", provider: "claude" },
    { keyName: "anthropic_api_key", provider: "claude" },
    { keyName: "deepseek_api_key", provider: "deepseek" },
  ];

  for (const item of individualKeys) {
    try {
      const val = localStorage.getItem(item.keyName) || sessionStorage.getItem(item.keyName);
      if (val && typeof val === "string" && val.trim()) {
        const detected = detectKeyProvider(val);
        const prov = item.provider || detected.provider;
        if (prov !== "unknown") {
          registerKey(prov, val.trim(), `Browser Storage (${item.keyName})`);
        }
      }
    } catch {
      /* ignore storage access error */
    }
  }

  // 6. Universal deep scan across all localStorage keys
  try {
    if (typeof localStorage !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        const val = localStorage.getItem(k);
        if (val && typeof val === "string") {
          // Check for signature strings
          const detected = detectKeyProvider(val);
          if (detected.provider !== "unknown" && !keys[detected.provider]) {
            registerKey(detected.provider, val.trim(), `Auto-Discovered (${k})`);
          }
        }
      }
    }
  } catch {
    /* ignore error */
  }

  // 7. URL query params (e.g. ?apiKey=... or ?sarvamKey=... or ?groqKey=...)
  try {
    if (typeof window !== "undefined" && window.location) {
      const searchStr = window.location.search || window.location.hash.split("?")[1] || "";
      if (searchStr) {
        const params = new URLSearchParams(searchStr);
        const urlKey = params.get("apiKey") || params.get("key");
        if (urlKey) {
          const detected = detectKeyProvider(urlKey);
          if (detected.provider !== "unknown") {
            registerKey(detected.provider, urlKey, "URL Query Parameter");
          }
        }
        if (params.get("sarvamKey")) registerKey("sarvam", params.get("sarvamKey")!, "URL Parameter (sarvamKey)");
        if (params.get("geminiKey")) registerKey("gemini", params.get("geminiKey")!, "URL Parameter (geminiKey)");
        if (params.get("openaiKey")) registerKey("openai", params.get("openaiKey")!, "URL Parameter (openaiKey)");
        if (params.get("groqKey")) registerKey("groq", params.get("groqKey")!, "URL Parameter (groqKey)");
        if (params.get("openrouterKey")) registerKey("openrouter", params.get("openrouterKey")!, "URL Parameter (openrouterKey)");
        if (params.get("claudeKey")) registerKey("claude", params.get("claudeKey")!, "URL Parameter (claudeKey)");
      }
    }
  } catch {
    /* ignore error */
  }

  return { keys, sources };
}

/**
 * Retrieve API Keys automatically aggregated from all sources.
 */
export function getAutoDetectedAPIKeys(): StudioAPIKeys {
  return scanAllKeySources().keys;
}

/**
 * Detect API Key directly from user's clipboard
 */
export async function detectKeyFromClipboard(): Promise<{
  success: boolean;
  provider?: AIProvider;
  displayName?: string;
  keyPreview?: string;
  message: string;
}> {
  try {
    if (typeof navigator === "undefined" || !navigator.clipboard || !navigator.clipboard.readText) {
      return {
        success: false,
        message: "Clipboard access is not supported by your browser.",
      };
    }

    const text = await navigator.clipboard.readText();
    const trimmed = text.trim();

    if (!trimmed) {
      return {
        success: false,
        message: "Clipboard is currently empty.",
      };
    }

    // Try parsing as JSON first (in case copied from an export)
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        let importedCount = 0;
        for (const prov of ["sarvam", "gemini", "openai", "groq", "openrouter", "claude", "deepseek"] as AIProvider[]) {
          if (parsed[prov] && typeof parsed[prov] === "string") {
            saveDetectedAPIKey(parsed[prov], prov);
            importedCount++;
          }
        }
        if (importedCount > 0) {
          return {
            success: true,
            message: `Successfully imported ${importedCount} API keys from clipboard JSON bundle!`,
          };
        }
      } catch {
        /* proceed to standard key detection */
      }
    }

    const detected = detectKeyProvider(trimmed);
    if (detected.provider === "unknown") {
      return {
        success: false,
        message: "Clipboard does not contain a recognized API key format (Sarvam AI, OpenAI, Gemini, Groq, OpenRouter, Claude, or DeepSeek).",
      };
    }

    saveDetectedAPIKey(trimmed, detected.provider);
    return {
      success: true,
      provider: detected.provider,
      displayName: detected.displayName,
      keyPreview: `••••${trimmed.slice(-4)}`,
      message: `Auto-detected and saved ${detected.displayName} key from clipboard!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Could not read clipboard. Please paste manually into the input box.",
    };
  }
}

/**
 * Save an API Key and auto-sync with shared storage
 */
export function saveDetectedAPIKey(rawKey: string, forcedProvider?: AIProvider): KeyDetectionResult {
  const detected = detectKeyProvider(rawKey);
  const provider = forcedProvider || (detected.provider !== "unknown" ? detected.provider : "gemini");

  const current = getAutoDetectedAPIKeys();
  current[provider] = rawKey.trim();

  try {
    localStorage.setItem(STORAGE_KEY_STUDIO, JSON.stringify(current));
    // Also sync to shared Prompt Analyzer storage so user doesn't have to re-enter
    localStorage.setItem(STORAGE_KEY_PROMPT, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent("code_studio_keys_updated", { detail: current }));
  } catch {
    /* ignore error */
  }

  return detected;
}

/**
 * Remove a specific key
 */
export function removeAPIKey(provider: AIProvider): void {
  const current = getAutoDetectedAPIKeys();
  delete current[provider];
  try {
    localStorage.setItem(STORAGE_KEY_STUDIO, JSON.stringify(current));
    localStorage.setItem(STORAGE_KEY_PROMPT, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent("code_studio_keys_updated", { detail: current }));
  } catch {
    /* ignore error */
  }
}

/**
 * Check if at least one active API key exists
 */
export function hasActiveAPIKey(): boolean {
  const keys = getAutoDetectedAPIKeys();
  return Boolean(keys.sarvam || keys.gemini || keys.openai || keys.groq || keys.openrouter || keys.claude || keys.deepseek);
}
