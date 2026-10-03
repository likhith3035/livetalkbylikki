/**
 * Code Studio Type Definitions
 */

export type SupportedLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "html"
  | "css"
  | "sql"
  | "json"
  | "cpp"
  | "java";

export type EditorTheme =
  | "midnight-cyber"
  | "monokai"
  | "github-dark"
  | "one-dark"
  | "clean-light";

export type ChallengeDifficulty = "beginner" | "intermediate" | "advanced";

export type ChallengeCategory =
  | "all"
  | "javascript"
  | "python"
  | "algorithms"
  | "arrays"
  | "strings"
  | "web";

export interface TestCase {
  id: string;
  input: any[];
  expected: any;
  description?: string;
  hidden?: boolean;
}

export interface CodingChallenge {
  id: string;
  title: string;
  difficulty: ChallengeDifficulty;
  category: ChallengeCategory;
  description: string;
  language: SupportedLanguage;
  starterCode: string;
  solutionCode?: string;
  functionName: string;
  testCases: TestCase[];
  hints: string[];
  solutionExplanation: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  tags: string[];
}

export interface ExecutionLog {
  id: string;
  type: "log" | "warn" | "error" | "info" | "success";
  message: string;
  timestamp: number;
}

export interface TestCaseResult {
  testId: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  executionTimeMs: number;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  logs: ExecutionLog[];
  error: string | null;
  executionTimeMs: number;
  returnValue?: any;
  testsPassed?: number;
  totalTests?: number;
  testResults?: TestCaseResult[];
  compilerVersion?: string;
  exitCode?: number;
}

export type AICodeActionType =
  | "fix_error"
  | "explain"
  | "optimize"
  | "add_types"
  | "generate_tests"
  | "custom_chat";

export interface AICodeRequest {
  action: AICodeActionType;
  code: string;
  language: SupportedLanguage;
  errorMessage?: string;
  userPrompt?: string;
  activeChallenge?: CodingChallenge;
}

export interface AICodeResponse {
  summary: string;
  detailedExplanation: string;
  suggestedCode?: string;
  diffSummary?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  keyTakeaways: string[];
  usedModel: string;
  provider: string;
  isOpenModel: boolean;
}

export interface CodeTemplate {
  id: string;
  title: string;
  language: SupportedLanguage;
  category: string;
  description: string;
  code: string;
}
