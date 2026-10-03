/**
 * GitHub Copilot & Cursor-style AI Assistance Engine
 * Provides:
 * 1. Ghost-Text Inline Autocomplete (Tab to accept, Esc to dismiss)
 * 2. Ctrl+K Inline Code Generation & Refactoring with Diff Preview
 * 3. Selection-Aware Quick Actions (Explain, Optimize, Fix, Add Types)
 */

import { SupportedLanguage } from "../types";
import { getAutoDetectedAPIKeys } from "./apiKeyDetectionService";
import { requestAICodeAssistance } from "./aiCodingService";

export interface GhostCompletionRequest {
  code: string;
  language: SupportedLanguage;
  cursorOffset: number;
  signal?: AbortSignal;
}

export interface InlineEditRequest {
  prompt: string;
  code: string;
  selectedText?: string;
  selectionStart?: number;
  selectionEnd?: number;
  language: SupportedLanguage;
}

export interface InlineEditResponse {
  modifiedCode: string;
  explanation: string;
  diffSummary: string;
  model: string;
}

/**
 * Intelligent Offline Syntactic Heuristics for Instant Ghost Completions (0ms latency)
 */
function getOfflineGhostSuggestion(prefix: string, language: SupportedLanguage): string {
  const trimmedPrefix = prefix.trimEnd();
  const lastLine = trimmedPrefix.split("\n").pop() || "";
  const trimmedLastLine = lastLine.trim();

  // --- Python Completions ---
  if (language === "python") {
    if (trimmedLastLine === "def is_prime(n):") {
      return "\n    if n <= 1:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True";
    }
    if (trimmedLastLine.startsWith("def binary_search(")) {
      return "arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: low = mid + 1\n        else: high = mid - 1\n    return -1";
    }
    if (trimmedLastLine.startsWith("def ") && trimmedLastLine.endsWith(":")) {
      return "\n    # TODO: Implement logic\n    pass";
    }
    if (trimmedLastLine.startsWith("for i in range(") && trimmedLastLine.endsWith(":")) {
      return "\n    print(i)";
    }
    if (trimmedLastLine === "if __name__ ==") {
      return ' "__main__":\n    main()';
    }
    if (trimmedLastLine === "try:") {
      return "\n    pass\nexcept Exception as e:\n    print(f'Error: {e}')";
    }
    if (trimmedLastLine.endsWith("print(")) {
      return '"Result:", ans)';
    }
    if (trimmedLastLine === "num = int(input(") {
      return '"Enter number: "))';
    }
  }

  // --- JavaScript / TypeScript Completions ---
  if (language === "javascript" || language === "typescript") {
    if (trimmedLastLine.startsWith("function isPrime(") && trimmedLastLine.endsWith("{")) {
      return "\n  if (n <= 1) return false;\n  for (let i = 2; i <= Math.sqrt(n); i++) {\n    if (n % i === 0) return false;\n  }\n  return true;\n}";
    }
    if (trimmedLastLine.startsWith("const binarySearch =")) {
      return " (arr, target) => {\n  let left = 0, right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n};";
    }
    if (trimmedLastLine === "console.log(") {
      return '"Output:", result);';
    }
    if (trimmedLastLine === "try {") {
      return "\n  // execute\n} catch (error) {\n  console.error(error);\n}";
    }
    if (trimmedLastLine.endsWith(".map((")) {
      return "item, idx) => item * 2);";
    }
    if (trimmedLastLine.endsWith(".filter((")) {
      return "item) => Boolean(item));";
    }
  }

  // --- C++ Completions ---
  if (language === "cpp") {
    if (trimmedLastLine === "#include") {
      return " <iostream>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;";
    }
    if (trimmedLastLine.startsWith("int main(") && trimmedLastLine.endsWith("{")) {
      return "\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    cout << \"Hello World!\" << endl;\n    return 0;\n}";
    }
    if (trimmedLastLine === "cout <<") {
      return ' "Result: " << ans << endl;';
    }
    if (trimmedLastLine.startsWith("for (int i = 0;")) {
      return " i < n; i++) {\n        \n    }";
    }
  }

  // --- Java Completions ---
  if (language === "java") {
    if (trimmedLastLine.startsWith("public static void main(") && trimmedLastLine.endsWith("{")) {
      return '\n        System.out.println("Hello, World!");\n    }';
    }
    if (trimmedLastLine === "System.out.println(") {
      return '"Result: " + result);';
    }
  }

  // --- SQL Completions ---
  if (language === "sql") {
    if (trimmedLastLine === "SELECT") {
      return " * FROM users WHERE active = 1 ORDER BY id DESC LIMIT 10;";
    }
    if (trimmedLastLine.endsWith("CREATE TABLE")) {
      return " items (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);";
    }
  }

  return "";
}

