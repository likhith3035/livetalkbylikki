import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  detectKeyProvider,
  getAutoDetectedAPIKeys,
  saveDetectedAPIKey,
  removeAPIKey,
  hasActiveAPIKey,
  scanAllKeySources,
  detectKeyFromClipboard,
} from "@/features/code-studio/services/apiKeyDetectionService";
import {
  isOpenModelsEnabled,
  setOpenModelsEnabled,
  getSelectedOpenModelId,
  setSelectedOpenModelId,
  autoRecognizeBestOpenModel,
  autoRecognizeOpenModel,
  VERIFIED_OPEN_MODELS,
} from "@/features/code-studio/services/openModelService";
import { CODING_CHALLENGES } from "@/features/code-studio/data/codingChallenges";
import { runChallengeTests, executeCode } from "@/features/code-studio/services/codeExecutionService";

describe("Code Studio Complete Features & Resiliency Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe("API Key Auto-Detection Across Multiple Sources", () => {
    it("detects providers by key prefix format with high confidence", () => {
      expect(detectKeyProvider("AIzaSyB1234567890abcdef").provider).toBe("gemini");
      expect(detectKeyProvider("gsk_ultraFastGroqKey123456").provider).toBe("groq");
      expect(detectKeyProvider("sk-or-v1-openrouterToken999").provider).toBe("openrouter");
      expect(detectKeyProvider("sk-ant-claudeEnterpriseKey").provider).toBe("claude");
      expect(detectKeyProvider("sk-proj-openaiStandardKey0000000000000000000000000").provider).toBe("openai");
      expect(detectKeyProvider("sk-32charsdeepseekkey123456789012").provider).toBe("deepseek");
    });

    it("scans and auto-detects keys from shared app storage (livetalk_ai_api_keys)", () => {
      localStorage.setItem(
        "livetalk_ai_api_keys",
        JSON.stringify({
          gemini: "AIzaSySharedKey",
          groq: "gsk_sharedGroqKey",
        })
      );

      const { keys, sources } = scanAllKeySources();
      expect(keys.gemini).toBe("AIzaSySharedKey");
      expect(keys.groq).toBe("gsk_sharedGroqKey");
      expect(sources.some((s) => s.sourceName.includes("livetalk_ai_api_keys"))).toBe(true);
    });

    it("scans and discovers individual storage keys (e.g. groq_api_key, openai_api_key)", () => {
      localStorage.setItem("groq_api_key", "gsk_standaloneKey");
      sessionStorage.setItem("openai_key", "sk-proj-sessionOpenAIKey000000000000000000000000");

      const { keys, sources } = scanAllKeySources();
      expect(keys.groq).toBe("gsk_standaloneKey");
      expect(keys.openai).toBe("sk-proj-sessionOpenAIKey000000000000000000000000");
      expect(sources.some((s) => s.provider === "groq")).toBe(true);
    });

    it("detects and imports key from clipboard seamlessly", async () => {
      // Mock clipboard API
      const mockClipboard = {
        readText: vi.fn().mockResolvedValue("gsk_clipboardDetectedGroqKey123"),
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      const result = await detectKeyFromClipboard();
      expect(result.success).toBe(true);
      expect(result.provider).toBe("groq");

      const savedKeys = getAutoDetectedAPIKeys();
      expect(savedKeys.groq).toBe("gsk_clipboardDetectedGroqKey123");
    });

    it("handles clipboard JSON bundle import", async () => {
      const bundle = JSON.stringify({
        gemini: "AIzaSyBundleGemini",
        openai: "sk-proj-BundleOpenAIKey00000000000000000000000",
      });
      const mockClipboard = {
        readText: vi.fn().mockResolvedValue(bundle),
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      const result = await detectKeyFromClipboard();
      expect(result.success).toBe(true);
      expect(result.message).toContain("Successfully imported 2 API keys");

      const keys = getAutoDetectedAPIKeys();
      expect(keys.gemini).toBe("AIzaSyBundleGemini");
      expect(keys.openai).toBe("sk-proj-BundleOpenAIKey00000000000000000000000");
    });
  });

  describe("Open Model Auto-Recognition Engine", () => {
    it("recognizes open models toggle state and defaults to active", () => {
      expect(isOpenModelsEnabled()).toBe(true);
      setOpenModelsEnabled(false);
      expect(isOpenModelsEnabled()).toBe(false);
      setOpenModelsEnabled(true);
      expect(isOpenModelsEnabled()).toBe(true);
    });

    it("auto-recognizes DeepSeek R1 for error debugging and reasoning tasks", () => {
      const recognition = autoRecognizeOpenModel(true, false, { action: "fix_error" });
      expect(recognition.model.id).toContain("deepseek-r1");
      expect(recognition.badgeLabel).toContain("DeepSeek R1");
      expect(recognition.isZeroCost).toBe(true);
    });

    it("auto-recognizes Llama 3.3 for explanation and conversational chat", () => {
      const recognition = autoRecognizeOpenModel(true, false, { action: "explain" });
      expect(recognition.model.id).toContain("llama-3.3");
      expect(recognition.speed).toContain("300+ tok/sec");
    });

    it("auto-recognizes Qwen 2.5 Coder for coding, syntax, and algorithms", () => {
      const recognition = autoRecognizeOpenModel(false, true, { action: "coding", language: "javascript" });
      expect(recognition.model.id).toContain("qwen");
      expect(recognition.badgeLabel).toContain("Qwen 2.5 Coder");
    });

    it("provides verified open models list with valid descriptions and context sizes", () => {
      expect(VERIFIED_OPEN_MODELS.length).toBeGreaterThanOrEqual(4);
      VERIFIED_OPEN_MODELS.forEach((m) => {
        expect(m.id).toBeTruthy();
        expect(m.name).toBeTruthy();
        expect(m.contextWindow).toBeGreaterThan(16000);
        expect(m.isFree).toBe(true);
      });
    });
  });

  describe("Practice Challenges & Test Runner Assertions", () => {
    it("runs Two Sum challenge and passes all test cases for correct implementation", async () => {
      const twoSum = CODING_CHALLENGES.find((c) => c.id === "two-sum");
      expect(twoSum).toBeDefined();

      const correctSolution = `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
      `;

      const result = await runChallengeTests(correctSolution, twoSum!);
      expect(result.success).toBe(true);
      expect(result.testsPassed).toBe(result.totalTests);
      expect(result.testResults?.every((tc) => tc.passed)).toBe(true);
    });

    it("catches incorrect return values and reports failing test cases", async () => {
      const twoSum = CODING_CHALLENGES.find((c) => c.id === "two-sum");
      const badSolution = `
function twoSum(nums, target) {
  return [0, 0];
}
      `;

      const result = await runChallengeTests(badSolution, twoSum!);
      expect(result.success).toBe(false);
      expect(result.testsPassed).toBeLessThan(result.totalTests!);
    });

    it("executes code safely and captures stdout/stderr logs", async () => {
      const code = `
console.log("Hello from sandbox");
console.warn("Watch out");
console.error("Critical warning");
      `;

      const result = await executeCode(code, "javascript");
      expect(result.success).toBe(true);
      expect(result.logs.length).toBe(3);
      expect(result.logs[0].message).toBe("Hello from sandbox");
      expect(result.logs[1].type).toBe("warn");
      expect(result.logs[2].type).toBe("error");
    });
  });
});
