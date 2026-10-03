import { describe, it, expect } from "vitest";
import {
  areValuesEqual,
  executeCode,
  runChallengeTests,
  buildHtmlPreviewDocument,
  transpileTypeScriptToJS,
  formatSqlTable,
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

  it("transpiles complex TypeScript code to runnable JavaScript", () => {
    const tsCode = `
      interface User {
        id: string;
        name: string;
      }
      enum Status {
        Active = 1,
        Inactive = 0
      }
      function getGreeting<T extends User>(user: T): string {
        return "Hello, " + user.name;
      }
      const u: User = { id: "1", name: "Alice" };
      console.log(getGreeting(u));
    `;

    const js = transpileTypeScriptToJS(tsCode);
    expect(js).not.toContain("interface User");
    expect(js).toContain("const Status");
    expect(js).toContain("function getGreeting(user)");
  });

  it("executes TypeScript code with interfaces, types, and generics seamlessly", async () => {
    const tsCode = `
      interface ScoreRecord {
        points: number;
      }
      function computeTotal<T extends ScoreRecord>(items: T[]): number {
        return items.reduce((acc, curr) => acc + curr.points, 0);
      }
      const data: ScoreRecord[] = [{ points: 10 }, { points: 25 }];
      console.log("Computed Total:", computeTotal(data));
    `;

    const result = await executeCode(tsCode, "typescript");
    expect(result.success).toBe(true);
    expect(result.logs.some((l) => l.message.includes("Computed Total: 35"))).toBe(true);
  });

  it("formats pipe-delimited SQLite output into clean ASCII table", () => {
    const rawSql = "id|name|xp\n1|Alice|100\n2|Bob|250";
    const formatted = formatSqlTable(rawSql);
    expect(formatted).toContain("┌");
    expect(formatted).toContain("Alice");
    expect(formatted).toContain("Bob");
    expect(formatted).toContain("┘");
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
    expect(result.logs.some((l) => l.message.includes("Sum: 15") || l.message.includes("15"))).toBe(true);
  }, 15000);

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
  }, 15000);

  it("executes SQL queries with tabular formatted output", async () => {
    const sqlCode = `
      CREATE TABLE users (id INT, name TEXT, age INT);
      INSERT INTO users VALUES (1, 'Alice', 25);
      SELECT name, age FROM users WHERE age > 21;
    `;

    const result = await executeCode(sqlCode, "sql");
    expect(result.success).toBe(true);
    expect(result.logs.some((l) => l.message.includes("Alice") || l.message.includes("Query Result") || l.message.includes("┌"))).toBe(true);
  }, 15000);

  it("injects parent bridge script into HTML live preview", () => {
    const html = `<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>`;
    const injected = buildHtmlPreviewDocument(html);
    expect(injected).toContain("code-studio-preview");
    expect(injected).toContain("postMessage");
  });
});
