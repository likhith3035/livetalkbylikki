import {
  PromptAnalysisResult,
  PromptCategory,
  IssueItem,
  AmbiguityItem,
  ContradictionItem,
  RedundancyItem,
  ElementCheck,
  LearningTip,
  PromptChange,
} from "../types";
import { getSavedBYOKKeys } from "../components/BYOKModal";

// Vague terms to detect
const VAGUE_TERMS = [
  { word: "professional", fix: "Define exact visual style, tone, target audience, or industry standards." },
  { word: "good", fix: "Specify quantitative metrics, acceptance criteria, or quality benchmarks." },
  { word: "best", fix: "Clarify criteria such as speed, security, UI aesthetic, or code maintainability." },
  { word: "modern", fix: "Mention specific design trends like glassmorphism, dark mode, vibrant gradients, or clean typography." },
  { word: "attractive", fix: "Describe color schemes, layout arrangement, or interactive micro-animations." },
  { word: "fast", fix: "Define performance expectations (e.g. sub-100ms API response time or 60fps animations)." },
  { word: "simple", fix: "Specify whether you mean minimal code, user-friendly UI, or streamlined architecture." },
  { word: "advanced", fix: "List specific advanced capabilities like AI integrations, real-time WebSockets, or RBAC." },
  { word: "powerful", fix: "Enumerate key features, high throughput capacity, or scaling goals." },
  { word: "nice", fix: "Replace with precise aesthetic or functional guidelines." },
  { word: "make it better", fix: "State exact pain points, missing features, or bugs to address." },
  { word: "cool", fix: "Detail visual effects, unique features, or interactive elements." },
];

/**
 * Intelligent Category Detector based on keyword signals
 */
export function detectPromptCategory(prompt: string): { category: PromptCategory; label: string } {
  const lower = prompt.toLowerCase();

  if (/(code|function|bug|typescript|javascript|python|java|c\+\+|react|api|component|class|refactor|error|stack)/i.test(lower)) {
    return { category: "coding", label: "Coding & Software Engineering" };
  }
  if (/(website|html|css|tailwind|landing page|navbar|ui|frontend|backend|web app|responsive|flexbox)/i.test(lower)) {
    return { category: "web_development", label: "Web Development" };
  }
  if (/(image|photo|midjourney|dall-e|render|illustration|8k|lighting|camera|portrait|aspect ratio|anime|realistic)/i.test(lower)) {
    return { category: "image_generation", label: "AI Image Generation" };
  }
  if (/(write|essay|article|blog|story|email|copywriting|headline|caption|poem|script|paraphrase)/i.test(lower)) {
    return { category: "writing", label: "Writing & Content Creation" };
  }
  if (/(research|study|paper|sources|citations|literature|academic|investigate|history|summary)/i.test(lower)) {
    return { category: "research", label: "Research & Analysis" };
  }
  if (/(data|sql|dataset|csv|pandas|chart|graph|metrics|analytics|regression|visualization)/i.test(lower)) {
    return { category: "data_analysis", label: "Data Analysis & Statistics" };
  }
  if (/(marketing|seo|ad|campaign|funnel|conversion|audience|brand|lead|sales|target market)/i.test(lower)) {
    return { category: "marketing", label: "Marketing & Strategy" };
  }
  if (/(teach|explain|math|physics|lesson|quiz|student|learning|tutor|homework|beginner)/i.test(lower)) {
    return { category: "education", label: "Education & Tutoring" };
  }
  if (/(business|plan|proposal|pitch|roi|revenue|executive|startup|strategy|market size)/i.test(lower)) {
    return { category: "business", label: "Business & Management" };
  }
  if (/(agent|tool|workflow|automation|n8n|langchain|prompt engineer|system prompt|function call)/i.test(lower)) {
    return { category: "ai_agent", label: "AI Agent & Workflow" };
  }

  return { category: "general", label: "General Prompt" };
}

/**
 * Perform comprehensive analysis of a user's prompt (with optional BYOK LLM integration)
 */
export async function analyzePrompt(promptText: string): Promise<PromptAnalysisResult> {
  const trimmed = promptText.trim();
  if (!trimmed) {
    throw new Error("Prompt cannot be empty. Please enter a prompt to analyze.");
  }

  // 1. Check for BYOK keys or env keys
  const byok = getSavedBYOKKeys();
  const openaiKey = byok.openai || import.meta.env.VITE_OPENAI_API_KEY;
  const geminiKey = byok.gemini || import.meta.env.VITE_GEMINI_API_KEY;
  const sarvamKey = byok.sarvam || import.meta.env.VITE_SARVAM_API_KEY;
  const groqKey = byok.groq || import.meta.env.VITE_GROQ_API_KEY;
  const openrouterKey = byok.openrouter || import.meta.env.VITE_OPENROUTER_API_KEY;

  if (openaiKey || geminiKey || sarvamKey || groqKey || openrouterKey) {
    try {
      const llmResult = await analyzeWithLLMWaterfall({
        prompt: trimmed,
        openaiKey,
        geminiKey,
        sarvamKey,
        groqKey,
        openrouterKey,
      });
      if (llmResult) return llmResult;
    } catch (e) {
      console.warn("[PromptAnalyzer] LLM API call failed, falling back to local heuristic engine:", e);
    }
  }

  // 2. Fallback to Local Heuristic Engine
  const localResult = await analyzeLocally(trimmed);
  localResult.engineSource = "Local Heuristic Engine";
  return localResult;
}

