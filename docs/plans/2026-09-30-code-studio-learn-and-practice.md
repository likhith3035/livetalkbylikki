# Code Studio: AI Coding, Practice & Learning Arena Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a robust, responsive, high-performance in-browser Code Studio (`/code`) with an interactive code editor, real-time sandboxed execution (JavaScript, HTML/CSS, Python), curated practice challenges with automated test cases, auto-detection of API keys from format/other sources (`livetalk_ai_api_keys`, URL params, clipboard, env), automatic open-source model recognition (Free OpenRouter/Groq models), and an AI Copilot for error diagnostics, code explanation, and automated bug-fixing.

**Architecture:** A modular architecture in `src/features/code-studio/`:
1. `services/apiKeyDetectionService.ts`: Universal API key auto-detector (identifies OpenAI, Gemini, Groq, OpenRouter, Claude, DeepSeek by key signature/format, synchronizes across storage sources, and auto-discovers active open models).
2. `services/openModelService.ts`: Open model discovery engine (identifies available free/open-weight models such as Llama 3.3, DeepSeek R1, Qwen 2.5 Coder, Mistral, Gemini Flash Free on OpenRouter and Groq).
3. `services/codeExecutionService.ts`: Sandboxed live execution engine (HTML/CSS/JS iframe sandbox + Python interpreter + test runner).
4. `services/aiCodingService.ts`: Contextual AI coding assistant (bug fixing, line-by-line explanation, optimization, test generator, inline assistant) with full offline heuristic fallback.
5. `components/`: Responsive UI with `react-resizable-panels` on desktop and touch-optimized tabbed layout on mobile.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, `react-resizable-panels`, Vitest.

---

### Task 1: API Key Auto-Detection & Open Model Discovery Service

**Files:**
- Create: `src/features/code-studio/services/apiKeyDetectionService.ts`
- Create: `src/features/code-studio/services/openModelService.ts`
- Test: `src/test/apiKeyDetectionService.test.ts`

**Step 1: Write test for API key auto-detector and model resolver**
- Test key format signature identification:
  - `sk-proj-...` -> OpenAI
  - `AIzaSy...` -> Gemini
  - `gsk_...` -> Groq
  - `sk-or-v1-...` -> OpenRouter
  - `sk-ant-...` -> Claude
- Test multi-source retrieval (localStorage `livetalk_ai_api_keys`, `echo_ai_api_key`, URL search params, env variables).
- Test open model auto-recognition when "Open Models" toggle is enabled.

**Step 2: Implement detection and open model services**
- Automatically resolve all available keys from existing app sources.
- Auto-detect provider when any key string is pasted.
- Provide a list of verified free open models (Llama 3.3 70B, DeepSeek R1, Qwen 2.5 Coder) for 1-tap open model mode.

**Step 3: Run test to verify**
- Run `npx vitest run src/test/apiKeyDetectionService.test.ts`.

---

### Task 2: Code Studio Data Models, Languages & Practice Challenges

**Files:**
- Create: `src/features/code-studio/types.ts`
- Create: `src/features/code-studio/data/codingChallenges.ts`
- Create: `src/features/code-studio/data/codeTemplates.ts`
- Test: `src/test/codeStudioData.test.ts`

**Step 1: Write test for challenge dataset and code templates**
- Validate challenges exist across categories (JavaScript, Python, Algorithms, Web/DOM).
- Verify all challenges have valid test cases with input and expected output.
- Verify templates exist for all supported languages.

**Step 2: Implement types and data models**
- Define `SupportedLanguage` (`javascript`, `typescript`, `python`, `html`, `css`, `sql`, `json`, `cpp`, `java`).
- Define `CodingChallenge` (id, title, difficulty, category, description, starterCode, testCases, hints, solutionExplanation).
- Define `ExecutionResult` (output, error, executionTimeMs, testsPassed, totalTests, testResults).
- Define `AICodeAction` (`explain`, `fix_error`, `optimize`, `add_types`, `generate_tests`, `custom_chat`).

**Step 3: Run tests & verify**
- Run `npx vitest run src/test/codeStudioData.test.ts`.

---

### Task 3: Sandboxed Code Execution Engine & Console Interceptor

**Files:**
- Create: `src/features/code-studio/services/codeExecutionService.ts`
- Test: `src/test/codeExecutionService.test.ts`

**Step 1: Write test for execution engine**
- Test safe JavaScript evaluation with console logging (`console.log`, `console.warn`, `console.error`, `console.table`).
- Test timeout / infinite loop protection.
- Test automated test runner matching function return values against expected test case outputs.

**Step 2: Implement execution service**
- Implement iframe-based sandbox for HTML/CSS/JS live preview with bi-directional message posting.
- Implement isolated function runner with captured stdout/stderr for algorithmic challenges.
- Implement Python evaluation engine (browser-based Python evaluator with standard library math, strings, collections, loops, and list comprehensions).
- Implement test suite runner that executes challenge test cases and calculates pass/fail rates.

**Step 3: Run tests & verify**
- Run `npx vitest run src/test/codeExecutionService.test.ts`.

---

### Task 4: AI Coding Assistant & Error Diagnostics Service

**Files:**
- Create: `src/features/code-studio/services/aiCodingService.ts`
- Test: `src/test/aiCodingService.test.ts`

**Step 1: Write test for AI coding service**
- Test prompt building for error explanation & bug fixing, line-by-line explanation, optimization, and test generation.
- Test auto-switching to Open Models when option is enabled.
- Test offline heuristic fallback when no API key is available.

