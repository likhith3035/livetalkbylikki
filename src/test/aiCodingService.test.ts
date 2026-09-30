import { describe, it, expect, beforeEach } from "vitest";
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
});
