# Universal Working Compilers & Multi-Language Code Studio Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Code Studio into a fully functional multi-language development environment where **every compiler** (Python 3.12+, C++20/GCC, Java 21/OpenJDK, SQLite 3, JavaScript, TypeScript, HTML/CSS, JSON) actually compiles, executes, and returns real compiler diagnostics, stdout, stderr, and exit codes.

**Architecture:** A resilient dual-engine execution architecture in `src/features/code-studio/services/`:
1. **Remote Cloud Compiler Service (`remoteCompilerService.ts`)**: Integrates with the open, free Wandbox execution API to run real `gcc-head` (C++20/23), `cpython-3.12.7` / `cpython-3.14.0`, `openjdk-jdk-21+35` (Java 21 LTS), and `sqlite-3.46.1` with compiler error diagnostics, warnings, and standard output.
2. **Enhanced Sandboxed Code Execution Service (`codeExecutionService.ts`)**: Orchestrates execution across languages. Uses native browser V8 + loop guards for JavaScript/TypeScript, connects to the cloud compiler for Python/C++/Java/SQL with automatic offline fallback interpreters, formats real tabular SQL results, and runs live iframe previews for HTML/CSS.
3. **TypeScript Transpiler / AST Evaluator**: Robust client-side TypeScript compilation into executable JS with full type stripping and loop protection.
4. **Editor Toolbar & Console Diagnostics (`EditorToolbar.tsx`, `ConsoleOutput.tsx`)**: Displays compiler version tags (`[GCC 14.2 C++20]`, `[CPython 3.12.7]`, `[OpenJDK 21]`, `[SQLite 3.46]`), compilation status indicators, execution time, and error highlighting.

**Tech Stack:** React 18, TypeScript, Wandbox Open Compiler API, Web Workers / Function Sandbox, SQLite table formatter, Tailwind CSS, Vitest.

---

### Task 1: Remote Compiler Service for Real C++, Python, Java & SQL

**Files:**
- Create: `src/features/code-studio/services/remoteCompilerService.ts`
- Test: `src/test/remoteCompilerService.test.ts`

**Step 1: Write test for remote compiler service**
- Verify compiler configuration mapping:
  - `python` -> `cpython-3.12.7` (with `cpython-3.14.0` fallback)
  - `cpp` -> `gcc-head` (`-std=c++20 -O2`)
  - `java` -> `openjdk-jdk-21+35` (with auto-class normalization)
  - `sql` -> `sqlite-3.46.1`
- Test normalization of Java code (e.g. converting `public class AnyName` to `class AnyName` or `class Main` to prevent `prog.java` compilation error).
- Test response formatting: mapping `program_output`, `program_error`, `compiler_error`, and `status` into `ExecutionLog[]`.
- Test graceful timeout / error handling when network is offline.

**Step 2: Implement `remoteCompilerService.ts`**
- Create `executeRemoteCode(code: string, language: SupportedLanguage, stdin?: string): Promise<RemoteCompileResult>`.
- Add retry logic and 10-second timeout via `AbortController`.
- Normalize Java class declarations so users can write standard `public class Main` or `public class Solution` without compilation file-mismatch errors.
- Parse SQLite output into structured column/row data for formatting.

**Step 3: Run tests & verify**
- Command: `npx vitest run src/test/remoteCompilerService.test.ts`
- Expected: All unit tests pass.

---

### Task 2: Robust Client-Side TypeScript Transpilation & Python Fallback

**Files:**
- Modify: `src/features/code-studio/services/codeExecutionService.ts`
- Test: `src/test/codeExecutionService.test.ts`

**Step 1: Write tests for TypeScript transpilation & Python fallback**
- Test complex TypeScript features (interfaces, type unions, generics `T extends ...`, enums, type aliases `type X = ...`) compiling and executing in JavaScript engine.
- Test client-side Python fallback execution (loops, variables, functions, arithmetic) if remote compiler is unreachable or user is offline.

**Step 2: Implement enhanced language runners in `codeExecutionService.ts`**
- Replace simple regex stripping with a multi-pass TypeScript sanitizer removing interface definitions, type declarations, generics, type assertions (`as ...`), and parameter type annotations.
- Integrate `executeRemoteCode` as the primary engine for `python`, `cpp`, `java`, and `sql`.
- Add intelligent fallback: if remote compilation encounters a network failure, smoothly switch to the local engine and inform the user in the console output.
- Format SQL output as clean, responsive tabular ASCII / structured output.

**Step 3: Run tests & verify**
- Command: `npx vitest run src/test/codeExecutionService.test.ts`
- Expected: All tests pass including the new multi-compiler scenarios.

---

### Task 3: Real Interactive Stdin & Compiler Controls in Console & Toolbar

**Files:**
- Modify: `src/features/code-studio/components/ConsoleOutput.tsx`
- Modify: `src/features/code-studio/components/EditorToolbar.tsx`
- Modify: `src/features/code-studio/components/CodeStudioPage.tsx`
- Modify: `src/features/code-studio/types.ts`

**Step 1: Add Stdin & Compiler Badge Types**
- Update `types.ts` to include optional `stdin?: string` and compiler engine metadata (`engine: "cloud" | "browser"`, `compilerVersion: string`).

**Step 2: Update UI components**
- In `EditorToolbar.tsx`:
  - Add active compiler badge displaying language version (e.g. `GCC 14.2 (C++20)`, `Python 3.12`, `Java 21 LTS`, `SQLite 3.46`, `V8 ES2024`).
  - Add a toggle or indicator for Cloud Compilation vs Local Sandbox.
- In `ConsoleOutput.tsx`:
  - Add an optional expandable **Standard Input (stdin)** input drawer for interactive programs (e.g., `cin >> x`, `input()`, `Scanner(System.in)`).
  - Add copy output, clear logs, and compiler exit status pill (`Exit code 0` / `Compilation Error`).

**Step 3: Verify build and user experience**
- Command: `npm test` and `npm run build`
- Expected: Clean compilation with 0 errors.

---

### Task 4: Multi-Language Challenge Support & Starter Template Refinement

**Files:**
- Modify: `src/features/code-studio/data/codeTemplates.ts`
- Modify: `src/features/code-studio/data/codingChallenges.ts`
- Test: `src/test/codeStudioData.test.ts`

**Step 1: Refine starter templates**
- Update starter templates for C++, Java, Python, and SQL so they run immediately out-of-the-box on real compilers:
  - C++: Modern `#include <iostream>`, `#include <vector>`, `ranges`/`accumulate` example.
  - Java: Modern `public class Main` with Java 21 Stream API and formatted output.
  - Python: Clean script using list comprehension, functions, and formatted f-strings.
  - SQL: Real SQLite schema creation with sample table, insertions, and analytical `SELECT` query.
- Add multi-language starter code to relevant challenges.

**Step 2: Run full regression tests & lint check**
- Run `npm test`
- Run `npm run lint`
- Run `npm run build`

---

## Suggestions for Further Enhancement
1. **Interactive `stdin` Support**: Many beginners write `cin >> n` or `input("Enter your name: ")`. Providing an input field in the Console lets these programs run without errors.
2. **Code Formatter (Prettier / Clang-Format)**: Add a 1-click "Format Code" button on the toolbar (`Shift + Alt + F`).
3. **Shareable Code Snippet Links**: Encode user code in a compressed URL hash (`#code=...`) so users can share runnable code snippets with strangers in chat.
4. **Download Solution / Export**: Allow 1-click download of `.py`, `.cpp`, `.java`, `.ts`, `.sql` files.
