import { describe, it, expect, beforeEach } from "vitest";
import {
  detectKeyProvider,
  saveDetectedAPIKey,
  getAutoDetectedAPIKeys,
  removeAPIKey,
} from "../features/code-studio/services/apiKeyDetectionService";
import {
  isOpenModelsEnabled,
  setOpenModelsEnabled,
  autoRecognizeBestOpenModel,
  VERIFIED_OPEN_MODELS,
} from "../features/code-studio/services/openModelService";

describe("API Key Auto-Detection Service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("accurately detects Google Gemini API key by AIzaSy prefix", () => {
    const res = detectKeyProvider("AIzaSyD-dummy_test_gemini_key_123");
    expect(res.provider).toBe("gemini");
    expect(res.displayName).toContain("Gemini");
    expect(res.confidence).toBe("high");
  });

  it("accurately detects Groq Cloud API key by gsk_ prefix", () => {
    const res = detectKeyProvider("gsk_testGroqKey1234567890abcdef");
    expect(res.provider).toBe("groq");
    expect(res.displayName).toContain("Groq");
    expect(res.confidence).toBe("high");
  });

  it("accurately detects OpenRouter key by sk-or-v1- prefix", () => {
    const res = detectKeyProvider("sk-or-v1-abcdef1234567890");
    expect(res.provider).toBe("openrouter");
    expect(res.displayName).toContain("OpenRouter");
    expect(res.confidence).toBe("high");
  });

  it("accurately detects Anthropic Claude key by sk-ant- prefix", () => {
    const res = detectKeyProvider("sk-ant-api03-abcdef123456");
    expect(res.provider).toBe("claude");
    expect(res.displayName).toContain("Claude");
    expect(res.confidence).toBe("high");
  });

  it("accurately detects OpenAI key by sk-proj- prefix", () => {
    const res = detectKeyProvider("sk-proj-testOpenAIKeyLongString12345678901234567890");
    expect(res.provider).toBe("openai");
    expect(res.displayName).toContain("OpenAI");
    expect(res.confidence).toBe("high");
  });

  it("accurately detects Sarvam AI key by sarvam_ prefix or 32-hex format", () => {
    const resPrefix = detectKeyProvider("sarvam_secret_test_key_123");
    expect(resPrefix.provider).toBe("sarvam");
    expect(resPrefix.displayName).toContain("Sarvam AI");
    expect(resPrefix.confidence).toBe("high");

    const resHex = detectKeyProvider("a1b2c3d4e5f678901234567890abcdef");
    expect(resHex.provider).toBe("sarvam");
    expect(resHex.displayName).toContain("Sarvam AI");
    expect(resHex.confidence).toBe("high");
  });

  it("saves detected key into both studio and shared BYOK storage seamlessly", () => {
    saveDetectedAPIKey("AIzaSyFakeKey999");
    const stored = getAutoDetectedAPIKeys();
    expect(stored.gemini).toBe("AIzaSyFakeKey999");

    // Also check shared storage
    const sharedRaw = localStorage.getItem("livetalk_ai_api_keys");
    expect(sharedRaw).toContain("AIzaSyFakeKey999");
  });

  it("removes API key properly", () => {
    saveDetectedAPIKey("gsk_fakeGroqKey123");
    let stored = getAutoDetectedAPIKeys();
    expect(stored.groq).toBe("gsk_fakeGroqKey123");

    removeAPIKey("groq");
    stored = getAutoDetectedAPIKeys();
    expect(stored.groq).toBeUndefined();
  });
});

describe("Open Model Discovery Service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults open models to enabled for zero-friction open AI coding", () => {
    expect(isOpenModelsEnabled()).toBe(true);
    setOpenModelsEnabled(false);
    expect(isOpenModelsEnabled()).toBe(false);
    setOpenModelsEnabled(true);
    expect(isOpenModelsEnabled()).toBe(true);
  });

  it("contains verified open-source coding models", () => {
    expect(VERIFIED_OPEN_MODELS.length).toBeGreaterThanOrEqual(4);
    const hasQwen = VERIFIED_OPEN_MODELS.some((m) => m.name.includes("Qwen"));
    const hasDeepSeek = VERIFIED_OPEN_MODELS.some((m) => m.name.includes("DeepSeek"));
    expect(hasQwen).toBe(true);
    expect(hasDeepSeek).toBe(true);
  });

  it("auto-recognizes optimal open model based on available keys", () => {
    const bestWithGroq = autoRecognizeBestOpenModel(true, false);
    expect(bestWithGroq.provider).toBe("groq");

    const bestWithOpenRouter = autoRecognizeBestOpenModel(false, true);
    expect(bestWithOpenRouter.id).toContain("qwen");
  });
});
