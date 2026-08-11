export type PromptCategory =
  | "coding"
  | "web_development"
  | "image_generation"
  | "writing"
  | "research"
  | "data_analysis"
  | "marketing"
  | "education"
  | "business"
  | "ai_agent"
  | "general"
  | "other";

export type ImprovementLevel = "quick_fix" | "better" | "professional" | "expert";

export type IssueSeverity = "critical" | "major" | "minor";

export interface IssueItem {
  id: string;
  title: string;
  type: string;
  severity: IssueSeverity;
  problem: string;
  whyItMatters: string;
  suggestion: string;
  affectedText?: string;
}

export interface AmbiguityItem {
  phrase: string;
  reason: string;
  suggestion: string;
}

export interface ContradictionItem {
  conflict: string;
  explanation: string;
  suggestedResolution: string;
}

export interface RedundancyItem {
  phrase: string;
  explanation: string;
  consolidated: string;
}

export interface PromptChange {
  change: string;
  reason: string;
  impact: string;
}

export interface CategoryScores {
  clarity: number;
  context: number;
  specificity: number;
  goalDefinition: number;
  requirements: number;
  constraints: number;
  outputFormat: number;
  audience?: number;
  examples?: number;
  ambiguity: number; // lower ambiguity = higher score or vice versa (we store 0-100 where 100 = minimal ambiguity)
}

export interface ElementCheck {
  element: "Goal" | "Context" | "Requirements" | "Constraints" | "Output Format" | "Examples" | "Audience" | "Instructions";
  status: "present" | "missing" | "optional" | "not_relevant";
  note?: string;
}

export interface LearningTip {
  title: string;
  tip: string;
  example?: string;
}

export interface ImprovedPromptVariants {
  quick_fix: string;
  better: string;
  professional: string;
  expert: string;
}

export interface PromptAnalysisResult {
  id: string;
  createdAt: number;
  originalPrompt: string;
  promptCategory: PromptCategory;
  categoryLabel: string;
  overallScore: number;
  ratingLabel: "Very Weak" | "Needs Improvement" | "Fair" | "Good" | "Excellent" | "Exceptional";
  summary: string;
  scores: CategoryScores;
  issues: IssueItem[];
  missingContext: string[];
  suggestedQuestions: string[];
  ambiguities: AmbiguityItem[];
  contradictions: ContradictionItem[];
  redundancies: RedundancyItem[];
  improvedPrompts: ImprovedPromptVariants;
  changes: PromptChange[];
  structureChecklist: ElementCheck[];
  learningTips: LearningTip[];
  engineSource?: string;
}

export interface ExamplePrompt {
  id: string;
  title: string;
  category: PromptCategory;
  prompt: string;
  description: string;
}
