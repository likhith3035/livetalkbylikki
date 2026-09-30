import { describe, it, expect } from "vitest";
import { CODING_CHALLENGES } from "../features/code-studio/data/codingChallenges";
import { STARTER_TEMPLATES, CODE_TEMPLATES } from "../features/code-studio/data/codeTemplates";
import { SupportedLanguage } from "../features/code-studio/types";

describe("Code Studio Data Models & Challenges", () => {
  it("provides valid coding challenges with test cases", () => {
    expect(CODING_CHALLENGES.length).toBeGreaterThanOrEqual(5);

    for (const challenge of CODING_CHALLENGES) {
      expect(challenge.id).toBeTruthy();
      expect(challenge.title).toBeTruthy();
      expect(challenge.description).toBeTruthy();
      expect(challenge.functionName).toBeTruthy();
      expect(challenge.starterCode).toContain("function");
      expect(challenge.testCases.length).toBeGreaterThanOrEqual(2);

      for (const tc of challenge.testCases) {
        expect(tc.id).toBeTruthy();
        expect(Array.isArray(tc.input)).toBe(true);
        expect(tc.expected).toBeDefined();
      }
    }
  });

  it("covers distinct difficulty tiers and categories", () => {
    const difficulties = new Set(CODING_CHALLENGES.map((c) => c.difficulty));
    expect(difficulties.has("beginner")).toBe(true);
    expect(difficulties.has("intermediate")).toBe(true);
    expect(difficulties.has("advanced")).toBe(true);
  });

  it("provides starter templates for all 9 supported languages", () => {
    const languages: SupportedLanguage[] = [
      "javascript",
      "typescript",
      "python",
      "html",
      "css",
      "sql",
      "json",
      "cpp",
      "java",
    ];

    for (const lang of languages) {
      expect(STARTER_TEMPLATES[lang]).toBeTruthy();
      expect(STARTER_TEMPLATES[lang].length).toBeGreaterThan(10);
    }
  });

  it("supplies curated code template presets", () => {
    expect(CODE_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    for (const tpl of CODE_TEMPLATES) {
      expect(tpl.id).toBeTruthy();
      expect(tpl.title).toBeTruthy();
      expect(tpl.code).toBeTruthy();
    }
  });
});