/**
 * Multi-provider waterfall LLM execution.
 * Tries providers in priority order until one succeeds: Sarvam -> Groq -> Gemini -> OpenAI -> OpenRouter
 */
async function analyzeWithLLMWaterfall({
  prompt,
  openaiKey,
  geminiKey,
  sarvamKey,
  groqKey,
  openrouterKey,
}: {
  prompt: string;
  openaiKey?: string;
  geminiKey?: string;
  sarvamKey?: string;
  groqKey?: string;
  openrouterKey?: string;
}): Promise<PromptAnalysisResult | null> {
  const systemPrompt = `You are an elite Prompt Engineering Specialist. Analyze the user's prompt and return a valid JSON object matching this EXACT structure with NO extra markdown formatting or backticks:
{
  "promptCategory": "coding" | "web_development" | "image_generation" | "writing" | "research" | "data_analysis" | "marketing" | "education" | "business" | "ai_agent" | "general",
  "categoryLabel": string,
  "overallScore": number (0-100),
  "ratingLabel": "Very Weak" | "Needs Improvement" | "Fair" | "Good" | "Excellent" | "Exceptional",
  "summary": string,
  "scores": {
    "clarity": number,
    "context": number,
    "specificity": number,
    "goalDefinition": number,
    "requirements": number,
    "constraints": number,
    "outputFormat": number,
    "ambiguity": number
  },
  "issues": [
    {
      "id": string,
      "title": string,
      "type": string,
      "severity": "critical" | "major" | "minor",
      "problem": string,
      "whyItMatters": string,
      "suggestion": string
    }
  ],
  "missingContext": string[],
  "suggestedQuestions": string[],
  "ambiguities": [
    { "phrase": string, "reason": string, "suggestion": string }
  ],
  "contradictions": [
    { "conflict": string, "explanation": string, "suggestedResolution": string }
  ],
  "redundancies": [
    { "phrase": string, "explanation": string, "consolidated": string }
  ],
  "improvedPrompts": {
    "quick_fix": string,
    "better": string,
    "professional": string,
    "expert": string
  },
  "changes": [
    { "change": string, "reason": string, "impact": string }
  ],
  "structureChecklist": [
    { "element": "Goal" | "Context" | "Requirements" | "Constraints" | "Output Format" | "Examples" | "Audience" | "Instructions", "status": "present" | "missing" | "optional" | "not_relevant", "note": string }
  ],
  "learningTips": [
    { "title": string, "tip": string, "example": string }
  ]
}`;

  // Priority 1: Sarvam AI (using sarvam-105b-conversations model)
  if (sarvamKey) {
    try {
      const result = await callSarvamAI(prompt, sarvamKey);
      if (result) {
        result.engineSource = "Sarvam AI (105B Conversations)";
        return result;
      }
    } catch (e) {
      console.warn("[PromptAnalyzer] Sarvam AI failed, trying next provider in waterfall...", e);
    }
  }

  // Priority 2: Groq AI
  if (groqKey) {
    try {
      const result = await callGroqAI(prompt, groqKey, systemPrompt);
      if (result) {
        result.engineSource = "Groq AI (Llama 3.3 70B)";
        return result;
      }
    } catch (e) {
      console.warn("[PromptAnalyzer] Groq AI failed, trying next provider...", e);
    }
  }

  // Priority 3: Gemini AI
  if (geminiKey) {
    try {
      const result = await callGeminiAI(prompt, geminiKey, systemPrompt);
      if (result) {
        result.engineSource = "Google Gemini 1.5 Flash";
        return result;
      }
    } catch (e) {
      console.warn("[PromptAnalyzer] Gemini AI failed, trying next provider...", e);
    }
  }

  // Priority 4: OpenAI
  if (openaiKey) {
    try {
      const result = await callOpenAI(prompt, openaiKey, systemPrompt);
      if (result) {
        result.engineSource = "OpenAI (GPT-4o-mini)";
        return result;
      }
    } catch (e) {
      console.warn("[PromptAnalyzer] OpenAI failed, trying next provider...", e);
    }
  }

  // Priority 5: OpenRouter
  if (openrouterKey) {
    try {
      const result = await callOpenRouter(prompt, openrouterKey, systemPrompt);
      if (result) {
        result.engineSource = "OpenRouter AI";
        return result;
      }
    } catch (e) {
      console.warn("[PromptAnalyzer] OpenRouter AI failed:", e);
    }
  }

  return null;
}

