import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateGhostCompletion,
  generateInlineEdit,
} from "../features/code-studio/services/copilotService";

describe("GitHub Copilot & Cursor-style AI Assistance Engine", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides instant Python ghost-completion for function definition", async () => {
    const code = "def is_prime(n):";
    const res = await generateGhostCompletion({
      code,
      language: "python",
      cursorOffset: code.length,
    });

    expect(res).toContain("if n <= 1:");
    expect(res).toContain("return False");
  });

  it("provides instant JavaScript ghost-completion for isPrime", async () => {
    const code = "function isPrime(n) {";
    const res = await generateGhostCompletion({
      code,
      language: "javascript",
      cursorOffset: code.length,
    });

    expect(res).toContain("if (n <= 1) return false;");
    expect(res).toContain("return true;");
  });

  it("provides instant C++ ghost-completion for int main", async () => {
    const code = "int main() {";
    const res = await generateGhostCompletion({
      code,
      language: "cpp",
      cursorOffset: code.length,
    });

    expect(res).toContain("return 0;");
  });

  it("handles empty or whitespace lines by returning empty completion", async () => {
    const code = "def foo():\n    ";
    const res = await generateGhostCompletion({
      code,
      language: "python",
      cursorOffset: code.length,
    });

    expect(res).toBe("");
  });

  it("executes inline Ctrl+K edit with smart fallback", async () => {
    const originalCode = `function add(a, b) { return a + b; }`;
    const res = await generateInlineEdit({
      prompt: "Add type checking",
      code: originalCode,
      language: "javascript",
    });

    expect(res.modifiedCode).toBeDefined();
    expect(res.diffSummary).toBeDefined();
    expect(res.explanation).toBeDefined();
  });
});