**Step 2: Implement AI coding service**
- Connect to OpenAI, Gemini, Groq, OpenRouter, and Claude.
- Format structured response: summary explanation, code diff/replacement, Big O complexity, and key takeaways.
- Include rich offline heuristic fallback engine that detects common bugs (e.g. `undefined is not a function`, missing returns, off-by-one errors, unclosed brackets, mutability bugs).

**Step 3: Run tests & verify**
- Run `npx vitest run src/test/aiCodingService.test.ts`.

---

### Task 5: Interactive Code Editor Component

**Files:**
- Create: `src/features/code-studio/components/CodeEditor.tsx`
- Create: `src/features/code-studio/components/EditorToolbar.tsx`
- Create: `src/features/code-studio/components/ConsoleOutput.tsx`
- Create: `src/features/code-studio/components/LiveHtmlPreview.tsx`

**Step 1: Implement CodeEditor**
- Line numbering gutter with active line highlighting.
- Tab key indentation handling (2 spaces or 4 spaces configurable).
- Automatic bracket and quote pairing (`()`, `[]`, `{}`, `""`, `''`, `\``).
- Multiple editor themes: Monokai Dark, Midnight Cyber, GitHub Dark, One Dark, Light Clean.
- Font size adjustment (12px to 20px).
- Syntax token styling and error underline markers.

**Step 2: Implement EditorToolbar, ConsoleOutput & LiveHtmlPreview**
- Toolbar: Language selector, template loader, "Run Code" button with Ctrl+Enter shortcut, "Clear", "Format Code", "Copy", "Download", "Fullscreen", "API Key" indicator badge.
- Console drawer: Terminal-style logs with timestamp, colored log levels (info, warn, error, success), execution duration badge, and clear button.
- Live HTML/CSS/JS preview tab with auto-run and manual refresh.

---

### Task 6: Practice & Learning Challenges Panel & Test Runner

**Files:**
- Create: `src/features/code-studio/components/ChallengeSidebar.tsx`
- Create: `src/features/code-studio/components/TestResultsModal.tsx`

**Step 1: Implement ChallengeSidebar**
- Category filter (All, JavaScript, Python, Algorithms, Strings/Arrays, Web Dev).
- Difficulty badges (Beginner, Intermediate, Advanced) with completion checkmarks.
- Challenge details view: Description, input/output constraints, starter code loader.
- Progressive Hints toggle (Hint 1 -> Hint 2 -> Full Explanation).

**Step 2: Implement TestResultsView**
- Live test case runner output table showing:
  - Input passed.
  - Expected output vs Actual output.
  - Pass / Fail status badge.
  - Execution time (ms).
  - Confetti burst celebration on solving all test cases!

---

### Task 7: AI Copilot & Error Solver Drawer

**Files:**
- Create: `src/features/code-studio/components/AICopilotPanel.tsx`
- Create: `src/features/code-studio/components/CodeStudioKeyModal.tsx`

**Step 1: Implement AICopilotPanel**
- 1-Click Quick Actions:
  - 🛠️ **"Fix Errors & Bugs"**
  - 📖 **"Explain Code & Complexity"**
  - ⚡ **"Optimize Performance"**
  - 🧪 **"Generate Tests"**
  - 🏷️ **"Add Types & Docstrings"**
- Auto-detect API key banner / status with 1-tap open model toggle.
- Interactive Chat: User can ask follow-up questions about the code, request code examples, or ask how to approach a challenge.
- One-tap "Apply Code to Editor" button that updates the editor state cleanly.

**Step 2: Implement CodeStudioKeyModal**
- Smart key input: auto-detects provider as the user types or pastes.
- Auto-import button: loads keys from other app features (e.g. Prompt Analyzer) with 1 click.
- Open Model switch: activates verified free open-source models with zero configuration.

---

### Task 8: Main CodeStudioPage & Global Routing Integration

**Files:**
- Create: `src/features/code-studio/components/CodeStudioPage.tsx`
- Modify: `src/App.tsx` (Add `/code` route)
- Modify: `src/components/Header.tsx` (Add "Code Studio" to top navigation drawer)
- Modify: `src/components/MobileNav.tsx` (Add to navigation catalog)
- Modify: `src/pages/Index.tsx` (Add Code Studio showcase card / quick link)

**Step 1: Assemble CodeStudioPage with Zero-Headache Responsive Layout**
- Desktop (lg+): `react-resizable-panels` with min/max clamps so no panel ever collapses or overflows.
- Mobile/Tablet (<lg): Responsive 4-tab bar (`Editor`, `Console / Preview`, `Challenges`, `AI Copilot`) with sticky bottom action controls ("Run Code", "Ask AI Copilot").
- Fluid height calculation (`h-[calc(100dvh-4rem)]`), zero page overflow or jumpy layout.

**Step 2: Connect routes and navigation**
- Add lazy route `<Route path="/code" element={<CodeStudioPage />} />` to `src/App.tsx`.
- Add navigation item with `<Code className="w-4 h-4 text-emerald-400" />` to drawer in `Header.tsx`.
- Add quick showcase link on Home Page (`src/pages/Index.tsx`).

---

### Task 9: Comprehensive Verification & Test Suite

**Files:**
- Test: `src/test/codeStudioFeatures.test.ts`
- Run: `npx vitest run` (ensure all tests pass)
- Run: `npx tsc --noEmit` (ensure 0 TypeScript errors)
- Manual browser verification: Check editor typing, code execution, challenge test runner, open model auto-switch, and AI suggestion actions.