/**
 * Call Sarvam AI using sarvam-105b-conversations chat-tuned model
 */
async function callSarvamAI(prompt: string, sarvamKey: string): Promise<PromptAnalysisResult | null> {
  const sarvamSystemPrompt = `You are a Prompt Quality Analyst. Analyze the user's prompt and return ONLY a valid JSON object (no markdown, no backticks, no explanation).

JSON structure:
{"promptCategory":"coding"|"writing"|"general"|"web_development"|"image_generation"|"research"|"data_analysis"|"marketing"|"education"|"business","categoryLabel":"string","overallScore":0-100,"ratingLabel":"Very Weak"|"Needs Improvement"|"Fair"|"Good"|"Excellent","summary":"1-2 sentence analysis","scores":{"clarity":0-100,"context":0-100,"specificity":0-100,"goalDefinition":0-100,"requirements":0-100,"constraints":0-100,"outputFormat":0-100,"ambiguity":0-100},"issues":[{"id":"string","title":"string","type":"string","severity":"critical"|"major"|"minor","problem":"string","whyItMatters":"string","suggestion":"string"}],"missingContext":["string"],"suggestedQuestions":["string"],"ambiguities":[{"phrase":"string","reason":"string","suggestion":"string"}],"contradictions":[],"redundancies":[],"improvedPrompts":{"quick_fix":"string","better":"string","professional":"string","expert":"string"},"changes":[{"change":"string","reason":"string","impact":"string"}],"structureChecklist":[{"element":"Goal"|"Context"|"Requirements"|"Constraints"|"Output Format"|"Examples"|"Audience"|"Instructions","status":"present"|"missing"|"optional","note":"string"}],"learningTips":[{"title":"string","tip":"string","example":"string"}]}`;

  const cleanKey = sarvamKey.replace(/^Bearer\s+/i, "").trim();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for Sarvam generation

  try {
    console.log("[PromptAnalyzer] Calling Sarvam AI (sarvam-105b-conversations)...");
    const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": cleanKey,
        "Authorization": `Bearer ${cleanKey}`,
      },
      body: JSON.stringify({
        model: "sarvam-105b-conversations",
        messages: [
          { role: "system", content: sarvamSystemPrompt },
          { role: "user", content: `Analyze this prompt:\n"${prompt}"` },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });

    if (res.ok) {
      const data = await res.json();
      clearTimeout(timeoutId);
      const rawJson = data.choices?.[0]?.message?.content || "";
      if (rawJson) {
        return parseAndBuildResult(rawJson, prompt);
      }
    } else {
      clearTimeout(timeoutId);
      const errText = await res.text().catch(() => "");
      console.warn(`[PromptAnalyzer] Sarvam API error (${res.status}):`, errText);
    }
  } catch (fetchErr: any) {
    clearTimeout(timeoutId);
    if (fetchErr.name === "AbortError") {
      console.warn("[PromptAnalyzer] Sarvam API request timed out (60s limit reached). Falling back to next provider.");
    } else {
      console.warn("[PromptAnalyzer] Sarvam fetch error:", fetchErr);
    }
  }
  return null;
}

/**
 * Call Groq AI API
 */
async function callGroqAI(prompt: string, groqKey: string, systemPrompt: string): Promise<PromptAnalysisResult | null> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });
  if (res.ok) {
    const data = await res.json();
    const rawJson = data.choices?.[0]?.message?.content || "";
    if (rawJson) return parseAndBuildResult(rawJson, prompt);
  }
  return null;
}

/**
 * Call Gemini AI API
 */
