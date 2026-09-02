import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, MessageSquare, Plus, Key, Cpu, Send, Square, Copy,
  Trash2, RefreshCw, Check, Bot, User as UserIcon, Zap, AlertCircle,
  Menu, X, Shield, ChevronDown, HelpCircle, Download, Search, Eraser,
  Hash, Type, Mic, MicOff, Volume2, VolumeX, Pin, Sliders, Wand2, ChevronLeft, ArrowLeft, Home,
  PanelLeftClose, PanelLeftOpen, Clock, Calendar, Rocket, Brain, Palette, Flame
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import FormattedText from "@/components/chat/FormattedText";
import LiquidBackground from "@/components/LiquidBackground";
import Header from "@/components/Header";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSEO } from "@/hooks/use-seo";
import { AI_PROVIDERS, getProviderInfo, streamAIChat } from "../aiProviders";
import { PERSONALITIES, DEFAULT_PERSONALITY } from "../personalities";
import { loadAPIKeys, saveAPIKeys, loadConversations, saveConversations, loadCurrency, saveCurrency } from "../storage";
import { AIProviderId, APIKeysMap, ChatMessage, Conversation, PersonalityConfig, TokenUsage, CURRENCIES } from "../types";
import { PersonalityModal } from "./PersonalityModal";
import { APIKeysModal } from "./APIKeysModal";
import { LocalSetupGuideModal } from "./LocalSetupGuideModal";
import { AIChatHelpModal } from "./AIChatHelpModal";
import { TokenBadge } from "./TokenBadge";
import { useToast } from "@/hooks/use-toast";

// ── Typing indicator component ──
const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1.5 py-1 px-1">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="h-2 w-2 rounded-full bg-primary/70"
        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
      />
    ))}
    <span className="text-[11px] text-muted-foreground ml-1 font-semibold italic">Thinking…</span>
  </div>
);

