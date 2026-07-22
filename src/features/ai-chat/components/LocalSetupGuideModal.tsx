import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, X, Terminal, ExternalLink, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocalSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalSetupGuideModal: React.FC<LocalSetupGuideModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative z-10 w-full max-w-2xl bg-card border border-border/80 rounded-3xl p-6 shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                    How to Connect Local AI Models
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Run models on your GPU with 100% data privacy & zero subscription costs.
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

            {/* Scrollable Content */}
            <div className="overflow-y-auto space-y-5 pr-1 flex-1 text-xs">
              {/* Ollama Guide */}
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    🦙 1. Ollama (`localhost:11434`)
                  </span>
                  <a
                    href="https://ollama.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-[11px] font-bold flex items-center gap-1"
                  >
                    <span>Download Ollama</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <ol className="list-decimal list-inside space-y-2 text-muted-foreground font-medium leading-relaxed">
                  <li>Install Ollama from <strong>ollama.com</strong>.</li>
                  <li>Run a model in your terminal (e.g. Llama 3 or Mistral):</li>
                </ol>

                <div className="p-3 rounded-xl bg-zinc-950 text-emerald-300 font-mono text-[11px] border border-zinc-800">
                  <code>ollama run llama3</code>
                </div>

                <p className="text-muted-foreground font-medium">
                  <strong>Enable Web App Access (CORS)</strong> by serving Ollama with CORS origins:
                </p>
                <div className="p-3 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-[11px] border border-zinc-800 space-y-1">
                  <p className="text-zinc-400">// Windows PowerShell:</p>
                  <p className="text-emerald-300">$env:OLLAMA_ORIGINS="*" ; ollama serve</p>
                  <p className="text-zinc-400 mt-2">// Mac / Linux:</p>
                  <p className="text-emerald-300">OLLAMA_ORIGINS="*" ollama serve</p>
                </div>
              </div>

              {/* LM Studio Guide */}
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    🧪 2. LM Studio (`localhost:1234`)
                  </span>
                  <a
                    href="https://lmstudio.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-[11px] font-bold flex items-center gap-1"
                  >
                    <span>Download LM Studio</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <ol className="list-decimal list-inside space-y-2 text-muted-foreground font-medium leading-relaxed">
                  <li>Download LM Studio from <strong>lmstudio.ai</strong>.</li>
                  <li>Search and download any HuggingFace model (e.g. Llama 3.3 or Qwen 2.5).</li>
                  <li>Go to the <strong>Local Server</strong> tab (`&lt;-&gt;`), select your model, and click <strong>Start Server</strong> (Port 1234).</li>
                  <li>Ensure <strong>Enable CORS</strong> is checked in server settings.</li>
                </ol>
              </div>

              {/* Privacy Note */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <p className="text-[11px] leading-snug">
                  Local models run completely offline on your hardware. Prompts are never sent to external servers.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-border/40 flex justify-end shrink-0">
              <Button onClick={onClose} className="rounded-xl px-5 h-9 text-xs font-bold">
                Got It
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
