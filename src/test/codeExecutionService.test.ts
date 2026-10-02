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

  it("runs challenge automated test cases and computes pass rate with solutionCode", async () => {
    const twoSumChallenge = CODING_CHALLENGES.find((c) => c.id === "two-sum")!;
    expect(twoSumChallenge).toBeDefined();

    // 1. Solution code must pass 100% of test cases
    const solCode = twoSumChallenge.solutionCode || twoSumChallenge.starterCode;
    const result = await runChallengeTests(solCode, twoSumChallenge);
    expect(result.success).toBe(true);
    expect(result.testsPassed).toBe(twoSumChallenge.testCases.length);
    expect(result.totalTests).toBe(twoSumChallenge.testCases.length);
    expect(result.testResults?.length).toBe(twoSumChallenge.testCases.length);
    expect(result.testResults?.every((tr) => tr.passed)).toBe(true);

    // 2. Fresh starter code should not pass before user writes implementation
    const starterResult = await runChallengeTests(twoSumChallenge.starterCode, twoSumChallenge);
    expect(starterResult.success).toBe(false);
  });

  it("safely detects and halts infinite loops using runtime guard", async () => {
    const infiniteLoopCode = `
      let count = 0;
      while (true) {
        count++;
      }
    `;

    const result = await executeCode(infiniteLoopCode, "javascript");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Infinite loop detected");
  });

  it("executes C++ competitive programming code cleanly", async () => {
    const cppCode = `
      #include <iostream>
      #include <vector>
      #include <numeric>
      using namespace std;
      int main() {
        vector<int> nums = {1, 2, 3, 4, 5};
        int sum = accumulate(nums.begin(), nums.end(), 0);
        cout << "Sum: " << sum << endl;
        return 0;
      }
    `;

    const result = await executeCode(cppCode, "cpp");
    expect(result.success).toBe(true);
    expect(result.logs.some((l) => l.message.includes("Sum: 15"))).toBe(true);
  });

  it("executes Java standard code cleanly", async () => {
    const javaCode = `
      public class Main {
        public static void main(String[] args) {
          System.out.println("Java 21 Virtual Threads Ready");
        }
      }
    `;

    const result = await executeCode(javaCode, "java");
    expect(result.success).toBe(true);
    expect(result.logs.some((l) => l.message.includes("Java 21 Virtual Threads Ready"))).toBe(true);
  });

  it("executes SQL queries with tabular formatted output", async () => {
    const sqlCode = `
      SELECT name, age FROM users WHERE age > 21;
    `;

    const result = await executeCode(sqlCode, "sql");
    expect(result.success).toBe(true);
    expect(result.logs.some((l) => l.message.includes("Query returned") || l.message.includes("Query Result"))).toBe(true);
  });

  it("injects parent bridge script into HTML live preview", () => {
    const html = `<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>`;
    const injected = buildHtmlPreviewDocument(html);
    expect(injected).toContain("code-studio-preview");
    expect(injected).toContain("postMessage");
  });
});
