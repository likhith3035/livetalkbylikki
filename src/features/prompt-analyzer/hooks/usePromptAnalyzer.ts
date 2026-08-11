import { useState, useEffect, useCallback } from "react";
import { PromptAnalysisResult, ImprovementLevel, ExamplePrompt } from "../types";
import { analyzePrompt } from "../services/promptAnalyzerService";
import { toast } from "sonner";

const HISTORY_STORAGE_KEY = "livetalk_prompt_analyzer_history_v1";

export const PRESET_EXAMPLES: ExamplePrompt[] = [
  {
    id: "ex-coding",
    title: "Coding",
    category: "coding",
    description: "Basic calculator request lacking tech stack & error handling",
    prompt: "create a python calculator",
  },
  {
    id: "ex-web",
    title: "Website",
    category: "web_development",
    description: "Vague college website prompt with missing pages & audience",
    prompt: "make a modern website for my college",
  },
  {
    id: "ex-image",
    title: "Image Gen",
    category: "image_generation",
    description: "Subject-only image prompt lacking camera, lighting & composition",
    prompt: "make a cool image of a car",
  },
  {
    id: "ex-writing",
    title: "Writing",
    category: "writing",
    description: "Generic email request missing audience, context & call to action",
    prompt: "write a professional email",
  },
  {
    id: "ex-research",
    title: "Research",
    category: "research",
    description: "Broad research topic missing dates, sources & output format",
    prompt: "explain artificial intelligence and its history",
  },
];

export function usePromptAnalyzer() {
  const [promptInput, setPromptInput] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<PromptAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ImprovementLevel>("better");
  const [history, setHistory] = useState<PromptAnalysisResult[]>([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      /* parse error */
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = useCallback((newResult: PromptAnalysisResult) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.originalPrompt !== newResult.originalPrompt);
      const updated = [newResult, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* storage full */
      }
      return updated;
    });
  }, []);

  // Clear analysis history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      toast.success("Prompt history cleared");
    } catch {
      /* remove error */
    }
  }, []);

  // Handle analysis
  const handleAnalyze = useCallback(async () => {
    if (!promptInput.trim()) {
      toast.error("Please enter a prompt to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await analyzePrompt(promptInput);
      setResult(res);
      saveToHistory(res);
      const engineName = res.engineSource || "Analysis Engine";
      toast.success(`Prompt analysis complete via ${engineName}!`);
    } catch (err: any) {
      const errMsg = err.message || "Failed to analyze prompt. Please try again.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsAnalyzing(false);
    }
  }, [promptInput, saveToHistory]);

  // Load preset example
  const loadExample = useCallback((example: ExamplePrompt) => {
    setPromptInput(example.prompt);
    toast.info(`Loaded "${example.title}" example prompt`);
  }, []);

  // Clear input & result
  const handleClear = useCallback(() => {
    setPromptInput("");
    setResult(null);
    setError(null);
  }, []);

  // Select historical item
  const loadHistoryItem = useCallback((item: PromptAnalysisResult) => {
    setPromptInput(item.originalPrompt);
    setResult(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const wordCount = promptInput.trim() ? promptInput.trim().split(/\s+/).length : 0;
  const charCount = promptInput.length;

  return {
    promptInput,
    setPromptInput,
    wordCount,
    charCount,
    isAnalyzing,
    result,
    error,
    selectedLevel,
    setSelectedLevel,
    history,
    handleAnalyze,
    handleClear,
    loadExample,
    clearHistory,
    loadHistoryItem,
  };
}
