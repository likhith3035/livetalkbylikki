/**
 * Open Model Discovery & Auto-Recognition Service
 * Automatically detects, routes, and configures verified free and open-source models
 * (DeepSeek R1, Qwen 2.5 Coder, Llama 3.3, Mistral) when the "Open Models" option is enabled.
 */

export interface OpenModelDefinition {
  id: string;
  name: string;
  provider: "openrouter" | "groq" | "huggingface";
  contextWindow: number;
  isFree: boolean;
  specialty: "coding" | "reasoning" | "fast_chat" | "general";
  description: string;
  recommendedFor: string;
}

export const VERIFIED_OPEN_MODELS: OpenModelDefinition[] = [
  {
    id: "qwen/qwen-2.5-coder-32b-instruct",
    name: "Qwen 2.5 Coder 32B",
    provider: "openrouter",
    contextWindow: 32768,
    isFree: true,
    specialty: "coding",
    description: "Alibaba's top-tier open-source coding model with deep syntax & logic mastery.",
    recommendedFor: "Code generation, refactoring, algorithms & debugging",
  },
  {
    id: "deepseek/deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 (70B Distill)",
    provider: "groq",
    contextWindow: 128000,
    isFree: true,
    specialty: "reasoning",
    description: "Ultra-fast chain-of-thought open reasoning model for solving tricky bugs & edge cases.",
    recommendedFor: "Complex error explanations, edge cases & DSA problems",
  },
  {
    id: "meta-llama/llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    provider: "groq",
    contextWindow: 128000,
    isFree: true,
    specialty: "fast_chat",
    description: "Meta's flagship open model running on Groq LPU with 300+ tokens/sec speed.",
    recommendedFor: "Instant interactive chat, speed & quick explanations",
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    name: "Mistral 7B Instruct (Free)",
    provider: "openrouter",
    contextWindow: 32768,
    isFree: true,
    specialty: "general",
    description: "Reliable lightweight open model with zero cost on OpenRouter.",
    recommendedFor: "Beginner questions & standard syntax explanations",
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash (Free Tier)",
    provider: "openrouter",
    contextWindow: 1048576,
    isFree: true,
    specialty: "coding",
    description: "Massive 1M token context open endpoint with ultra-low latency.",
    recommendedFor: "Large file analysis & end-to-end documentation",
  },
];

const STORAGE_KEY_OPEN_MODELS = "code_studio_open_models_enabled";
const STORAGE_KEY_SELECTED_OPEN_MODEL = "code_studio_selected_open_model";

/**
 * Check if the user has enabled automatic Open Model routing
 */
export function isOpenModelsEnabled(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_OPEN_MODELS);
    // Default to true so users benefit from open models immediately
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

export interface OpenModelRecognitionResult {
  model: OpenModelDefinition;
  reason: string;
  badgeLabel: string;
  isZeroCost: boolean;
  speed: string;
}

/**
 * Toggle the Open Model mode.
 * When enabled, automatically recognizes the optimal model and saves it.
 */
export function setOpenModelsEnabled(enabled: boolean, hasGroq = false, hasOpenRouter = false): void {
  try {
    localStorage.setItem(STORAGE_KEY_OPEN_MODELS, String(enabled));
    if (enabled) {
      const recognized = autoRecognizeBestOpenModel(hasGroq, hasOpenRouter);
      setSelectedOpenModelId(recognized.id);
      window.dispatchEvent(
        new CustomEvent("code_studio_open_model_toggled", {
          detail: { enabled: true, recognizedModel: recognized },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("code_studio_open_model_toggled", { detail: { enabled: false } })
      );
    }
  } catch {
    /* ignore error */
  }
}

/**
 * Get the currently selected open model ID
 */
export function getSelectedOpenModelId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SELECTED_OPEN_MODEL);
    if (saved && VERIFIED_OPEN_MODELS.some((m) => m.id === saved)) {
      return saved;
    }
  } catch {
    /* ignore error */
  }
  return VERIFIED_OPEN_MODELS[0].id; // Default: Qwen 2.5 Coder
}

/**
 * Set the preferred open model ID
 */
export function setSelectedOpenModelId(modelId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_SELECTED_OPEN_MODEL, modelId);
  } catch {
    /* ignore error */
  }
}

/**
 * Automatically recognizes and selects the optimal open model
 * based on the user's available keys and intent.
 */
export function autoRecognizeBestOpenModel(hasGroqKey: boolean, hasOpenRouterKey: boolean): OpenModelDefinition {
  if (hasGroqKey) {
    // If Groq key is present, use DeepSeek R1 for reasoning or Llama 3.3 for lightning speeds
    const groqModel = VERIFIED_OPEN_MODELS.find((m) => m.provider === "groq");
    if (groqModel) return groqModel;
  }

  if (hasOpenRouterKey) {
    // OpenRouter has full access to Qwen 2.5 Coder
    const qwen = VERIFIED_OPEN_MODELS.find((m) => m.id.includes("qwen"));
    if (qwen) return qwen;
  }

  // Fallback to highest quality open coding model
  return VERIFIED_OPEN_MODELS[0];
}

/**
 * Advanced context-aware open model recognition engine.
 * Automatically identifies the best model by analyzing:
 * - Available keys (Groq LPU vs OpenRouter endpoints)
 * - Active action (error debugging vs coding vs explanation)
 * - Programming language (algorithmic DSA vs web preview)
 */
export function autoRecognizeOpenModel(
  hasGroqKey: boolean,
  hasOpenRouterKey: boolean,
  taskContext?: { action?: string; language?: string }
): OpenModelRecognitionResult {
  const action = taskContext?.action;
  const lang = taskContext?.language;

  // 1. Error Debugging & Algorithmic edge cases -> DeepSeek R1 Chain-of-Thought
  if (action === "fix_error" || action === "generate_tests" || lang === "cpp" || lang === "java") {
    const deepseek = VERIFIED_OPEN_MODELS.find((m) => m.id.includes("deepseek-r1")) || VERIFIED_OPEN_MODELS[1];
    return {
      model: deepseek,
      reason: "Auto-recognized DeepSeek R1 for deep chain-of-thought logic & error diagnosis",
      badgeLabel: "DeepSeek R1 (Reasoning)",
      isZeroCost: true,
      speed: "Ultra-Fast (Groq LPU)",
    };
  }

  // 2. High-speed explanation or custom chat -> Llama 3.3 70B
  if (action === "explain" || action === "custom_chat") {
    const llama = VERIFIED_OPEN_MODELS.find((m) => m.id.includes("llama-3.3")) || VERIFIED_OPEN_MODELS[2];
    return {
      model: llama,
      reason: "Auto-recognized Llama 3.3 70B for instant line-by-line explanation",
      badgeLabel: "Llama 3.3 (300+ tok/s)",
      isZeroCost: true,
      speed: "300+ tok/sec",
    };
  }

  // 3. Coding, optimization, or web/DOM development -> Qwen 2.5 Coder 32B
  const qwen = VERIFIED_OPEN_MODELS.find((m) => m.id.includes("qwen")) || VERIFIED_OPEN_MODELS[0];
  return {
    model: qwen,
    reason: "Auto-recognized Qwen 2.5 Coder 32B (Top-tier open-source coding weights)",
    badgeLabel: "Qwen 2.5 Coder 32B",
    isZeroCost: true,
    speed: "High Speed",
  };
}