// ── Audio Equalizer Waveform for TTS ──
const AudioEqualizerWave: React.FC = () => (
  <div className="flex items-center gap-0.5 h-3 px-1">
    {[4, 12, 7, 10].map((h, i) => (
      <motion.span
        key={i}
        className="w-0.5 bg-amber-400 rounded-full"
        animate={{ height: ["4px", "12px", "4px"] }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          delay: i * 0.12,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

// ── Magic Action Chips (Quick Tool Prefix Chips) ──
const MAGIC_ACTION_CHIPS = [
  { icon: "📝", label: "Summarize", prefix: "Please summarize the following text concisely with bullet points:\n\n" },
  { icon: "🌐", label: "Translate", prefix: "Please translate the following text to clear, natural English:\n\n" },
  { icon: "🐛", label: "Fix Bug", prefix: "Please analyze and fix bugs in this code snippet:\n\n" },
  { icon: "✏️", label: "Polish", prefix: "Please polish the grammar and improve the tone of this text:\n\n" },
  { icon: "👔", label: "Make Formal", prefix: "Please rewrite this to sound professional, executive, and formal:\n\n" },
  { icon: "🎨", label: "Simplify (ELI5)", prefix: "Please explain this in very simple, beginner-friendly terms (ELI5):\n\n" },
  { icon: "💡", label: "Brainstorm", prefix: "Please brainstorm 5 creative and actionable ideas for:\n\n" },
  { icon: "🎭", label: "Roleplay", prefix: "Let's roleplay a realistic scenario where you act as:\n\n" },
];

// ── Categorized Prompt Starters Bento Grid for Empty State ──
const BENTO_PROMPT_CATEGORIES = [
  {
    category: "💻 Code & Architecture",
    icon: <Cpu className="h-4 w-4 text-cyan-400" />,
    gradient: "from-cyan-500/10 to-blue-500/10 border-cyan-500/20",
    items: [
      { icon: "⚡", title: "Build Full-Stack API", prompt: "Write a complete Express + TypeScript REST API endpoint with Zod validation, JWT authentication, and structured error handling." },
      { icon: "🐛", title: "Debug React Performance", prompt: "How do I profile and eliminate unnecessary React component re-renders using useMemo, useCallback, and React DevTools?" },
    ],
  },
  {
    category: "🚀 Product & Startup",
    icon: <Rocket className="h-4 w-4 text-purple-400" />,
    gradient: "from-purple-500/10 to-pink-500/10 border-purple-500/20",
    items: [
      { icon: "🎯", title: "MVP in 7 Days", prompt: "How should I validate a SaaS business idea in 7 days with zero initial ad budget? Give me a day-by-day action plan." },
      { icon: "📈", title: "Viral Growth Tactics", prompt: "Give me 5 unconventional, high-impact growth hacking tactics for a consumer web application." },
    ],
  },
  {
    category: "🧠 Mindset & Wisdom",
    icon: <Brain className="h-4 w-4 text-amber-400" />,
    gradient: "from-amber-500/10 to-orange-500/10 border-amber-500/20",
    items: [
      { icon: "🏛️", title: "Stoic Resilience", prompt: "How would Marcus Aurelius advise dealing with overwhelming daily stress, difficult people, and uncertainty?" },
      { icon: "⏱️", title: "Deep Work Routine", prompt: "Design an optimal 4-hour daily Deep Work routine for maximum cognitive focus and productivity." },
    ],
  },
  {
    category: "🎨 Creative & Story",
    icon: <Palette className="h-4 w-4 text-emerald-400" />,
    gradient: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
    items: [
      { icon: "🌌", title: "Cyberpunk Novel Scene", prompt: "Write an atmospheric, suspenseful opening scene for a cyberpunk sci-fi novel set in Tokyo in 2099." },
      { icon: "🎭", title: "Thought-Provoking Debate", prompt: "Let's have a friendly philosophical debate: Is artificial intelligence capable of genuine creativity or just advanced mimicry?" },
    ],
  },
];

// ── Time formatter ──
function formatRelativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Word count helper ──
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ── Export conversation as Markdown ──
function exportConversationAsMarkdown(conv: Conversation) {
  const lines: string[] = [];
  lines.push(`# ${conv.title}`);
  lines.push("");
  lines.push(`**Personality:** ${conv.personality.icon} ${conv.personality.name}`);
  lines.push(`**Created:** ${new Date(conv.createdAt).toLocaleString()}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const msg of conv.messages) {
    const sender = msg.sender === "user" ? "**You**" : `**${conv.personality.name}**`;
    const time = new Date(msg.timestamp).toLocaleTimeString();
    lines.push(`### ${sender} — ${time}`);
    lines.push("");
    lines.push(msg.content);
    lines.push("");
  }

  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${conv.title.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 40)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export const AIChatPage: React.FC = () => {
  const navigate = useNavigate();
  useSEO({
    title: "AI Chat Studio - Multi-Provider Intelligent Companion",
    description: "Chat with OpenAI, Gemini, Claude, Groq, Ollama, LM Studio with rich personalities, local privacy, and speech synthesis.",
  });

  const onlineCount = useOnlineCount();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<APIKeysMap>(loadAPIKeys);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(loadCurrency);

  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>("openai");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelInput, setCustomModelInput] = useState("");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [showTuning, setShowTuning] = useState(false);

  const handleCurrencyChange = (code: string) => {
    setSelectedCurrency(code);
    saveCurrency(code);
    const curr = CURRENCIES.find((c) => c.code === code);
    toast({ title: "💱 Currency Changed", description: `Display currency set to ${curr?.name || code}.` });
  };

  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);

  // Voice Input (Speech-to-Text) State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>("");

  // Text-to-Speech (TTS) State
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Modals
  const [showPersonalityModal, setShowPersonalityModal] = useState(false);
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [showLocalGuideModal, setShowLocalGuideModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const [isSidebarOpenDesktop, setIsSidebarOpenDesktop] = useState<boolean>(() => {
    const saved = localStorage.getItem("aichat_sidebar_desktop_open");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSidebarDesktop = () => {
    setIsSidebarOpenDesktop((prev) => {
      const next = !prev;
      localStorage.setItem("aichat_sidebar_desktop_open", JSON.stringify(next));
      return next;
    });
  };

  // Keyboard shortcut Ctrl+\ or Cmd+\ to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        toggleSidebarDesktop();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  // Filtered conversations for search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.personality.name.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Timeline grouping (Pinned, Today, Previous 7 Days, Older)
  const timelineGroups = useMemo(() => {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const SEVEN_DAYS = 7 * ONE_DAY;

    const pinned = filteredConversations.filter((c) => c.isPinned);
    const unpinned = filteredConversations.filter((c) => !c.isPinned);

    const today: Conversation[] = [];
    const past7Days: Conversation[] = [];
    const older: Conversation[] = [];

    unpinned.forEach((c) => {
      const age = now - (c.updatedAt || c.createdAt);
      if (age < ONE_DAY) {
        today.push(c);
      } else if (age < SEVEN_DAYS) {
        past7Days.push(c);
      } else {
        older.push(c);
      }
    });

    return { pinned, today, past7Days, older };
  }, [filteredConversations]);

  // Persist conversations
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Persist keys
  const handleSaveKeys = (keys: APIKeysMap) => {
    setApiKeys(keys);
    saveAPIKeys(keys);
    toast({ title: "🔑 Keys Saved", description: "Your API keys have been updated locally." });
  };

  // Handle scroll detection for jump-to-bottom button
  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isUp = target.scrollHeight - target.scrollTop - target.clientHeight > 120;
    setShowScrollBottomBtn(isUp);
  };

  // Scroll to bottom on new messages if not scrolled far up
  useEffect(() => {
    if (!showScrollBottomBtn) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConv?.messages, isGenerating, showScrollBottomBtn]);

  // Clean up speech synthesis when active conversation changes
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }
  }, [activeConvId]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Update selected model when provider changes
  const handleProviderChange = (providerId: AIProviderId) => {
    setSelectedProvider(providerId);
    setSelectedModel("");
    setIsCustomModel(false);
    setCustomModelInput("");
  };

  // Toggle Pin Conversation
  const handleTogglePin = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  // Delete Conversation
  const handleDeleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConvId === convId) {
      setActiveConvId(null);
    }
  };

  // Clear All Conversations
  const handleClearAll = () => {
    setConversations([]);
    setActiveConvId(null);
    setShowClearConfirm(false);
    toast({ title: "Conversations Cleared", description: "All chat sessions deleted." });
  };

  // Voice Input Handler (Speech-to-Text)
  const handleToggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Voice Not Supported",
        description: "Speech Recognition is not supported by your browser. Try Google Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      baseTextRef.current = inputText;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        toast({ title: "🎙️ Listening...", description: "Speak now! Your speech is converting to text." });
      };

      recognition.onresult = (event: any) => {
        let sessionTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          sessionTranscript += event.results[i][0].transcript;
        }
        const base = baseTextRef.current.trim();
        const clean = sessionTranscript.trim();
        setInputText(base ? `${base} ${clean}` : clean);
      };

      recognition.onerror = (err: any) => {
        console.error("Speech recognition error", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // Text-to-Speech (TTS) Read Aloud Handler
  const handleToggleTTS = (msgId: string, text: string) => {
    if (!window.speechSynthesis) {
      toast({ title: "TTS Error", description: "Text-to-Speech is not supported in this browser." });
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/```[\s\S]*?```/g, "Code block omitted.").replace(/[*_#]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Create New Chat (Triggers Personality Selection Modal)
  const handleStartNewChat = () => {
    setShowPersonalityModal(true);
  };

  const handlePersonalitySelected = (personality: PersonalityConfig, aiName?: string, aiAge?: number) => {
    const displayTitle = aiName
      ? `${aiName}${aiAge ? ` (${aiAge} y/o)` : ""} • ${personality.name}`
      : `${personality.name} Chat`;

    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: displayTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      personality,
      providerId: selectedProvider,
      modelName: selectedModel,
      messages: [],
      temperature,
      aiName,
      aiAge,
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setShowSidebarMobile(false);
  };

  // Send Message
  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || inputText).trim();
    if (!textToSend || isGenerating) return;

    let targetConv = activeConv;

    // Auto-create default conversation if none active
    if (!targetConv) {
      targetConv = {
        id: crypto.randomUUID(),
        title: "AI Assistant Chat",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        personality: DEFAULT_PERSONALITY,
        providerId: selectedProvider,
        modelName: selectedModel,
        messages: [],
        temperature,
      };
      setConversations((prev) => [targetConv!, ...prev]);
      setActiveConvId(targetConv.id);
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      content: textToSend,
      timestamp: Date.now(),
    };

    const aiMessageId = crypto.randomUUID();
    const aiPlaceholder: ChatMessage = {
      id: aiMessageId,
      sender: "ai",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
      providerId: selectedProvider,
      modelName: selectedModel,
    };

    const updatedMessages = [...targetConv.messages, userMessage, aiPlaceholder];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConv!.id
          ? {
              ...c,
              title: c.messages.length === 0 ? textToSend.slice(0, 32) + (textToSend.length > 32 ? "..." : "") : c.title,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : c
      )
    );

    if (!overrideText) setInputText("");
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const apiKey = apiKeys[selectedProvider];
      let systemPrompt = targetConv.personality.systemPrompt;
      if (targetConv.aiName || targetConv.aiAge) {
        const namePart = targetConv.aiName ? `Your name is ${targetConv.aiName}.` : "";
        const agePart = targetConv.aiAge ? `You are ${targetConv.aiAge} years old.` : "";
        systemPrompt = `${namePart} ${agePart} ${targetConv.personality.systemPrompt} Always stay in character as ${targetConv.aiName || targetConv.personality.name}.`;
      }

      const usage = await streamAIChat({
        providerId: selectedProvider,
        modelName: selectedModel,
        apiKey,
        customEndpoint: apiKeys.customEndpoint,
        systemPrompt,
        messages: [...targetConv.messages, userMessage],
        temperature,
        signal: abortControllerRef.current.signal,
        onChunk: (delta) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== targetConv!.id) return c;
              const msgs = c.messages.map((m) =>
                m.id === aiMessageId ? { ...m, content: m.content + delta } : m
              );
              return { ...c, messages: msgs };
            })
          );
        },
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== targetConv!.id) return c;
          const msgs = c.messages.map((m) =>
            m.id === aiMessageId ? { ...m, isStreaming: false, usage } : m
          );
          return { ...c, messages: msgs };
        })
      );
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast({ title: "Generation Error", description: err.message, variant: "destructive" });
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConv!.id) return c;
            const msgs = c.messages.map((m) =>
              m.id === aiMessageId
                ? { ...m, isStreaming: false, error: err.message || "Failed to generate response." }
                : m
            );
            return { ...c, messages: msgs };
          })
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  // Regenerate Response
  const handleRegenerate = async (aiMsgId: string) => {
    if (!activeConv || isGenerating) return;
    const aiMsgIdx = activeConv.messages.findIndex((m) => m.id === aiMsgId);
    if (aiMsgIdx <= 0) return;

    const userMsg = activeConv.messages[aiMsgIdx - 1];
    if (userMsg.sender !== "user") return;

    const previousMessages = activeConv.messages.slice(0, aiMsgIdx);
    const newAiMessageId = crypto.randomUUID();
    const newAiMsg: ChatMessage = {
      id: newAiMessageId,
      sender: "ai",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
      providerId: selectedProvider,
      modelName: selectedModel,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id ? { ...c, messages: [...previousMessages, newAiMsg] } : c
      )
    );

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const apiKey = apiKeys[selectedProvider];
      let systemPrompt = activeConv.personality.systemPrompt;
      if (activeConv.aiName || activeConv.aiAge) {
        const namePart = activeConv.aiName ? `Your name is ${activeConv.aiName}.` : "";
        const agePart = activeConv.aiAge ? `You are ${activeConv.aiAge} years old.` : "";
        systemPrompt = `${namePart} ${agePart} ${activeConv.personality.systemPrompt} Always stay in character as ${activeConv.aiName || activeConv.personality.name}.`;
      }

      const usage = await streamAIChat({
        providerId: selectedProvider,
        modelName: selectedModel,
        apiKey,
        customEndpoint: apiKeys.customEndpoint,
        systemPrompt,
        messages: previousMessages,
        temperature,
        signal: abortControllerRef.current.signal,
        onChunk: (delta) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeConv.id) return c;
              const msgs = c.messages.map((m) =>
                m.id === newAiMessageId ? { ...m, content: m.content + delta } : m
              );
              return { ...c, messages: msgs };
            })
          );
        },
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConv.id) return c;
          const msgs = c.messages.map((m) =>
            m.id === newAiMessageId ? { ...m, isStreaming: false, usage } : m
          );
          return { ...c, messages: msgs };
        })
      );
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Delete Single Message
  const handleDeleteMessage = (msgId: string) => {
    if (!activeConv) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? { ...c, messages: c.messages.filter((m) => m.id !== msgId) }
          : c
      )
    );
  };

  // Copy Message Content
  const handleCopyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast({ title: "Copied!", description: "Message content copied to clipboard." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Magic action chip click
  const handleMagicChipClick = (prefix: string) => {
    setInputText((prev) => (prev ? `${prefix}${prev}` : prefix));
  };

  const providerInfo = getProviderInfo(selectedProvider);
  const isKeySet = providerInfo.isLocal || !!apiKeys[selectedProvider];

  // Helper render for conversation list item
  const renderConvItem = (conv: Conversation) => {
    const isActive = conv.id === activeConvId;
    return (
      <div
        key={conv.id}
        onClick={() => {
          setActiveConvId(conv.id);
          setShowSidebarMobile(false);
        }}
        className={cn(
          "p-2.5 rounded-2xl cursor-pointer border flex items-center justify-between text-xs transition-all group relative overflow-hidden",
          isActive
            ? "bg-primary/15 border-primary/50 text-primary font-bold shadow-md shadow-primary/10"
            : "bg-secondary/20 border-transparent hover:bg-secondary/60 text-foreground"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0 p-1 bg-background/50 rounded-xl shadow-xs">{conv.personality.icon}</span>
          <div className="min-w-0">
            <span className="truncate text-xs block font-semibold">{conv.title}</span>
            <span className="text-[9px] text-muted-foreground">{formatRelativeTime(conv.updatedAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => handleTogglePin(conv.id, e)}
            className={cn(
              "p-1 hover:text-amber-400 transition-all rounded-lg",
              conv.isPinned ? "text-amber-400 opacity-100" : "opacity-0 group-hover:opacity-100 text-muted-foreground"
            )}
            title={conv.isPinned ? "Unpin chat" : "Pin chat to top"}
          >
            <Pin className="h-3.5 w-3.5 fill-current" />
          </button>

          <button
            onClick={(e) => handleDeleteConversation(conv.id, e)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity rounded-lg"
            title="Delete conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-background relative z-0 h-dvh overflow-hidden select-none">
      <LiquidBackground />

      <Header onlineCount={onlineCount} />

      {/* Main Studio Body */}
      <div className="flex flex-1 min-h-0 relative z-10 overflow-hidden">
        {/* Mobile Scrim */}
        <AnimatePresence>
          {showSidebarMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-20 lg:hidden"
              onClick={() => setShowSidebarMobile(false)}
            />
          )}
        </AnimatePresence>

        {/* ─────────── SIDEBAR ─────────── */}
        <aside
          className={cn(
            "bg-card/95 border-r border-border/50 flex flex-col justify-between backdrop-blur-2xl transition-all duration-300 z-30 shrink-0 shadow-xl",
            "absolute inset-y-0 left-0 lg:static",
            showSidebarMobile ? "translate-x-0 shadow-2xl w-80 p-4" : "-translate-x-full lg:translate-x-0",
            isSidebarOpenDesktop
              ? "lg:w-80 lg:p-4 lg:opacity-100"
              : "lg:w-0 lg:p-0 lg:opacity-0 lg:overflow-hidden lg:border-none"
          )}
        >
          {/* Top: Header + New Chat + Timeline Controls */}
          <div className="space-y-3.5 overflow-hidden flex flex-col flex-1 min-h-0">
            {/* Top Sidebar Header Row */}
            <div className="flex items-center justify-between pb-2 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-primary/20">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-foreground font-display block">AI Studio Hub</span>
                  <span className="text-[9px] text-muted-foreground font-medium">{conversations.length} sessions stored</span>
                </div>
              </div>

              <button
                onClick={toggleSidebarDesktop}
                className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border/50 transition-all active:scale-95"
                title="Collapse sidebar (Ctrl + \)"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
                <span className="text-[10px]">Hide</span>
              </button>

              <button
                onClick={() => setShowSidebarMobile(false)}
                className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                title="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 shrink-0">
              <Button
                onClick={handleStartNewChat}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-pink-600 font-extrabold text-white text-xs shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>+ New AI Conversation</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate("/chat")}
                className="w-full h-8 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/15 text-primary font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Stranger Chat</span>
              </Button>
            </div>

            {/* Provider & Model Selectors Card */}
            <div className="p-3 rounded-2xl bg-secondary/40 border border-border/50 space-y-2 shrink-0 backdrop-blur-sm shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                  <Cpu className="h-3 w-3 text-primary" />
                  <span>Engine & Provider</span>
                </span>
                <button
                  onClick={() => setShowKeysModal(true)}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all",
                    isKeySet
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                      : "text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse"
                  )}
                >
                  <Key className="h-3 w-3" />
                  <span>{isKeySet ? "Key Ready" : "Set Key"}</span>
                </button>
              </div>

              <select
                value={selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value as AIProviderId)}
                className="w-full h-8.5 rounded-xl bg-card border border-border/70 text-xs font-bold text-foreground px-2.5 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                {AI_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isLocal ? "🏠" : ""}
                  </option>
                ))}
              </select>

              {providerInfo.isLocal && (
                <button
                  onClick={() => setShowLocalGuideModal(true)}
                  className="w-full py-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all flex items-center justify-center gap-1"
                >
                  <Zap className="h-3 w-3" />
                  <span>Local Setup (Ollama / LM Studio)</span>
                </button>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">
                  Model
                </span>
                <button
                  onClick={() => setShowTuning(!showTuning)}
                  className="text-[10px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <Sliders className="h-3 w-3" />
                  <span>Tune ({temperature})</span>
                </button>
              </div>

              <select
                value={isCustomModel ? "__custom__" : selectedModel}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setIsCustomModel(true);
                  } else {
                    setIsCustomModel(false);
                    setSelectedModel(e.target.value);
                  }
                }}
                className="w-full h-8.5 rounded-xl bg-card border border-border/70 text-xs font-semibold text-foreground px-2.5 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                <option value="">✨ Auto-Detect (Recommended)</option>
                {providerInfo.availableModels
                  .filter((m) => m !== "")
                  .map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                <option value="__custom__">✏️ Custom Model Name...</option>
              </select>

              {isCustomModel && (
                <input
                  type="text"
                  value={customModelInput}
                  onChange={(e) => {
                    setCustomModelInput(e.target.value);
                    setSelectedModel(e.target.value);
                  }}
                  placeholder="Enter model name..."
                  className="w-full h-8 mt-1 px-2.5 rounded-xl bg-card border border-border/70 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                />
              )}

              {/* Temperature Slider Panel */}
              <AnimatePresence>
                {showTuning && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pt-2 border-t border-border/40 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground">Creativity / Temp</span>
                      <span className="text-primary">{temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[9px] font-semibold text-muted-foreground">
                      <button onClick={() => setTemperature(0.2)} className="hover:text-foreground">🎯 0.2</button>
                      <button onClick={() => setTemperature(0.7)} className="hover:text-foreground">⚖️ 0.7</button>
                      <button onClick={() => setTemperature(1.0)} className="hover:text-foreground">🎨 1.0</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Conversations */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full h-8 pl-8.5 pr-8 rounded-xl bg-card border border-border/60 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Timeline Conversation List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
              {/* Pinned Section */}
              {timelineGroups.pinned.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 px-1">
                    <Pin className="h-3 w-3 fill-current" /> Pinned ({timelineGroups.pinned.length})
                  </span>
                  {timelineGroups.pinned.map(renderConvItem)}
                </div>
              )}

              {/* Today Section */}
              {timelineGroups.today.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 px-1">
                    <Clock className="h-3 w-3" /> Today
                  </span>
                  {timelineGroups.today.map(renderConvItem)}
                </div>
              )}

              {/* Previous 7 Days */}
              {timelineGroups.past7Days.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 px-1">
                    <Calendar className="h-3 w-3" /> Previous 7 Days
                  </span>
                  {timelineGroups.past7Days.map(renderConvItem)}
                </div>
              )}

              {/* Older Section */}
              {timelineGroups.older.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 px-1">
                    Older
                  </span>
                  {timelineGroups.older.map(renderConvItem)}
                </div>
              )}

              {filteredConversations.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-6 italic">
                  {searchQuery ? `No sessions match "${searchQuery}"` : "No conversations yet."}
                </p>
              )}
            </div>
          </div>

          {/* Bottom Sidebar Footer */}
          <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground/80 shrink-0">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Zero logs stored</span>
            </span>
            {conversations.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </aside>

        {/* ─────────── MAIN CHAT CANVAS ─────────── */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-background/50 relative">
          {/* Top Bar Header */}
          <div className="h-14 px-3 sm:px-4 border-b border-border/40 flex items-center justify-between bg-card/70 backdrop-blur-xl shrink-0 z-10 shadow-xs gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
              {/* Mobile Sidebar Toggle */}
              <button
                onClick={() => setShowSidebarMobile(!showSidebarMobile)}
                className="lg:hidden p-2 rounded-xl bg-secondary border border-border/60 text-foreground shrink-0"
                title="Toggle menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* Desktop Sidebar Toggle */}
              <button
                onClick={toggleSidebarDesktop}
                className={cn(
                  "hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shrink-0 shadow-xs",
                  isSidebarOpenDesktop
                    ? "bg-secondary/80 hover:bg-secondary border-border/60 text-muted-foreground hover:text-foreground"
                    : "bg-primary text-primary-foreground border-primary shadow-primary/20 hover:opacity-90"
                )}
                title={isSidebarOpenDesktop ? "Collapse sidebar (Ctrl + \\)" : "Expand sidebar (Ctrl + \\)"}
              >
                {isSidebarOpenDesktop ? (
                  <>
                    <PanelLeftClose className="h-4 w-4" />
                    <span className="hidden xl:inline text-[11px]">Hide</span>
                  </>
                ) : (
                  <>
                    <PanelLeftOpen className="h-4 w-4" />
                    <span className="text-[11px]">Sidebar</span>
                  </>
                )}
              </button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="h-8 w-8 rounded-xl border border-primary/30 bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 flex items-center justify-center shrink-0 p-0"
                title="Go to Home"
              >
                <Home className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/chat")}
                className="h-8 px-2 sm:px-3 rounded-xl border border-primary/30 bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 gap-1 shrink-0"
                title="Return to Live Chat"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Live Chat</span>
              </Button>

              {activeConv ? (
                <div className="flex items-center gap-2 min-w-0 max-w-[120px] xs:max-w-[160px] sm:max-w-[240px] md:max-w-xs">
                  <span className="text-xl shrink-0 p-1 bg-background/50 rounded-xl shadow-xs">{activeConv.personality.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h2 className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {activeConv.title}
                      </h2>
                      {activeConv.isPinned && <Pin className="h-3 w-3 text-amber-400 fill-current shrink-0" />}
                    </div>
                    <p className="text-[10px] text-primary font-semibold truncate">
                      {activeConv.personality.name} • {providerInfo.name} ({selectedModel || "Auto"})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className="text-xs font-bold text-foreground">AI Studio</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Currency Selector Pill */}
              <select
                value={selectedCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="h-8 rounded-xl bg-secondary/80 border border-border/60 text-[10px] sm:text-[11px] font-bold text-foreground px-1.5 sm:px-2 focus:outline-none focus:ring-1 focus:ring-primary shrink-0 max-w-[70px] sm:max-w-none"
                title="Change display currency"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>

              {/* Export Chat Button */}
              {activeConv && activeConv.messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportConversationAsMarkdown(activeConv);
                    toast({ title: "📥 Exported", description: `Saved "${activeConv.title}.md" to Downloads.` });
                  }}
                  className="rounded-xl text-xs font-bold h-8 px-2 sm:px-3 gap-1 border-border/60 text-foreground hover:bg-secondary/60 shrink-0"
                  title="Export chat as Markdown"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelpModal(true)}
                className="rounded-xl text-xs font-bold h-8 px-2 sm:px-3 gap-1 border-border/60 text-foreground hover:bg-secondary/60 shrink-0"
              >
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <span className="hidden md:inline">Guide</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKeysModal(true)}
                className={cn(
                  "rounded-xl text-xs font-bold h-8 px-2 sm:px-3 gap-1 transition-all shrink-0",
                  isKeySet
                    ? "border-primary/30 text-primary hover:bg-primary/10"
                    : "border-amber-500/40 text-amber-400 bg-amber-500/10 animate-pulse"
                )}
              >
                <Key className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isKeySet ? "Keys" : "Setup Keys"}</span>
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
            className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 relative"
          >
            {!activeConv || activeConv.messages.length === 0 ? (
              /* ── Empty State: Futuristic Studio Hero + Bento Grid ── */
              <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-2xl mx-auto space-y-6 animate-fade-in py-4 sm:py-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="relative"
                >
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gradient-to-tr from-primary via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-2xl shadow-primary/30">
                    <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
                  </div>
                  <div className="absolute -inset-2 rounded-3xl bg-primary/20 blur-xl -z-10 animate-pulse" />
                </motion.div>

                <div className="space-y-1.5">
                  <h1 className="text-xl sm:text-3xl font-black font-display text-foreground tracking-tight">
                    Welcome to AI Studio
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Connect with {PERSONALITIES.length} specialized intelligence personas across OpenAI, Gemini, Claude, Groq, or local Ollama servers.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    onClick={handleStartNewChat}
                    className="rounded-2xl px-6 h-11 font-extrabold text-xs bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Select Persona & Start 🚀
                  </Button>
                </div>

                {/* Persona Quick Chips */}
                <div className="w-full pt-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">
                    Popular Personas:
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {PERSONALITIES.slice(0, 6).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handlePersonalitySelected(p)}
                        className="px-3 py-1.5 rounded-xl bg-card/80 border border-border/60 hover:border-primary/50 text-[11px] font-bold text-foreground hover:bg-primary/10 transition-all flex items-center gap-1.5 shadow-xs backdrop-blur-sm active:scale-95"
                      >
                        <span>{p.icon}</span>
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categorized Prompt Starters Bento Grid */}
                <div className="w-full pt-2 space-y-3 text-left">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider text-center">
                    Or start instantly with a prompt:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {BENTO_PROMPT_CATEGORIES.map((cat) => (
                      <div
                        key={cat.category}
                        className={cn(
                          "p-3 rounded-2xl border bg-card/60 backdrop-blur-md space-y-2 shadow-xs transition-all hover:bg-card/90",
                          cat.gradient
                        )}
                      >
                        <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                          {cat.icon}
                          <span className="text-xs font-black text-foreground">{cat.category}</span>
                        </div>
                        <div className="space-y-1.5">
                          {cat.items.map((item) => (
                            <button
                              key={item.title}
                              onClick={() => handleSend(item.prompt)}
                              className="w-full p-2 rounded-xl bg-secondary/40 hover:bg-primary/15 border border-border/40 hover:border-primary/40 text-left transition-all group flex items-start gap-2 active:scale-[0.98]"
                            >
                              <span className="text-sm shrink-0">{item.icon}</span>
                              <div className="min-w-0">
                                <span className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors block truncate">
                                  {item.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground line-clamp-1">
                                  {item.prompt}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Chat Messages ── */
              activeConv.messages.map((msg) => {
                const isUser = msg.sender === "user";
                const isLastAi = !isUser && msg.isStreaming;
                const isHovered = hoveredMsgId === msg.id;
                const isSpeakingThis = speakingMsgId === msg.id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={cn(
                      "flex gap-2 sm:gap-3 max-w-3xl",
                      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                    onMouseEnter={() => setHoveredMsgId(msg.id)}
                    onMouseLeave={() => setHoveredMsgId(null)}
                  >
                    {/* Avatar Badge */}
                    <div
                      className={cn(
                        "h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-2xl flex items-center justify-center text-xs shrink-0 font-bold shadow-md transition-shadow duration-300",
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-gradient-to-tr from-purple-600 via-primary to-pink-500 text-white",
                        isLastAi && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/30"
                      )}
                    >
                      {isUser ? <UserIcon className="h-4 w-4" /> : activeConv.personality.icon}
                    </div>

                    {/* Content Box */}
                    <div className="flex flex-col min-w-0 max-w-[86%] sm:max-w-[88%]">
                      <div
                        className={cn(
                          "p-3 sm:p-4 rounded-3xl text-xs leading-relaxed shadow-sm border break-words [overflow-wrap:anywhere]",
                          isUser
                            ? "bg-gradient-to-r from-primary to-purple-600 text-primary-foreground border-primary/20 rounded-tr-none shadow-md shadow-primary/10"
                            : "bg-card/95 text-foreground border-border/60 backdrop-blur-2xl rounded-tl-none shadow-xs"
                        )}
                      >
                        {msg.content ? (
                          <>
                            <FormattedText text={msg.content} />
                            {/* Streaming cursor */}
                            {isLastAi && (
                              <motion.span
                                className="inline-block w-1.5 h-4 bg-primary ml-1 align-middle rounded-full"
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                              />
                            )}
                          </>
                        ) : isLastAi ? (
                          <TypingIndicator />
                        ) : (
                          <span className="italic text-muted-foreground">Empty response</span>
                        )}

                        {/* Token & Cost Details for AI messages */}
                        {!isUser && msg.usage && (
                          <div className="pt-2 mt-2 border-t border-border/40">
                            <TokenBadge
                              usage={msg.usage}
                              providerName={providerInfo.name}
                              modelName={msg.modelName || selectedModel}
                              currencyCode={selectedCurrency}
                            />
                          </div>
                        )}
                      </div>

                      {/* Floating Actions Toolbar */}
                      <div
                        className={cn(
                          "flex items-center gap-1 sm:gap-1.5 mt-1.5 text-[10px] text-muted-foreground px-1 flex-wrap",
                          isUser ? "justify-end" : "justify-start"
                        )}
                      >
                        {/* Relative time */}
                        <span className="text-[9px] text-muted-foreground/60 mr-1">
                          {formatRelativeTime(msg.timestamp)}
                        </span>

                        {/* Text-to-Speech Button */}
                        {!isUser && msg.content && (
                          <button
                            onClick={() => handleToggleTTS(msg.id, msg.content)}
                            className={cn(
                              "px-2 py-0.5 rounded-lg border flex items-center gap-1 font-bold transition-all",
                              isSpeakingThis
                                ? "text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-xs"
                                : "hover:text-foreground text-muted-foreground border-transparent hover:border-border/50"
                            )}
                            title={isSpeakingThis ? "Stop audio" : "Read aloud (TTS)"}
                          >
                            {isSpeakingThis ? <AudioEqualizerWave /> : <Volume2 className="h-3 w-3" />}
                            <span>{isSpeakingThis ? "Speaking" : "Listen"}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleCopyMessage(msg.content, msg.id)}
                          className="px-2 py-0.5 rounded-lg hover:bg-secondary/60 hover:text-foreground transition-all flex items-center gap-1"
                        >
                          {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                        </button>

                        {!isUser && !isGenerating && (
                          <button
                            onClick={() => handleRegenerate(msg.id)}
                            className="px-2 py-0.5 rounded-lg hover:bg-secondary/60 hover:text-foreground transition-all flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Retry</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="px-2 py-0.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 transition-all flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>

                        {/* Word / Char count on hover */}
                        <AnimatePresence>
                          {isHovered && msg.content && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="text-[9px] text-muted-foreground/50 flex items-center gap-1.5 ml-auto font-mono"
                            >
                              <Type className="h-2.5 w-2.5" />
                              {countWords(msg.content)}w • {msg.content.length}c
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Floating Jump to Latest Button */}
          <AnimatePresence>
            {showScrollBottomBtn && (
              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                onClick={() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="absolute bottom-24 right-6 z-20 px-3.5 py-2 rounded-2xl bg-card/95 border border-primary/50 text-primary shadow-2xl backdrop-blur-xl flex items-center gap-1.5 text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105 active:scale-95"
              >
                <ChevronDown className="h-4 w-4" />
                <span>Jump to Latest</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* ─────────── FLOATING BOTTOM INPUT DOCK ─────────── */}
          <div className="p-2.5 sm:p-4 border-t border-border/40 bg-card/85 backdrop-blur-2xl shrink-0 space-y-2">
            <div className="max-w-3xl mx-auto space-y-2">
              {/* Active Voice Recording Status Bar */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                      <span>🎙️ Listening to your voice... Speak clearly</span>
                    </div>
                    <button
                      onClick={handleToggleVoiceInput}
                      className="text-[10px] underline hover:text-white"
                    >
                      Stop
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Magic Action Tool Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-[10px] font-black uppercase text-muted-foreground/80 flex items-center gap-1 shrink-0 mr-1">
                  <Wand2 className="h-3 w-3 text-primary" /> Magic Tools:
                </span>
                {MAGIC_ACTION_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleMagicChipClick(chip.prefix)}
                    className="px-2.5 py-1 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/50 text-[10px] font-bold text-foreground shrink-0 transition-all flex items-center gap-1 hover:border-primary/40 active:scale-95 shadow-xs"
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>

              {/* Textarea + Mic + Send Controls */}
              <div className="relative flex items-center">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Message ${activeConv?.personality.name || "AI Assistant"}... (Enter to send)`}
                  className="min-h-[50px] max-h-[140px] py-3 pl-3.5 pr-28 sm:pr-32 rounded-2xl bg-card border-border/80 text-xs text-foreground focus:ring-1 focus:ring-primary resize-none shadow-sm font-medium"
                />

                <div className="absolute right-2 flex items-center gap-1 sm:gap-1.5">
                  {/* Voice Input Microphone Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={handleToggleVoiceInput}
                    className={cn(
                      "h-8.5 w-8.5 sm:h-9 sm:w-9 p-0 rounded-xl border border-border/60 transition-all shrink-0",
                      isListening
                        ? "bg-rose-500 text-white border-rose-500 animate-pulse shadow-md shadow-rose-500/30"
                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                    title={isListening ? "Listening... Click to stop" : "Voice-to-Text Speech Input"}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>

                  {/* Send / Stop Button */}
                  {isGenerating ? (
                    <Button
                      size="sm"
                      onClick={handleStopGeneration}
                      className="h-8.5 sm:h-9 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs gap-1 shadow-md shrink-0"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      <span>Stop</span>
                    </Button>
                  ) : (
                    <motion.div
                      animate={inputText.trim() ? { scale: [1, 1.03, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className="rounded-xl shrink-0"
                    >
                      <Button
                        size="sm"
                        onClick={() => handleSend()}
                        disabled={!inputText.trim()}
                        className="h-8.5 sm:h-9 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:opacity-95 text-white font-extrabold text-xs gap-1 shadow-md shadow-primary/20 disabled:opacity-40 transition-all"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send</span>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                <span className="flex items-center gap-1.5 truncate max-w-[65%]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="truncate">
                    Engine: <strong className="text-foreground">{providerInfo.name}</strong> ({selectedModel || "Auto"})
                  </span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={cn("transition-colors font-mono", inputText.length > 3000 ? "text-amber-400 font-bold" : "")}>
                    {inputText.length > 0 ? `${inputText.length} chars` : ""}
                  </span>
                  <span className="hidden sm:inline">Shift + Enter for new line</span>
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <PersonalityModal
        isOpen={showPersonalityModal}
        onClose={() => setShowPersonalityModal(false)}
        onSelectPersonality={handlePersonalitySelected}
      />

      <APIKeysModal
        isOpen={showKeysModal}
        onClose={() => setShowKeysModal(false)}
        apiKeys={apiKeys}
        onSaveKeys={handleSaveKeys}
      />

      <LocalSetupGuideModal
        isOpen={showLocalGuideModal}
        onClose={() => setShowLocalGuideModal(false)}
      />

      <AIChatHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
};

export default AIChatPage;