/**
 * Generate Ghost Text Completion
 * Priority: Connected LLM (Sarvam / Groq / Gemini / OpenAI) -> Instant Heuristics
 */
export async function generateGhostCompletion(
  req: GhostCompletionRequest
): Promise<string> {
  const { code, language, cursorOffset, signal } = req;
  const prefix = code.substring(0, cursorOffset);
  const suffix = code.substring(cursorOffset);

  // If line is empty or too short, return heuristic or empty
  const lastLine = prefix.split("\n").pop() || "";
  if (!lastLine.trim()) return "";

  const keys = getAutoDetectedAPIKeys();

  // If user has Sarvam AI, Groq, Gemini, or OpenAI, try ultra-fast LLM completion
  const activeKey = keys.sarvam || keys.groq || keys.gemini || keys.openai || keys.openrouter;

  if (activeKey && lastLine.trim().length >= 4) {
    try {
      // Fast prompt for inline continuation only
      const userPrompt = `You are a real-time inline code completion engine (like GitHub Copilot).
Given the code prefix and suffix in ${language.toUpperCase()}, provide ONLY the immediate next 1-4 lines of code continuation at the cursor.
CRITICAL: Do NOT wrap in markdown code blocks. Do NOT include explanations. Return pure code continuation text only.

Code Before Cursor:
\`\`\`${language}
${prefix.slice(-600)}
\`\`\`

Code After Cursor:
\`\`\`${language}
${suffix.slice(0, 200)}
\`\`\`

Immediate continuation at cursor:`;

      if (keys.sarvam) {
        const cleanKey = keys.sarvam.replace(/^Bearer\s+/i, "").trim();
        const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-subscription-key": cleanKey,
            Authorization: `Bearer ${cleanKey}`,
          },
          body: JSON.stringify({
            model: "sarvam-105b-conversations",
            messages: [{ role: "user", content: userPrompt }],
            temperature: 0.1,
            max_tokens: 60,
          }),
          signal,
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || "";
          const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trimEnd();
          if (cleaned) return cleaned;
        }
      } else if (keys.groq) {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keys.groq}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: userPrompt }],
            temperature: 0.1,
            max_tokens: 60,
          }),
          signal,
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || "";
          const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trimEnd();
          if (cleaned) return cleaned;
        }
      }
    } catch {
      // Fallback silently to heuristics on network/abort
    }
  }

  // Fast offline heuristic fallback
  return getOfflineGhostSuggestion(prefix, language);
}

/**
 * Execute Ctrl+K Inline Edit Instruction
 */
export async function generateInlineEdit(req: InlineEditRequest): Promise<InlineEditResponse> {
  const { prompt, code, selectedText, language } = req;

  const targetCode = selectedText && selectedText.trim() ? selectedText : code;

  // Use the full multi-provider AI waterfall (Sarvam 105B / Groq / OpenRouter / Gemini / OpenAI)
  const aiRes = await requestAICodeAssistance({
    action: "custom_chat",
    code: targetCode,
    language,
    userPrompt: `Inline Edit Request (like GitHub Copilot / Cursor Cmd+K):\n${prompt}\n\nPlease modify or generate the code to satisfy this instruction. Return the modified code cleanly.`,
  });

  const modified = aiRes.suggestedCode || targetCode;

  // If a specific section was highlighted, replace just that slice in full code
  let fullModified = modified;
  if (selectedText && selectedText.trim() && req.selectionStart !== undefined && req.selectionEnd !== undefined) {
    fullModified =
      code.substring(0, req.selectionStart) + modified + code.substring(req.selectionEnd);
  }

  return {
    modifiedCode: fullModified,
    explanation: aiRes.detailedExplanation || "Modified code based on your prompt.",
    diffSummary: aiRes.diffSummary || `Applied inline edit: "${prompt}"`,
    model: aiRes.usedModel || "Copilot Engine",
  };
}
