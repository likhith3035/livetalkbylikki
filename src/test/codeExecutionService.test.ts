import { describe, it, expect } from "vitest";
import {
  areValuesEqual,
  executeCode,
  runChallengeTests,
  buildHtmlPreviewDocument,
} from "../features/code-studio/services/codeExecutionService";
import { CODING_CHALLENGES } from "../features/code-studio/data/codingChallenges";

describe("Sandboxed Code Execution Engine", () => {
  it("compares deep equality accurately for test results", () => {
    expect(areValuesEqual([0, 1], [0, 1])).toBe(true);
    expect(areValuesEqual([1, 2], [2, 1])).toBe(false);
    expect(areValuesEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] })).toBe(true);
    expect(areValuesEqual(42, 42)).toBe(true);
    expect(areValuesEqual("hello", "hello")).toBe(true);
    expect(areValuesEqual(null, null)).toBe(true);
    expect(areValuesEqual(null, undefined)).toBe(false);
  });

  it("executes valid JavaScript and intercepts console logs", async () => {
    const code = `
      const x = 10;
      const y = 20;
      console.log("Sum result is:", x + y);
    `;

    const result = await executeCode(code, "javascript");
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(result.logs.length).toBeGreaterThanOrEqual(1);
    expect(result.logs[0].message).toContain("Sum result is: 30");
  });

  it("catches runtime errors gracefully with accurate line details", async () => {
    const brokenCode = `
      const obj = null;
      obj.someMethod();
    `;

    const result = await executeCode(brokenCode, "javascript");
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.logs.some((l) => l.type === "error")).toBe(true);
  });

  it("runs challenge automated test cases and computes pass rate", async () => {
    const twoSumChallenge = CODING_CHALLENGES.find((c) => c.id === "two-sum")!;
    expect(twoSumChallenge).toBeDefined();

    const result = await runChallengeTests(twoSumChallenge.starterCode, twoSumChallenge);
    expect(result.success).toBe(true);
    expect(result.testsPassed).toBe(twoSumChallenge.testCases.length);
    expect(result.totalTests).toBe(twoSumChallenge.testCases.length);
    expect(result.testResults?.length).toBe(twoSumChallenge.testCases.length);
    expect(result.testResults?.every((tr) => tr.passed)).toBe(true);
  });

  it("injects parent bridge script into HTML live preview", () => {
    const html = `<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>`;
    const injected = buildHtmlPreviewDocument(html);
    expect(injected).toContain("code-studio-preview");
    expect(injected).toContain("postMessage");
  });
});