async function callGeminiAI(prompt: string, geminiKey: string, systemPrompt: string): Promise<PromptAnalysisResult | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nUSER PROMPT TO ANALYZE:\n"${prompt}"` }],
        },
      ],
    }),
  });
  if (res.ok) {
    const data = await res.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (rawJson) return parseAndBuildResult(rawJson, prompt);
  }
  return null;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string, openaiKey: string, systemPrompt: string): Promise<PromptAnalysisResult | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });
  if (res.ok) {
    const data = await res.json();
    const rawJson = data.choices?.[0]?.message?.content || "";
    if (rawJson) return parseAndBuildResult(rawJson, prompt);
  }
  return null;
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(prompt: string, openrouterKey: string, systemPrompt: string): Promise<PromptAnalysisResult | null> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openrouterKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });
  if (res.ok) {
    const data = await res.json();
    const rawJson = data.choices?.[0]?.message?.content || "";
    if (rawJson) return parseAndBuildResult(rawJson, prompt);
  }
  return null;
}

/**
 * Parse raw JSON string and construct a normalized PromptAnalysisResult
 */
function parseAndBuildResult(rawJson: string, prompt: string): PromptAnalysisResult | null {
  if (!rawJson) return null;

  const cleaned = rawJson.replace(/```json\n?|\n?```/g, "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.warn("[PromptAnalyzer] JSON parse failed, attempting truncated JSON repair...");
    try {
      parsed = JSON.parse(repairTruncatedJson(cleaned));
      console.log("[PromptAnalyzer] Truncated JSON repaired successfully.");
    } catch (repairErr) {
      console.warn("[PromptAnalyzer] JSON repair also failed:", repairErr);
      return null;
    }
  }

  return {
    id: "analysis-llm-" + Date.now(),
    createdAt: Date.now(),
    originalPrompt: prompt,
    promptCategory: parsed.promptCategory || "general",
    categoryLabel: parsed.categoryLabel || "General Prompt",
    overallScore: Math.max(10, Math.min(100, parsed.overallScore || 70)),
    ratingLabel: parsed.ratingLabel || "Good",
    summary: parsed.summary || "LLM Evaluation Complete.",
    scores: parsed.scores || {
      clarity: 75,
      context: 60,
      specificity: 70,
      goalDefinition: 80,
      requirements: 65,
      constraints: 50,
      outputFormat: 75,
      ambiguity: 80,
    },
    issues: parsed.issues || [],
    missingContext: parsed.missingContext || [],
    suggestedQuestions: parsed.suggestedQuestions || [],
    ambiguities: parsed.ambiguities || [],
    contradictions: parsed.contradictions || [],
    redundancies: parsed.redundancies || [],
    improvedPrompts: parsed.improvedPrompts || {
      quick_fix: prompt,
      better: prompt,
      professional: prompt,
      expert: prompt,
    },
    changes: parsed.changes || [],
    structureChecklist: parsed.structureChecklist || [],
    learningTips: parsed.learningTips || [],
  };
}

/**
 * Robust JSON repair for truncated/malformed LLM output.
 * Strategy: try bracket-closure first, then progressive truncation, then regex extraction.
 */
function repairTruncatedJson(json: string): string {
  // Strategy 1: Clean up and close brackets
  const attempt1 = attemptBracketRepair(json);
  try {
    JSON.parse(attempt1);
    return attempt1;
  } catch { /* continue to strategy 2 */ }

  // Strategy 2: Progressively truncate from the end until valid JSON
  // Find the last complete key-value pair and close everything
  const lastGoodPositions = [
    json.lastIndexOf('},'),
    json.lastIndexOf('}]'),
    json.lastIndexOf('"]'),
    json.lastIndexOf('",'),
    json.lastIndexOf('"}'),
  ].filter(p => p > 100); // must have at least some content

  for (const pos of lastGoodPositions.sort((a, b) => b - a)) {
    const slice = json.substring(0, pos + 1);
    const repaired = attemptBracketRepair(slice);
    try {
      JSON.parse(repaired);
      return repaired;
    } catch { /* try next position */ }
  }

  // Strategy 3: Find the last parseable substring by binary-style search
  for (let len = json.length - 1; len > 100; len -= 50) {
    const slice = json.substring(0, len);
    const repaired = attemptBracketRepair(slice);
    try {
      JSON.parse(repaired);
      return repaired;
    } catch { /* try shorter */ }
  }

  // Strategy 4: Regex extraction of core fields as absolute last resort
  const extracted = extractFieldsWithRegex(json);
  if (extracted) return extracted;

  throw new Error("All JSON repair strategies failed");
}

/**
 * Close unclosed strings, remove trailing commas, close brackets/braces.
 */
function attemptBracketRepair(json: string): string {
  let s = json.trim();

  // If we're inside an unclosed string, close it
  let quoteCount = 0;
  let escaped = false;
  for (const ch of s) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') quoteCount++;
  }
  if (quoteCount % 2 !== 0) {
    // Odd quotes = unclosed string. Remove partial string value from end.
    s = s.replace(/"[^"]*$/, '""');
  }

  // Remove trailing commas
  s = s.replace(/,\s*$/, '');
  // Remove trailing colons (incomplete key-value)
  s = s.replace(/:\s*$/, ': null');
  // Remove incomplete key at end
  s = s.replace(/,\s*"[^"]*"\s*$/, '');

  // Count and close open brackets/braces
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  for (const ch of s) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if ((ch === '}' || ch === ']') && stack.length > 0) stack.pop();
  }
  while (stack.length > 0) s += stack.pop();

  return s;
}

/**
 * Last-resort: extract key fields from malformed JSON using regex.
 */
function extractFieldsWithRegex(json: string): string | null {
  const get = (key: string): string | null => {
    const m = json.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, 'i'));
    return m ? m[1] : null;
  };
  const getNum = (key: string): number | null => {
    const m = json.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`, 'i'));
    return m ? parseInt(m[1], 10) : null;
  };

  const score = getNum('overallScore');
  const category = get('promptCategory');
  if (score === null && category === null) return null; // Not enough data

  const obj: Record<string, any> = {
    promptCategory: category || 'general',
    categoryLabel: get('categoryLabel') || 'General Prompt',
    overallScore: score || 50,
    ratingLabel: get('ratingLabel') || 'Fair',
    summary: get('summary') || 'Analysis completed with partial data from AI.',
    scores: {
      clarity: getNum('clarity') || 50,
      context: getNum('context') || 50,
      specificity: getNum('specificity') || 50,
      goalDefinition: getNum('goalDefinition') || 50,
      requirements: getNum('requirements') || 50,
      constraints: getNum('constraints') || 50,
      outputFormat: getNum('outputFormat') || 50,
      ambiguity: getNum('ambiguity') || 50,
    },
    issues: [],
    missingContext: [],
    suggestedQuestions: [],
    ambiguities: [],
    contradictions: [],
    redundancies: [],
    improvedPrompts: { quick_fix: '', better: '', professional: '', expert: '' },
    changes: [],
    structureChecklist: [],
    learningTips: [],
  };

  return JSON.stringify(obj);
}

