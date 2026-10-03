import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  analyzeCodeOfflineHeuristic,
  requestAICodeAssistance,
} from "../features/code-studio/services/aiCodingService";

describe("AI Coding Assistant & Error Diagnostics Service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fixes runtime null-reference error via offline heuristic engine", () => {
    const brokenCode = `function getItem(user) { return user.profile.name; }`;
    const res = analyzeCodeOfflineHeuristic({
      action: "fix_error",
      code: brokenCode,
      language: "javascript",
      errorMessage: "Cannot read property of null (reading 'profile')",
    });

    expect(res.summary).toContain("Fixed");
    expect(res.detailedExplanation).toContain("null reference");
    expect(res.suggestedCode).toContain("?.");
    expect(res.keyTakeaways.length).toBeGreaterThanOrEqual(1);
    expect(res.provider).toBe("offline");
  });

  it("explains code structure and estimates Big-O complexity offline", () => {
    const loopCode = `
      function sumArr(nums) {
        let total = 0;
        for (let i = 0; i < nums.length; i++) {
          total += nums[i];
        }
        return total;
      }
    `;

    const res = analyzeCodeOfflineHeuristic({
      action: "explain",
      code: loopCode,
      language: "javascript",
    });

    expect(res.timeComplexity).toBe("O(n)");
    expect(res.detailedExplanation).toContain("Structure");
    expect(res.keyTakeaways.length).toBeGreaterThanOrEqual(2);
  });

  it("provides code optimization heuristics", () => {
    const unoptimizedCode = `
      function findDuplicates(arr) {
        const res = [];
        for (let i = 0; i < arr.length; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j]) res.push(arr[i]);
          }
        }
        return res;
      }
    `;

    const res = analyzeCodeOfflineHeuristic({
      action: "optimize",
      code: unoptimizedCode,
      language: "javascript",
    });

    expect(res.summary).toContain("Optimization");
    expect(res.keyTakeaways.some((t) => t.includes("hash") || t.includes("pass"))).toBe(true);
  });

  it("executes requestAICodeAssistance with zero errors using offline fallback", async () => {
    const res = await requestAICodeAssistance({
      action: "explain",
      code: "const a = 1;",
      language: "javascript",
    });

    expect(res).toBeDefined();
    expect(res.summary).toBeTruthy();
    expect(res.detailedExplanation).toBeTruthy();
  });

  it("prioritizes and calls Sarvam AI when sarvam key is configured", async () => {
    localStorage.setItem("livetalk_ai_api_keys", JSON.stringify({ sarvam: "sarvam_mock_key_123" }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: "Optimized with Sarvam AI",
                detailedExplanation: "Sarvam 105B analyzed the loop and optimized memory.",
                suggestedCode: "const a = 2;",
                timeComplexity: "O(1)",
                spaceComplexity: "O(1)",
                keyTakeaways: ["Efficient O(1) approach"],
              }),
            },
          },
        ],
      }),
    });

    const origFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as any;

    try {
      const res = await requestAICodeAssistance({
        action: "optimize",
        code: "const a = 1;",
        language: "javascript",
      });

      expect(res.summary).toContain("Optimized with Sarvam AI");
      expect(res.provider).toContain("Sarvam AI");
      expect(res.usedModel).toContain("sarvam-105b");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.sarvam.ai/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "api-subscription-key": "sarvam_mock_key_123",
          }),
        })
      );
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});
