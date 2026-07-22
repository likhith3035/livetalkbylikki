import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle, X, Sparkles, Cpu, Key, ShieldCheck, Zap, Terminal,
  ExternalLink, MessageSquare, Flame, BookOpen, Layers, CheckCircle2,
  Copy, Check, ChevronRight, Laptop, Monitor, Play, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AIChatHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type StepId = 1 | 2 | 3 | 4 | 5;
type OSType = "windows" | "mac" | "linux";

export const AIChatHelpModal: React.FC<AIChatHelpModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [selectedOS, setSelectedOS] = useState<OSType>("windows");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const steps = [
    { number: 1, title: "1. Pick AI Persona", icon: Flame },
    { number: 2, title: "2. Choose Provider", icon: Layers },
    { number: 3, title: "3. Connect Local AI (Free)", icon: Cpu },
    { number: 4, title: "4. Chat Features", icon: MessageSquare },
    { number: 5, title: "5. Privacy & Security", icon: ShieldCheck },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative z-10 w-full max-w-3xl bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-primary via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                    Beginner's Step-by-Step AI Guide
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Easy 5-step tutorial on using AI personas, cloud keys, and free local AI models.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Interactive Step Progress Bar */}
            <div className="grid grid-cols-5 gap-1.5 p-1.5 rounded-2xl bg-secondary/40 border border-border/40 mb-4 shrink-0">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isPassed = currentStep > step.number;
                return (
                  <button
                    key={step.number}
                    onClick={() => setCurrentStep(step.number as StepId)}
                    className={cn(
                      "py-2 px-1.5 rounded-xl text-[11px] font-extrabold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-center select-none",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                        : isPassed
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate hidden sm:inline">{step.title}</span>
                    <span className="sm:hidden">S{step.number}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Interactive Wizard Body */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
              {/* STEP 1: PICK PERSONA */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎭</span>
                      <div>
                        <h3 className="font-extrabold text-sm text-foreground">Step 1: Pick an AI Personality</h3>
                        <p className="text-[11px] text-muted-foreground">Every AI conversation can have a unique tone, style, and persona.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          🤖 Assistant
                        </span>
                        <p className="text-[11px] text-muted-foreground">Professional, concise, accurate, and direct helper for daily tasks.</p>
                      </div>

                      <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1">
                        <span className="font-bold text-primary flex items-center gap-1.5">
                          🔥 Flirty & Intimate Companion
                        </span>
                        <p className="text-[11px] text-muted-foreground">Playful, charming, romantic, affectionate, and deeply engaging companion.</p>
                      </div>

                      <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          💻 Coding Expert
                        </span>
                        <p className="text-[11px] text-muted-foreground">Senior full-stack engineer for clean code snippets and debugging.</p>
                      </div>

                      <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          ✨ Custom Personality
                        </span>
                        <p className="text-[11px] text-muted-foreground">Define your own custom persona name and system prompt rules!</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PROVIDERS */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🌐</span>
                      <div>
                        <h3 className="font-extrabold text-sm text-foreground">Step 2: Choose Cloud vs Local AI</h3>
                        <p className="text-[11px] text-muted-foreground">Select where your AI model runs (Cloud API or Local Hardware).</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 rounded-xl bg-card border border-border/40 space-y-2">
                        <span className="font-bold text-primary text-xs flex items-center gap-1">
                          ☁️ Cloud Providers (OpenAI, Gemini, Claude)
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Powerful AI hosted in the cloud. Requires entering your API Key in <strong>Key Settings</strong>. Keys are stored locally in your browser only.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-card border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                        <span className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                          🏠 Local Open AI (Ollama, LM Studio)
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Runs directly on your computer GPU/CPU. <strong>100% Free</strong>, zero subscription costs, no API keys needed, and complete data privacy!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: LOCAL AI SETUP */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💻</span>
                      <div>
                        <h3 className="font-extrabold text-sm text-foreground">Step 3: Connect Free Local AI Models</h3>
                        <p className="text-[11px] text-muted-foreground">Run powerful open-source AI models on your own PC — 100% free, 100% private, no internet needed after setup.</p>
                      </div>
                    </div>

                    {/* What are local models? */}
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-foreground">
                      <p className="text-[11px] leading-relaxed">
                        <strong>What are Local Models?</strong> Instead of paying OpenAI or Google, you can download free open-source AI models (like <strong>Llama 3.3</strong>, <strong>DeepSeek</strong>, <strong>Mistral</strong>, <strong>Qwen 2.5</strong>) and run them directly on your computer's GPU or CPU. Your data never leaves your machine.
                      </p>
                    </div>

                    {/* OS Selector Tabs */}
                    <div className="flex items-center gap-2 p-1 rounded-xl bg-card border border-border/40">
                      <button
                        onClick={() => setSelectedOS("windows")}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                          selectedOS === "windows" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Monitor className="h-3.5 w-3.5" />
                        <span>Windows</span>
                      </button>

                      <button
                        onClick={() => setSelectedOS("mac")}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                          selectedOS === "mac" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Laptop className="h-3.5 w-3.5" />
                        <span>macOS</span>
                      </button>

                      <button
                        onClick={() => setSelectedOS("linux")}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                          selectedOS === "linux" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Terminal className="h-3.5 w-3.5" />
                        <span>Linux</span>
                      </button>
                    </div>
                  </div>

                  {/* ───────── OLLAMA GUIDE ───────── */}
                  <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-foreground flex items-center gap-2">
                        🦙 Option A: Ollama <span className="text-[10px] text-muted-foreground font-semibold">(Recommended • Easiest)</span>
                      </span>
                      <a
                        href="https://ollama.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-[10px] font-bold flex items-center gap-1"
                      >
                        <span>ollama.com</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {/* Sub-step 1 */}
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">1</div>
                      <div className="space-y-1.5 flex-1">
                        <p className="text-foreground font-bold text-xs">Download & Install Ollama</p>
                        <p className="text-[11px] text-muted-foreground">
                          {selectedOS === "windows"
                            ? 'Go to ollama.com → Click "Download for Windows" → Run the .exe installer → Follow setup wizard.'
                            : selectedOS === "mac"
                            ? 'Go to ollama.com → Click "Download for macOS" → Open the .dmg file → Drag Ollama to Applications.'
                            : "Open your terminal and run the install script:"}
                        </p>
                        {selectedOS === "linux" && (
                          <div className="relative group">
                            <pre className="p-2.5 rounded-xl bg-zinc-950 text-emerald-300 font-mono text-[11px] border border-zinc-800 overflow-x-auto">
                              <code>curl -fsSL https://ollama.com/install.sh | sh</code>
                            </pre>
                            <button
                              onClick={() => copyText("curl -fsSL https://ollama.com/install.sh | sh", "ollama_install")}
                              className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                            >
                              {copiedId === "ollama_install" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sub-step 2 */}
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">2</div>
                      <div className="space-y-1.5 flex-1">
                        <p className="text-foreground font-bold text-xs">Download an AI Model</p>
                        <p className="text-[11px] text-muted-foreground">
                          Open {selectedOS === "windows" ? "PowerShell" : "Terminal"} and type one of these commands to download a model:
                        </p>
                        <div className="space-y-1.5">
                          <div className="relative group">
                            <pre className="p-2.5 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-[11px] border border-zinc-800 overflow-x-auto">
                              <code>
                                <span className="text-zinc-500"># 🌟 Google Gemma 4 (Newest, great quality):</span>{"\n"}
                                <span className="text-emerald-300">ollama pull gemma3</span>{"\n\n"}
                                <span className="text-zinc-500"># 🦙 Llama 3 (Fast, 3.8 GB RAM):</span>{"\n"}
                                <span className="text-emerald-300">ollama pull llama3</span>{"\n\n"}
                                <span className="text-zinc-500"># 🧠 Powerful Coder (4.1 GB RAM):</span>{"\n"}
                                <span className="text-emerald-300">ollama pull deepseek-coder-v2</span>{"\n\n"}
                                <span className="text-zinc-500"># ⚡ Ultra Lightweight (1.3 GB RAM):</span>{"\n"}
                                <span className="text-emerald-300">ollama pull phi3</span>
                              </code>
                            </pre>
                            <button
                              onClick={() => copyText("ollama pull gemma3", "ollama_pull")}
                              className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                            >
                              {copiedId === "ollama_pull" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground/70 italic">
                            💡 If you already have a model (e.g. <code className="bg-muted px-1 rounded">gemma4:e4b</code>), skip this step — it's already ready to use.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sub-step 3 */}
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">3</div>
                      <div className="space-y-1.5 flex-1">
                        <p className="text-foreground font-bold text-xs">Start Ollama with Web Access (CORS)</p>
                        <p className="text-[11px] text-muted-foreground">
                          This command starts Ollama AND allows this website to send messages to it:
                        </p>
                        <div className="relative group">
                          <pre className="p-2.5 rounded-xl bg-zinc-950 text-emerald-300 font-mono text-[11px] border border-zinc-800 overflow-x-auto">
                            <code>
                              {selectedOS === "windows"
                                ? '$env:OLLAMA_ORIGINS="*" ; ollama serve'
                                : 'OLLAMA_ORIGINS="*" ollama serve'}
                            </code>
                          </pre>
                          <button
                            onClick={() =>
                              copyText(
                                selectedOS === "windows"
                                  ? '$env:OLLAMA_ORIGINS="*" ; ollama serve'
                                  : 'OLLAMA_ORIGINS="*" ollama serve',
                                "ollama_serve"
                              )
                            }
                            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                          >
                            {copiedId === "ollama_serve" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sub-step 4 */}
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">4</div>
                      <div className="space-y-1.5 flex-1">
                        <p className="text-foreground font-bold text-xs">✅ Verify It's Connected (Open Browser)</p>
                        <p className="text-[11px] text-muted-foreground">
                          After running the serve command, open your web browser and visit this URL:
                        </p>
                        <div className="relative group">
                          <pre className="p-2.5 rounded-xl bg-zinc-950 text-emerald-300 font-mono text-[11px] border border-zinc-800 overflow-x-auto">
                            <code>http://localhost:11434</code>
                          </pre>
                          <button
                            onClick={() => copyText("http://localhost:11434", "ollama_test")}
                            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                          >
                            {copiedId === "ollama_test" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          If you see <strong>"Ollama is running"</strong> text in the browser, it's working! If it shows an error or blank page, Ollama is not serving yet.
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          You can also check what models you have installed:
                        </p>
                        <div className="relative group">
                          <pre className="p-2.5 rounded-xl bg-zinc-950 text-emerald-300 font-mono text-[11px] border border-zinc-800 overflow-x-auto">
                            <code>ollama list</code>
                          </pre>
                          <button
                            onClick={() => copyText("ollama list", "ollama_list")}
                            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                          >
                            {copiedId === "ollama_list" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground/70 italic">
                          This will show all your downloaded models (e.g. <code className="bg-muted px-1 rounded">gemma4:e4b</code>, <code className="bg-muted px-1 rounded">llama3:latest</code>). Use the exact name shown here in the Model dropdown.
                        </p>
                      </div>
                    </div>

                    {/* Sub-step 5 */}
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">5</div>
                      <div className="space-y-1">
                        <p className="text-foreground font-bold text-xs">Select "Ollama (Local)" in This Website</p>
                        <p className="text-[11px] text-muted-foreground">
                          In the left sidebar → <strong>AI Provider</strong> dropdown → Select <strong>"Ollama (Local) 🏠"</strong> → In the <strong>Model</strong> dropdown, type or pick your model name (e.g. <code className="bg-muted px-1 rounded">gemma3</code>, <code className="bg-muted px-1 rounded">llama3</code>, or <code className="bg-muted px-1 rounded">gemma4:e4b</code>) → Start chatting! No API key needed.
                        </p>
                      </div>
                    </div>

                    {/* Sub-step 6 */}
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">6</div>
                      <div className="space-y-1">
                        <p className="text-foreground font-bold text-xs">🎉 Done! Send Your First Message</p>
                        <p className="text-[11px] text-muted-foreground">
                          Click <strong>"+ New AI Conversation"</strong> → Pick any personality (Assistant, Coding Expert, etc.) → Type your message and hit <strong>Send</strong>. The AI will respond using your local model. You'll see a green <strong>"Running Locally"</strong> badge on every response!
                        </p>
                      </div>
                    </div>

                    {/* Troubleshoot tips */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 space-y-2">
                      <p className="text-[11px] font-bold flex items-center gap-1.5"><Info className="h-4 w-4 shrink-0" /> Troubleshooting Checklist</p>
                      <ul className="space-y-1 text-[10px] leading-relaxed">
                        <li className="flex items-start gap-1.5">
                          <span className="shrink-0 mt-0.5">•</span>
                          <span><strong>"Network Error" or blank response?</strong> → Make sure the terminal window with <code className="bg-amber-500/20 px-1 rounded">ollama serve</code> stays open. Don't close it while chatting.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="shrink-0 mt-0.5">•</span>
                          <span><strong>"CORS" error in browser console?</strong> → You forgot the <code className="bg-amber-500/20 px-1 rounded">OLLAMA_ORIGINS="*"</code> part. Stop Ollama (Ctrl+C) and restart with the full command from Step 3.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="shrink-0 mt-0.5">•</span>
                          <span><strong>"Model not found" error?</strong> → Run <code className="bg-amber-500/20 px-1 rounded">ollama list</code> to see exact model names. Type the exact name (e.g. <code className="bg-amber-500/20 px-1 rounded">gemma4:e4b</code>) in the Model dropdown.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="shrink-0 mt-0.5">•</span>
                          <span><strong>Slow responses?</strong> → Local models depend on your hardware. Use a smaller model (phi3) on older PCs, or enable GPU acceleration in Ollama settings.</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* ───────── LM STUDIO GUIDE ───────── */}
                  <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-foreground flex items-center gap-2">
                        🧪 Option B: LM Studio <span className="text-[10px] text-muted-foreground font-semibold">(Visual GUI • No Terminal Needed)</span>
                      </span>
                      <a
                        href="https://lmstudio.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-[10px] font-bold flex items-center gap-1"
                      >
                        <span>lmstudio.ai</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {/* Sub-step 1 */}
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">1</div>
                      <div className="space-y-1">
                        <p className="text-foreground font-bold text-xs">Download & Install LM Studio</p>
                        <p className="text-[11px] text-muted-foreground">
                          Go to <strong>lmstudio.ai</strong> → Download the installer for {selectedOS === "windows" ? "Windows" : selectedOS === "mac" ? "macOS" : "Linux"} → Install and open the app.
                        </p>
                      </div>
                    </div>

                    {/* Sub-step 2 */}
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">2</div>
                      <div className="space-y-1">
                        <p className="text-foreground font-bold text-xs">Search & Download a Model</p>
                        <p className="text-[11px] text-muted-foreground">
                          Use the search bar inside LM Studio to find a model (e.g. <strong>"Llama 3.3 8B"</strong>, <strong>"Qwen 2.5"</strong>, or <strong>"DeepSeek Coder"</strong>) → Click the <strong>Download</strong> button → Wait for download to finish.
                        </p>
                      </div>
                    </div>

                    {/* Sub-step 3 */}
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">3</div>
                      <div className="space-y-1">
                        <p className="text-foreground font-bold text-xs">Start the Local Server</p>
                        <p className="text-[11px] text-muted-foreground">
                          Click the <strong>Local Server</strong> icon (looks like <code className="bg-muted px-1 rounded">&lt;-&gt;</code>) on the left sidebar → Select your model from the top dropdown → Click <strong>"Start Server"</strong> button → It will say <em>"Server running on port 1234"</em>.
                        </p>
                      </div>
                    </div>

                    {/* Sub-step 4 */}
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">4</div>
                      <div className="space-y-1">
                        <p className="text-foreground font-bold text-xs">Enable CORS (Important!)</p>
                        <p className="text-[11px] text-muted-foreground">
                          In LM Studio server settings, find the <strong>"Enable CORS"</strong> toggle and make sure it's <strong>turned ON</strong>. Without this, the website cannot send messages to your local model.
                        </p>
                      </div>
                    </div>

                    {/* Sub-step 5 */}
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">5</div>
                      <div className="space-y-1">
                        <p className="text-foreground font-bold text-xs">Select "LM Studio (Local)" in This Website</p>
                        <p className="text-[11px] text-muted-foreground">
                          In the left sidebar → <strong>AI Provider</strong> dropdown → Select <strong>"LM Studio (Local) 🏠"</strong> → Start chatting! No API key needed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ───────── MODEL RECOMMENDATIONS ───────── */}
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-3">
                    <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Which Model Should I Choose?
                    </h4>

                    <div className="rounded-xl border border-border/50 overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-secondary/60">
                            <th className="text-left p-2 font-bold text-foreground">Model</th>
                            <th className="text-left p-2 font-bold text-foreground">RAM Needed</th>
                            <th className="text-left p-2 font-bold text-foreground">Best For</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          <tr className="hover:bg-primary/10 transition-colors bg-primary/5">
                            <td className="p-2 font-bold text-primary">🌟 Gemma 4 (e4b)</td>
                            <td className="p-2 text-foreground">~5 GB</td>
                            <td className="p-2 text-foreground">Google's newest, great quality</td>
                          </tr>
                          <tr className="hover:bg-secondary/30 transition-colors">
                            <td className="p-2 font-semibold text-foreground">🦙 Llama 3 (8B)</td>
                            <td className="p-2 text-muted-foreground">~4 GB</td>
                            <td className="p-2 text-muted-foreground">General chat, writing, Q&A</td>
                          </tr>
                          <tr className="hover:bg-secondary/30 transition-colors">
                            <td className="p-2 font-semibold text-foreground">🧠 DeepSeek Coder</td>
                            <td className="p-2 text-muted-foreground">~4 GB</td>
                            <td className="p-2 text-muted-foreground">Coding, debugging, tech</td>
                          </tr>
                          <tr className="hover:bg-secondary/30 transition-colors">
                            <td className="p-2 font-semibold text-foreground">🌬️ Mistral (7B)</td>
                            <td className="p-2 text-muted-foreground">~4 GB</td>
                            <td className="p-2 text-muted-foreground">Fast, balanced, multilingual</td>
                          </tr>
                          <tr className="hover:bg-secondary/30 transition-colors">
                            <td className="p-2 font-semibold text-foreground">⚡ Phi-3 Mini</td>
                            <td className="p-2 text-muted-foreground">~1.3 GB</td>
                            <td className="p-2 text-muted-foreground">Low RAM PCs, quick replies</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Privacy Callout */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 shrink-0" />
                    <p className="text-[11px] font-medium leading-snug">
                      <strong>100% Offline & Private:</strong> Local models run entirely on your hardware. Your prompts and conversations never leave your computer.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 4: FEATURES */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💬</span>
                      <div>
                        <h3 className="font-extrabold text-sm text-foreground">Step 4: Interactive Chat Controls</h3>
                        <p className="text-[11px] text-muted-foreground">Powerful controls built into every chat bubble.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1">
                        <span className="font-bold text-foreground">⏹️ Stop Stream</span>
                        <p className="text-[11px] text-muted-foreground">Click Stop anytime to pause long AI responses immediately.</p>
                      </div>

                      <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1">
                        <span className="font-bold text-foreground">🔄 Regenerate</span>
                        <p className="text-[11px] text-muted-foreground">Re-run any prompt for an alternative fresh response.</p>
                      </div>

                      <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1">
                        <span className="font-bold text-foreground">📋 Copy & Delete</span>
                        <p className="text-[11px] text-muted-foreground">Copy response text to clipboard or delete unwanted turns.</p>
                      </div>

                      <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1">
                        <span className="font-bold text-foreground">📊 Token & Speed Details</span>
                        <p className="text-[11px] text-muted-foreground">Displays response speed in seconds, tokens used, and estimated cost.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: PRIVACY */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-6 w-6 shrink-0" />
                      <div>
                        <h3 className="font-extrabold text-sm text-emerald-300">Step 5: 100% Privacy & Zero Logs</h3>
                        <p className="text-[11px] text-emerald-400/80">Your privacy is fully protected by design.</p>
                      </div>
                    </div>

                    <ul className="space-y-2 text-[11px] text-emerald-300 font-medium leading-relaxed">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span><strong>Local Key Privacy</strong>: Your API Keys never leave your device. Stored only in `localStorage`.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span><strong>Offline Local AI</strong>: Ollama and LM Studio run 100% offline on your computer hardware.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span><strong>Zero Server Storage</strong>: We do not log, store, or share any of your AI messages.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Step Navigation */}
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between shrink-0">
              <Button
                variant="ghost"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as StepId)}
                className="rounded-xl text-xs font-bold h-9 disabled:opacity-30"
              >
                Previous
              </Button>

              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-muted-foreground">
                Step <span className="text-primary font-black">{currentStep}</span> of 5
              </div>

              {currentStep < 5 ? (
                <Button
                  onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1) as StepId)}
                  className="rounded-xl px-4 h-9 text-xs font-bold gap-1 shadow-md"
                >
                  <span>Next Step</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button onClick={onClose} className="rounded-xl px-5 h-9 text-xs font-bold shadow-md">
                  Got It! Start Chatting 🚀
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