/**
 * Local Heuristic Analyzer Engine (Offline Fallback)
 */
async function analyzeLocally(promptText: string): Promise<PromptAnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const { category, label: categoryLabel } = detectPromptCategory(promptText);
  const words = promptText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lower = promptText.toLowerCase();

  const ambiguities: AmbiguityItem[] = [];
  VAGUE_TERMS.forEach(({ word, fix }) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(promptText)) {
      ambiguities.push({
        phrase: word,
        reason: `"${word}" is subjective and can be interpreted in multiple ways by the AI.`,
        suggestion: fix,
      });
    }
  });

  const contradictions: ContradictionItem[] = [];
  if (lower.includes("short") && lower.includes("detailed") && lower.includes("in-depth")) {
    contradictionCheck(
      contradictions,
      'Conflicting length requirements ("short" vs "in-depth")',
      'The prompt asks for a "short" answer while simultaneously requesting "in-depth detailed" coverage.',
      "Specify an explicit target length (e.g. 300 words or 3 bullet points)."
    );
  }
  if (lower.includes("simple") && lower.includes("complex") && !lower.includes("explain simple")) {
    contradictionCheck(
      contradictions,
      'Conflicting complexity demands ("simple" vs "complex")',
      "The prompt demands both simple execution and complex architecture without defining scope boundaries.",
      "Separate the request into a high-level simple summary and detailed technical specifications."
    );
  }

  const redundancies: RedundancyItem[] = [];
  if (/clean.*simple|simple.*clean/i.test(lower) && /make it clean and simple/i.test(lower)) {
    redundancies.push({
      phrase: "clean and simple",
      explanation: 'Repeating "clean" and "simple" multiple times adds no extra context.',
      consolidated: "Specify exact design guidelines (e.g. ample whitespace, minimal palette).",
    });
  }

  const issues: IssueItem[] = [];

  if (wordCount < 4 && !/(code|help|hi)/i.test(lower)) {
    issues.push({
      id: "crit-1",
      title: "Extremely Unclear Objective",
      type: "unclear_objective",
      severity: "critical",
      problem: "The prompt is too short to communicate a clear task or desired outcome.",
      whyItMatters: "The AI will have to make wild guesses about what you want, yielding irrelevant answers.",
      suggestion: "Add 1–2 sentences explaining what you want to achieve and what output format you expect.",
    });
  }

  if (contradictions.length > 0) {
    issues.push({
      id: "crit-2",
      title: "Contradictory Requirements Detected",
      type: "contradiction",
      severity: "critical",
      problem: contradictions[0].conflict,
      whyItMatters: contradictions[0].explanation,
      suggestion: contradictions[0].suggestedResolution,
    });
  }

  const hasFormatInstruction = /(json|markdown|table|list|bullet|code block|essay|step-by-step|format|output)/i.test(lower);
  if (!hasFormatInstruction && wordCount > 8) {
    issues.push({
      id: "maj-1",
      title: "Missing Output Format Specification",
      type: "missing_output_format",
      severity: "major",
      problem: "The prompt does not state how the response should be formatted.",
      whyItMatters: "The AI may return unstructured paragraphs when you might need a table, code snippet, or bulleted list.",
      suggestion: 'Explicitly specify your desired format (e.g. "Format as a Markdown table with 3 columns").',
    });
  }

  const hasAudience = /(for beginners|for experts|target audience|for students|for developers|for client|for kids)/i.test(lower);
  if (!hasAudience && (category === "writing" || category === "education" || category === "marketing" || category === "business")) {
    issues.push({
      id: "maj-2",
      title: "Missing Target Audience Context",
      type: "missing_audience",
      severity: "major",
      problem: "No audience or persona is mentioned.",
      whyItMatters: "The AI cannot adapt its vocabulary, tone, or technical depth without knowing who will read the output.",
      suggestion: 'Add context such as "Target audience: non-technical executive stakeholders".',
    });
  }

  if (category === "coding" || category === "web_development") {
    const hasTechStack = /(react|vue|angular|node|python|typescript|tailwind|css|postgres|supabase|firebase|next|express)/i.test(lower);
    if (!hasTechStack) {
      issues.push({
        id: "maj-3",
        title: "Missing Technology Stack Context",
        type: "missing_tech_stack",
        severity: "major",
        problem: "No programming language, framework, or library is specified.",
        whyItMatters: "The AI might generate code in a language or framework incompatible with your project.",
        suggestion: 'Specify your tech stack (e.g. "React + TypeScript + Tailwind CSS").',
      });
    }
  }

  if (ambiguities.length > 1) {
    issues.push({
      id: "maj-4",
      title: "Multiple Vague Buzzwords Detected",
      type: "ambiguity",
      severity: "major",
      problem: `Found ${ambiguities.length} subjective words (${ambiguities.map((a) => `"${a.phrase}"`).join(", ")}).`,
      whyItMatters: "Vague descriptors force the AI to make arbitrary assumptions instead of following exact specifications.",
      suggestion: "Replace generic adjectives with concrete measurements, examples, or requirements.",
    });
  }

  if (wordCount > 60 && !lower.includes("\n") && !lower.includes("-")) {
    issues.push({
      id: "min-1",
      title: "Unstructured Wall of Text",
      type: "poor_organization",
      severity: "minor",
      problem: "The prompt is a single long paragraph without clear visual structure.",
      whyItMatters: "AI models pay stronger attention to organized bullet points and section headers.",
      suggestion: "Break the prompt into distinct sections using line breaks, numbered steps, or bullet points.",
    });
  }

  const clarityBase = Math.min(95, 50 + (wordCount >= 6 ? 20 : 5) - ambiguities.length * 10);
  const clarityScore = Math.max(20, clarityBase);
  const hasContextKeywords = /(because|context|using|project|system|environment|target|goal|background)/i.test(lower);
  const contextScore = Math.max(15, Math.min(100, (wordCount > 15 ? 40 : 20) + (hasContextKeywords ? 35 : 10) + (category === "coding" ? 15 : 10)));
  const specificityScore = Math.max(25, Math.min(100, wordCount * 2.5 - ambiguities.length * 12));
  const goalScore = Math.max(30, Math.min(100, (wordCount >= 5 ? 70 : 40) - (issues.some((i) => i.type === "unclear_objective") ? 40 : 0)));
  const reqsScore = Math.max(20, Math.min(95, (wordCount > 12 ? 65 : 35) + (hasFormatInstruction ? 20 : 0)));
  const constraintsScore = /(do not|avoid|limit|must|never|only)/i.test(lower) ? 85 : 35;
  const outputFormatScore = hasFormatInstruction ? 90 : 45;
  const audienceScore = hasAudience ? 90 : 50;
  const examplesScore = /(example|sample|for instance|like this)/i.test(lower) ? 95 : 25;
  const ambiguityScore = Math.max(20, 100 - ambiguities.length * 20);

  let totalScore = Math.round(
    clarityScore * 0.2 +
      contextScore * 0.2 +
      specificityScore * 0.2 +
      goalScore * 0.2 +
      reqsScore * 0.1 +
      outputFormatScore * 0.1
  );

  if (issues.some((i) => i.severity === "critical")) totalScore -= 25;
  if (issues.some((i) => i.severity === "major")) totalScore -= 10;
  if (wordCount >= 5 && wordCount <= 15 && issues.length === 0) {
    totalScore = Math.max(totalScore, 75);
  }

  totalScore = Math.max(12, Math.min(98, totalScore));

  let ratingLabel: PromptAnalysisResult["ratingLabel"] = "Fair";
  if (totalScore <= 30) ratingLabel = "Very Weak";
  else if (totalScore <= 50) ratingLabel = "Needs Improvement";
  else if (totalScore <= 70) ratingLabel = "Fair";
  else if (totalScore <= 85) ratingLabel = "Good";
  else if (totalScore <= 95) ratingLabel = "Excellent";
  else ratingLabel = "Exceptional";

  let summary = `Your prompt belongs to the **${categoryLabel}** category. `;
  if (totalScore >= 80) {
    summary += "It is well-structured with a clear goal and strong specificity. Minor tweaks will make it bulletproof.";
  } else if (totalScore >= 60) {
    summary += "The primary objective is clear, but adding key constraints, technical stack, and output formatting will dramatically improve results.";
  } else {
    summary += "It requires more context, target audience details, and explicit output guidelines so the AI doesn't make incorrect assumptions.";
  }

  const missingContext: string[] = [];
  const suggestedQuestions: string[] = [];

  if (category === "coding" || category === "web_development") {
    missingContext.push("Target programming framework and language versions.");
    missingContext.push("Expected input parameters and output return types.");
    missingContext.push("Error handling requirements and edge cases.");
    suggestedQuestions.push("What technology stack or programming language are you using?");
    suggestedQuestions.push("What should happen if invalid data or an error occurs?");
    suggestedQuestions.push("Do you need a standalone function or an integrated component?");
  } else if (category === "writing" || category === "marketing") {
    missingContext.push("Target audience demographic or professional background.");
    missingContext.push("Desired tone of voice (e.g. authoritative, friendly, concise).");
    missingContext.push("Key value propositions or mandatory talking points.");
    suggestedQuestions.push("Who is the primary reader or target audience?");
    suggestedQuestions.push("What tone of voice best represents your brand or goal?");
    suggestedQuestions.push("What is the main call-to-action or take-away?");
  } else if (category === "image_generation") {
    missingContext.push("Lighting style (e.g. cinematic, studio, volumetric, soft golden hour).");
    missingContext.push("Camera perspective and composition (e.g. macro, wide shot, 85mm lens).");
    missingContext.push("Art style or photographic rendering details.");
    suggestedQuestions.push("What lighting and mood should the scene convey?");
    suggestedQuestions.push("What is the camera angle or perspective?");
    suggestedQuestions.push("Are there color palette constraints or artistic style preferences?");
  } else {
    missingContext.push("Specific audience or reader context.");
    missingContext.push("Exact output format guidelines.");
    missingContext.push("Constraints on length, complexity, or tone.");
    suggestedQuestions.push("What is the end goal of this request?");
    suggestedQuestions.push("What format should the final answer take?");
    suggestedQuestions.push("Are there any constraints on length, style, or tools?");
  }

  const improvedPrompts = generateImprovedVariants(promptText, category, ambiguities);

  const changes: PromptChange[] = [
    {
      change: "Added explicit role & goal statement",
      reason: "Establishes a high-priority persona for the AI model.",
      impact: "Reduces generic introductory fluff and focuses response directly on your goal.",
    },
    {
      change: "Defined structured output instructions",
      reason: "Tells the AI exactly how to format sections, lists, or code.",
      impact: "Ensures the output is instantly usable without manual re-formatting.",
    },
  ];

  if (ambiguities.length > 0) {
    changes.push({
      change: `Replaced vague terms (${ambiguities.map((a) => `"${a.phrase}"`).join(", ")})`,
      reason: "Subjective adjectives force the AI to guess visual or functional details.",
      impact: "Dramatically improves accuracy by setting precise parameters.",
    });
  }

  changes.push({
    change: "Included negative constraints and boundary conditions",
    reason: "Defines what the AI must NOT include or assume.",
    impact: "Prevents unwanted bloated code, unsolicited advice, or long introductions.",
  });

  const structureChecklist: ElementCheck[] = [
    { element: "Goal", status: wordCount >= 3 ? "present" : "missing", note: "Primary objective statement" },
    { element: "Context", status: hasContextKeywords ? "present" : "missing", note: "Background and project details" },
    { element: "Requirements", status: wordCount > 10 ? "present" : "missing", note: "Functional and content specifications" },
    { element: "Constraints", status: /(do not|avoid|limit|must)/i.test(lower) ? "present" : "missing", note: "Limits and negative guidelines" },
    { element: "Output Format", status: hasFormatInstruction ? "present" : "optional", note: "Markdown, code block, table, or JSON" },
    { element: "Audience", status: hasAudience ? "present" : category === "coding" ? "not_relevant" : "optional", note: "Target reader or user level" },
    { element: "Examples", status: /(example|sample)/i.test(lower) ? "present" : "optional", note: "Few-shot examples or sample inputs" },
    { element: "Instructions", status: wordCount >= 5 ? "present" : "missing", note: "Direct step-by-step guidance" },
  ];

  const learningTips: LearningTip[] = [
    {
      title: "Role Prompting",
      tip: 'Start your prompt by giving the AI an expert role (e.g. "Act as a Senior React Engineer" or "Act as an Expert Copywriter").',
      example: '"Act as a Senior Web Accessibility Specialist..."',
    },
    {
      title: "Specify the Output Structure",
      tip: "Never leave output format to chance. Explicitly specify Markdown headers, tables, or JSON schemas.",
      example: '"Format your response into 3 sections: Summary, Implementation, and Edge Cases."',
    },
  ];

  if (ambiguities.length > 0) {
    learningTips.push({
      title: "Eliminate Subjective Adjectives",
      tip: `Swap words like "${ambiguities[0].phrase}" for tangible numbers or verifiable requirements.`,
      example: `Instead of "make it fast", use "ensure page load time is under 1.5 seconds".`,
    });
  } else {
    learningTips.push({
      title: "Set Negative Constraints",
      tip: "Tell the AI what NOT to do. This prevents fluff, unnecessary chatter, or outdated patterns.",
      example: '"Do not include introductory commentary. Return only executable code."',
    });
  }

  return {
    id: "analysis-local-" + Date.now(),
    createdAt: Date.now(),
    originalPrompt: promptText,
    promptCategory: category,
    categoryLabel,
    overallScore: totalScore,
    ratingLabel,
    summary,
    scores: {
      clarity: clarityScore,
      context: contextScore,
      specificity: specificityScore,
      goalDefinition: goalScore,
      requirements: reqsScore,
      constraints: constraintsScore,
      outputFormat: outputFormatScore,
      audience: audienceScore,
      examples: examplesScore,
      ambiguity: ambiguityScore,
    },
    issues,
    missingContext,
    suggestedQuestions,
    ambiguities,
    contradictions,
    redundancies,
    improvedPrompts,
    changes,
    structureChecklist,
    learningTips,
  };
}

