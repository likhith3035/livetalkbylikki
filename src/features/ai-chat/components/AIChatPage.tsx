import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, MessageSquare, Plus, Key, Cpu, Send, Square, Copy,
  Trash2, RefreshCw, Check, Bot, User as UserIcon, Zap, AlertCircle,
  Menu, X, Shield, ChevronDown, HelpCircle, Download, Search, Eraser,
  Hash, Type
} from "lucide-react";
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
import { loadAPIKeys, saveAPIKeys, loadConversations, saveConversations } from "../storage";
import { AIProviderId, APIKeysMap, ChatMessage, Conversation, PersonalityConfig, TokenUsage } from "../types";
import { PersonalityModal } from "./PersonalityModal";
import { APIKeysModal } from "./APIKeysModal";
import { LocalSetupGuideModal } from "./LocalSetupGuideModal";
import { AIChatHelpModal } from "./AIChatHelpModal";
import { TokenBadge } from "./TokenBadge";
import { useToast } from "@/hooks/use-toast";

// ── Typing indicator component ──
const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1 py-1">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="h-2 w-2 rounded-full bg-primary/60"
        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
      />
    ))}
    <span className="text-[10px] text-muted-foreground ml-1.5 italic">Thinking…</span>
  </div>
);

// ── Suggestion chips ──
const SUGGESTION_CHIPS = [
  { label: "🧠 Explain quantum computing simply", prompt: "Explain quantum computing in simple terms" },
  { label: "✍️ Write a short poem about stars", prompt: "Write a short poem about stars and the night sky" },
  { label: "💻 Debug my JavaScript code", prompt: "Help me debug a JavaScript function that isn't returning the correct output" },
  { label: "😂 Tell me a clever joke", prompt: "Tell me a clever, original joke that will make me laugh" },
  { label: "📝 Summarize a topic for me", prompt: "Summarize the key concepts of machine learning in 5 bullet points" },
  { label: "🌍 Plan a weekend trip", prompt: "Plan an ideal 2-day weekend trip for someone who loves nature and good food" },
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
  useSEO({
    title: "AI Chat - Multi-Provider Assistant",
    description: "Chat with OpenAI, Gemini, Claude, Ollama, LM Studio and more with custom AI personalities and local key privacy.",
  });

  const onlineCount = useOnlineCount();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<APIKeysMap>(loadAPIKeys);

  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>("openai");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelInput, setCustomModelInput] = useState("");
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);

  // Modals
  const [showPersonalityModal, setShowPersonalityModal] = useState(false);
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [showLocalGuideModal, setShowLocalGuideModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

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

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, isGenerating]);

  // Update selected model when provider changes — defaults to Auto-detect ("")
  const handleProviderChange = (providerId: AIProviderId) => {
    setSelectedProvider(providerId);
    setSelectedModel("");
    setIsCustomModel(false);
    setCustomModelInput("");
  };

  // Create New Chat (Triggers Personality Selection Modal)
  const handleStartNewChat = () => {
    setShowPersonalityModal(true);
  };

  const handlePersonalitySelected = (personality: PersonalityConfig) => {
    const info = getProviderInfo(selectedProvider);
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: `${personality.name} Chat`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      personality,
      providerId: selectedProvider,
      modelName: selectedModel,
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
  };

  // Delete Conversation
  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  };

  // Clear All Conversations
  const handleClearAll = () => {
    setConversations([]);
    setActiveConvId(null);
    setShowClearConfirm(false);
    toast({ title: "🗑️ Cleared", description: "All conversations have been deleted." });
  };

  // Send Message
  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim() || isGenerating) return;

    let conv = activeConv;
    // If no active conversation, create one with default personality
    if (!conv) {
      conv = {
        id: crypto.randomUUID(),
        title: textToSend.trim().slice(0, 30),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        personality: DEFAULT_PERSONALITY,
        providerId: selectedProvider,
        modelName: selectedModel,
        messages: [],
      };
      setConversations((prev) => [conv!, ...prev]);
      setActiveConvId(conv.id);
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    const aiMessageId = crypto.randomUUID();
    const initialAiMessage: ChatMessage = {
      id: aiMessageId,
      sender: "ai",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
      providerId: selectedProvider,
      modelName: selectedModel,
    };

    const updatedMessages = [...conv.messages, userMessage, initialAiMessage];
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv!.id
          ? {
              ...c,
              title: c.messages.length === 0 ? textToSend.trim().slice(0, 30) : c.title,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : c
      )
    );

    const userQuery = textToSend.trim();
    setInputText("");
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();

    try {
      const apiKey = apiKeys[selectedProvider];
      const customEndpoint = apiKeys.customEndpoint;

      const usage = await streamAIChat({
        providerId: selectedProvider,
        modelName: selectedModel,
        apiKey,
        customEndpoint,
        systemPrompt: conv.personality.systemPrompt,
        messages: [...conv.messages, userMessage],
        signal: abortControllerRef.current.signal,
        onChunk: (delta) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== conv!.id) return c;
              const msgs = c.messages.map((m) =>
                m.id === aiMessageId ? { ...m, content: m.content + delta } : m
              );
              return { ...c, messages: msgs };
            })
          );
        },
      });

      // Update AI message upon completion with token usage
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conv!.id) return c;
          const msgs = c.messages.map((m) =>
            m.id === aiMessageId ? { ...m, isStreaming: false, usage } : m
          );
          return { ...c, messages: msgs };
        })
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast({ title: "Stopped", description: "Generation stopped by user." });
      } else {
        const errorText = err?.message || "Failed to generate AI response.";
        toast({ title: "AI Error", description: errorText, variant: "destructive" });
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== conv!.id) return c;
            const msgs = c.messages.map((m) =>
              m.id === aiMessageId
                ? { ...m, isStreaming: false, error: errorText, content: m.content || `⚠️ Error: ${errorText}` }
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

    // Truncate messages up to user message
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
      const usage = await streamAIChat({
        providerId: selectedProvider,
        modelName: selectedModel,
        apiKey,
        customEndpoint: apiKeys.customEndpoint,
        systemPrompt: activeConv.personality.systemPrompt,
        messages: previousMessages,
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

  // Suggestion chip click
  const handleSuggestionClick = (prompt: string) => {
    handleSend(prompt);
  };

  const providerInfo = getProviderInfo(selectedProvider);

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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
              onClick={() => setShowSidebarMobile(false)}
            />
          )}
        </AnimatePresence>

        {/* ─────────── SIDEBAR ─────────── */}
        <aside
          className={cn(
            "w-72 bg-card/90 border-r border-border/50 flex flex-col justify-between p-3.5 backdrop-blur-xl transition-all duration-300 z-30",
            "absolute inset-y-0 left-0 lg:static lg:translate-x-0",
            showSidebarMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Top: New Chat + Controls */}
          <div className="space-y-3">
            <Button
              onClick={handleStartNewChat}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-primary to-purple-600 font-extrabold text-white text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>New AI Conversation</span>
            </Button>

            {/* Provider & Model Selectors */}
            <div className="p-2.5 rounded-2xl bg-secondary/40 border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">AI Provider</span>
                <button
                  onClick={() => setShowKeysModal(true)}
                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Key className="h-3 w-3" />
                  <span>API Keys</span>
                </button>
              </div>

              <select
                value={selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value as AIProviderId)}
                className="w-full h-9 rounded-xl bg-card border border-border/70 text-xs font-semibold text-foreground px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
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
                  <span>Local Setup Guide (Ollama/LM Studio)</span>
                </button>
              )}

              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block pt-1">
                Model (Optional)
              </span>
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
                className="w-full h-9 rounded-xl bg-card border border-border/70 text-xs font-semibold text-foreground px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
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
                  placeholder="Enter model name (e.g. sarvam-2b)..."
                  className="w-full h-8 mt-1 px-2.5 rounded-xl bg-card border border-border/70 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                />
              )}
            </div>

            {/* Search Conversations */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full h-8 pl-8 pr-2 rounded-xl bg-card border border-border/60 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Conversations List Header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-widest">
                Conversations ({filteredConversations.length})
              </span>
              {conversations.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-0.5 transition-colors"
                >
                  <Eraser className="h-3 w-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Clear All Confirmation */}
            <AnimatePresence>
              {showClearConfirm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                    <p className="text-[11px] text-rose-400 font-semibold">Delete all {conversations.length} conversations?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearAll}
                        className="flex-1 py-1.5 rounded-lg bg-rose-500 text-white text-[10px] font-bold hover:bg-rose-600 transition-colors"
                      >
                        Yes, Delete All
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 py-1.5 rounded-lg bg-secondary text-foreground text-[10px] font-bold hover:bg-secondary/80 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Saved Conversations List */}
            <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-1">
              {filteredConversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setShowSidebarMobile(false);
                    }}
                    className={cn(
                      "p-2.5 rounded-2xl cursor-pointer border flex items-center justify-between text-xs transition-all group",
                      isActive
                        ? "bg-primary/15 border-primary/40 text-primary font-bold shadow-sm"
                        : "bg-transparent border-transparent hover:bg-secondary/50 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{conv.personality.icon}</span>
                      <div className="min-w-0">
                        <span className="truncate text-xs block">{conv.title}</span>
                        <span className="text-[9px] text-muted-foreground">{formatRelativeTime(conv.updatedAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

              {filteredConversations.length === 0 && searchQuery && (
                <p className="text-[11px] text-muted-foreground text-center py-4 italic">
                  No conversations match "{searchQuery}"
                </p>
              )}
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="pt-3 border-t border-border/40 flex items-center gap-2 text-[10px] text-muted-foreground/70">
            <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Local API Keys. Zero logs stored.</span>
          </div>
        </aside>

        {/* ─────────── MAIN CHAT ─────────── */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-background/50 relative">
          {/* Top Bar Header */}
          <div className="h-14 px-4 border-b border-border/40 flex items-center justify-between bg-card/60 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setShowSidebarMobile(!showSidebarMobile)}
                className="lg:hidden p-2 rounded-xl bg-secondary border border-border/60 text-foreground"
              >
                <Menu className="h-4 w-4" />
              </button>

              {activeConv ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">{activeConv.personality.icon}</span>
                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {activeConv.title}
                    </h2>
                    <p className="text-[10px] text-primary font-semibold truncate">
                      {activeConv.personality.name} • {providerInfo.name} ({selectedModel || "Auto-Detect"})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className="text-xs font-bold text-foreground">AI Chat Studio</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Export Chat Button */}
              {activeConv && activeConv.messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportConversationAsMarkdown(activeConv);
                    toast({ title: "📥 Exported", description: `Saved "${activeConv.title}.md" to Downloads.` });
                  }}
                  className="rounded-xl text-xs font-bold h-8 gap-1 border-border/60 text-foreground hover:bg-secondary/60"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelpModal(true)}
                className="rounded-xl text-xs font-bold h-8 gap-1 border-border/60 text-foreground hover:bg-secondary/60"
              >
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Help & Guide</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKeysModal(true)}
                className="rounded-xl text-xs font-bold h-8 gap-1 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Key className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Keys</span>
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!activeConv || activeConv.messages.length === 0 ? (
              /* ── Empty State with Suggestion Chips ── */
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto space-y-5">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-primary via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-primary/20"
                >
                  <Sparkles className="h-10 w-10 animate-pulse" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Start an AI Conversation</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Choose from {PERSONALITIES.length} unique AI personalities and connect via any provider.
                  </p>
                </div>
                <Button
                  onClick={handleStartNewChat}
                  className="rounded-2xl px-6 h-11 font-bold text-xs bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                >
                  Choose Personality & Start 🚀
                </Button>

                {/* Suggestion Chips */}
                <div className="w-full pt-2">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2.5">Or try a quick prompt:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTION_CHIPS.map((chip) => (
                      <motion.button
                        key={chip.prompt}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSuggestionClick(chip.prompt)}
                        className="px-3 py-2 rounded-2xl bg-card/80 border border-border/60 text-[11px] font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm backdrop-blur-sm"
                      >
                        {chip.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Messages ── */
              activeConv.messages.map((msg, idx) => {
                const isUser = msg.sender === "user";
                const isLastAi = !isUser && msg.isStreaming;
                const isHovered = hoveredMsgId === msg.id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={cn(
                      "flex gap-3 max-w-3xl",
                      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                    onMouseEnter={() => setHoveredMsgId(msg.id)}
                    onMouseLeave={() => setHoveredMsgId(null)}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold shadow-sm transition-shadow duration-300",
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-gradient-to-tr from-purple-500 to-pink-500 text-white",
                        isLastAi && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/30"
                      )}
                    >
                      {isUser ? <UserIcon className="h-4 w-4" /> : activeConv.personality.icon}
                    </div>

                    {/* Content Box */}
                    <div className="flex flex-col min-w-0 max-w-[85%]">
                      <div
                        className={cn(
                          "p-3.5 rounded-3xl text-xs leading-relaxed shadow-sm border",
                          isUser
                            ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-none"
                            : "bg-card/90 text-foreground border-border/60 backdrop-blur-xl rounded-tl-none"
                        )}
                      >
                        {msg.content ? (
                          <>
                            <FormattedText text={msg.content} />
                            {/* Streaming cursor */}
                            {isLastAi && (
                              <motion.span
                                className="inline-block w-[2px] h-4 bg-primary ml-0.5 align-middle"
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                              />
                            )}
                          </>
                        ) : isLastAi ? (
                          <TypingIndicator />
                        ) : (
                          <span className="italic text-muted-foreground">Empty message</span>
                        )}

                        {/* Token / Cost Details for AI messages */}
                        {!isUser && msg.usage && (
                          <TokenBadge
                            usage={msg.usage}
                            providerName={providerInfo.name}
                            modelName={msg.modelName || selectedModel}
                          />
                        )}
                      </div>

                      {/* Actions Dock */}
                      <div
                        className={cn(
                          "flex items-center gap-2 mt-1 text-[10px] text-muted-foreground px-1 flex-wrap",
                          isUser ? "justify-end" : "justify-start"
                        )}
                      >
                        {/* Relative time — shown on hover */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.span
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 0.7, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-[9px] text-muted-foreground/60 mr-1"
                            >
                              {formatRelativeTime(msg.timestamp)}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        <button
                          onClick={() => handleCopyMessage(msg.content, msg.id)}
                          className="hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                        </button>

                        {!isUser && !isGenerating && (
                          <button
                            onClick={() => handleRegenerate(msg.id)}
                            className="hover:text-foreground transition-colors flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Regenerate</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="hover:text-rose-400 transition-colors flex items-center gap-1"
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
                              className="text-[9px] text-muted-foreground/50 flex items-center gap-1.5 ml-auto"
                            >
                              <Type className="h-2.5 w-2.5" />
                              {countWords(msg.content)} words
                              <Hash className="h-2.5 w-2.5 ml-0.5" />
                              {msg.content.length} chars
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

          {/* ─────────── BOTTOM INPUT BAR ─────────── */}
          <div className="p-3 sm:p-4 border-t border-border/40 bg-card/60 backdrop-blur-xl shrink-0">
            <div className="max-w-3xl mx-auto space-y-2">
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
                  placeholder={`Ask ${activeConv?.personality.name || "AI"} anything... (Press Enter)`}
                  className="min-h-[50px] max-h-[140px] py-3 pl-4 pr-28 rounded-2xl bg-card border-border/80 text-xs text-foreground focus:ring-1 focus:ring-primary resize-none shadow-sm"
                />

                <div className="absolute right-2 flex items-center gap-1.5">
                  {isGenerating ? (
                    <Button
                      size="sm"
                      onClick={handleStopGeneration}
                      className="h-9 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs gap-1 shadow-md"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      <span>Stop</span>
                    </Button>
                  ) : (
                    <motion.div
                      animate={inputText.trim() ? { boxShadow: "0 0 12px 2px hsl(var(--primary) / 0.3)" } : { boxShadow: "0 0 0px 0px transparent" }}
                      transition={{ duration: 0.3 }}
                      className="rounded-xl"
                    >
                      <Button
                        size="sm"
                        onClick={() => handleSend()}
                        disabled={!inputText.trim()}
                        className="h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1 shadow-md disabled:opacity-40 transition-all"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send</span>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                <span>
                  Active: <strong className="text-foreground">{providerInfo.name}</strong> ({selectedModel || "Auto-Detect"})
                </span>
                <span className="flex items-center gap-2">
                  <span className={cn("transition-colors", inputText.length > 3000 ? "text-amber-400 font-bold" : "")}>
                    {inputText.length > 0 ? `${inputText.length} chars` : ""}
                  </span>
                  <span>Shift + Enter for newline</span>
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