function contradictionCheck(arr: ContradictionItem[], conflict: string, explanation: string, suggestedResolution: string) {
  arr.push({ conflict, explanation, suggestedResolution });
}

function generateImprovedVariants(
  original: string,
  category: PromptCategory,
  ambiguities: AmbiguityItem[]
): { quick_fix: string; better: string; professional: string; expert: string } {
  const cleaned = original.replace(/\s+/g, " ").trim();

  const quick_fix = `${cleaned}\n\nNote: Please provide a clear, step-by-step response with concise formatting and actionable details.`;

  let better = "";
  if (category === "coding" || category === "web_development") {
    better = `Task: ${cleaned}\n\nRequirements:\n- Provide clean, modern, type-safe code following best practices.\n- Include brief code comments explaining core logic.\n- Format output in clear Markdown code blocks.`;
  } else if (category === "image_generation") {
    better = `${cleaned}, highly detailed, cinematic lighting, 8k resolution, photorealistic studio shot, professional composition --ar 16:9`;
  } else {
    better = `Topic: ${cleaned}\n\nGuidelines:\n- Maintain a clear, professional tone.\n- Organize key points into bulleted sections.\n- Include a brief conclusion with actionable next steps.`;
  }

  let professional = "";
  if (category === "coding" || category === "web_development") {
    professional = `Role: Senior Full-Stack Software Engineer\n\nObjective: ${cleaned}\n\nTechnical Constraints & Standards:\n1. Architecture: Modular, scalable, and easy to maintain.\n2. Error Handling: Include robust try/catch blocks and user-friendly error messages.\n3. Output Format: Complete executable code blocks with imports and usage example.\n4. Avoid: Hardcoded static values, deprecated APIs, or unhandled promise rejections.`;
  } else if (category === "image_generation") {
    professional = `Subject: ${cleaned}\nStyle: Photorealistic 8k render, cinematic volumetric lighting, 85mm prime lens f/1.8 aperture depth of field.\nEnvironment: High-contrast detailed background with natural ambient occlusion.\nComposition: Rule of thirds framing, ultra-fine textures, award-winning visual clarity.`;
  } else {
    professional = `Context & Goal: ${cleaned}\n\nTarget Audience: Professional stakeholders and general users.\n\nFormatting & Structure:\n- Executive Summary (2-3 sentences)\n- Core Analysis / Solution (Bulleted key takeaways)\n- Implementation Recommendations & Action Steps\n\nTone & Style: Authoritative, polished, engaging, and clear.`;
  }

  let expert = "";
  if (category === "coding" || category === "web_development") {
    expert = `SYSTEM PROMPT: You are an elite Principal Software Architect.\n\nUSER DIRECTIVE: ${cleaned}\n\nEXECUTION PIPELINE:\n1. Technical Requirements:\n   - Language & Environment: Modern TypeScript / JavaScript ESNext standards.\n   - Code Quality: Production-ready, zero external dependencies unless strictly specified, fully typed.\n   - Security & Performance: Sanitize inputs, avoid memory leaks, optimize runtime complexity.\n\n2. Expected Response Structure:\n   - Component / Function Implementation (Clean Code)\n   - Edge Case Handling & Input Validation\n   - Example Usage & Unit Test Demonstration\n\n3. Negative Constraints:\n   - Do NOT provide incomplete snippet placeholders.\n   - Do NOT use inline boilerplate styling. Use established design tokens.`;
  } else if (category === "image_generation") {
    expert = `PROMPT ARCHITECTURE:\nPrimary Subject: ${cleaned}\n\nVisual Parameters:\n- Render Engine: Octane Render 3D / Unreal Engine 5 render style\n- Lighting: Volumetric god rays, rim lighting, 5600K color temperature\n- Camera: Hasselblad H6D-100c, 50mm lens, f/2.8, ISO 100\n- Texture & Detail: Micro-texture detail, subsurface scattering, zero chromatic aberration\n- Negative Prompt: --no blur, distortion, low quality, artifacts, watermarks, oversaturated colors`;
  } else {
    expert = `SYSTEM INSTRUCTION: You are an expert Subject Matter Strategist.\n\nPRIMARY GOAL: ${cleaned}\n\nMETHODOLOGY & CONSTRAINTS:\n1. Analytical Rigor: Provide evidence-based explanations with zero fluff.\n2. Output Hierarchy:\n   - Executive Overview\n   - In-depth Framework / Solution Breakdown\n   - Common Pitfalls & How to Avoid Them\n   - Step-by-Step Action Plan\n3. Tone: Direct, articulate, professional, and accessible.\n4. Constraint: Limit total response length to 600 words while maintaining maximum information density.`;
  }

  return {
    quick_fix,
    better,
    professional,
    expert,
  };
}
