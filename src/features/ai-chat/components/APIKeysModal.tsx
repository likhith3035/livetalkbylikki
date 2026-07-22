import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, X, Check, Shield, Trash2, Edit3, ExternalLink, Gift, Sparkles, Copy, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AI_PROVIDERS } from "../aiProviders";
import { APIKeysMap, AIProviderId } from "../types";
import { cn } from "@/lib/utils";

interface APIKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: APIKeysMap;
  onSaveKeys: (keys: APIKeysMap) => void;
}

export const APIKeysModal: React.FC<APIKeysModalProps> = ({
  isOpen,
  onClose,
  apiKeys,
  onSaveKeys,
}) => {
  const [keys, setKeys] = useState<APIKeysMap>(apiKeys);
  const [editingProvider, setEditingProvider] = useState<AIProviderId | "custom" | null>(null);
  const [tempKeyInput, setTempKeyInput] = useState("");
  const [customEndpointInput, setCustomEndpointInput] = useState(keys.customEndpoint || "");
  const [showSarvamGuide, setShowSarvamGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleEdit = (id: AIProviderId) => {
    setEditingProvider(id);
    setTempKeyInput(keys[id] || "");
  };

  const handleSaveKey = (id: AIProviderId) => {
    const updated = { ...keys, [id]: tempKeyInput.trim() };
    if (!tempKeyInput.trim()) delete updated[id];
    setKeys(updated);
    onSaveKeys(updated);
    setEditingProvider(null);
  };

  const handleRemoveKey = (id: AIProviderId) => {
    const updated = { ...keys };
    delete updated[id];
    setKeys(updated);
    onSaveKeys(updated);
  };

  const handleSaveCustomEndpoint = () => {
    const updated = { ...keys, customEndpoint: customEndpointInput.trim() };
    setKeys(updated);
    onSaveKeys(updated);
    setEditingProvider(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative z-10 w-full max-w-xl bg-card border border-border/80 rounded-3xl p-6 shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col max-h-[88vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                    AI API Key Manager
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Keys are stored locally in your browser only. Never uploaded or logged.
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

            {/* 🎁 Free ₹100 Sarvam AI Key Banner */}
            <div className="mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-purple-500/15 border border-amber-500/30 text-xs shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-amber-400">
                  <Gift className="h-4 w-4 animate-bounce" />
                  <span>Get ₹100 Free API Key (Sarvam AI)</span>
                </div>
                <button
                  onClick={() => setShowSarvamGuide(!showSarvamGuide)}
                  className="text-[10px] font-extrabold text-amber-400 hover:underline flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-lg"
                >
                  <HelpCircle className="h-3 w-3" />
                  <span>{showSarvamGuide ? "Hide Guide" : "How to Get Free Key?"}</span>
                </button>
              </div>

              <p className="text-[11px] text-foreground/90 leading-relaxed">
                Want free AI API credits? Sign up on <strong>Sarvam AI</strong> with any email (or temp mail) to receive <strong>₹100 worth of free API usage</strong>!
              </p>

              {/* Expandable Step-by-Step Guide */}
              <AnimatePresence>
                {showSarvamGuide && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pt-2 border-t border-amber-500/20 space-y-2 text-[11px] text-muted-foreground"
                  >
                    <div className="space-y-1.5 font-medium">
                      <p className="text-foreground font-bold">Follow these easy steps to get your key in 1 minute:</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>
                          Open{" "}
                          <a
                            href="https://dashboard.sarvam.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 underline font-bold"
                          >
                            Sarvam AI Dashboard (dashboard.sarvam.ai)
                          </a>
                        </li>
                        <li>
                          Sign up using your email (or copy a disposable email from{" "}
                          <a
                            href="https://temp-mail.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline font-bold"
                          >
                            temp-mail.org
                          </a>
                          ).
                        </li>
                        <li>Enter the verification code sent to your email — ₹100 free balance will be added immediately!</li>
                        <li>Go to <strong>API Keys</strong> tab on Sarvam dashboard → Click <strong>Create New Secret Key</strong>.</li>
                        <li>Copy the key, paste it into the <strong>Sarvam AI</strong> field below, and click <strong>Save</strong>!</li>
                      </ol>
                    </div>

                    <div className="pt-1 flex gap-2">
                      <a
                        href="https://dashboard.sarvam.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-extrabold text-[10px] flex items-center gap-1 hover:bg-amber-400 transition-all shadow-md"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Open Sarvam AI Dashboard 🚀</span>
                      </a>
                      <a
                        href="https://temp-mail.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-secondary border border-border text-foreground font-bold text-[10px] flex items-center gap-1 hover:bg-secondary/80 transition-all"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Open Temp Mail (temp-mail.org)</span>
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Provider Keys List */}
            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {AI_PROVIDERS.map((provider) => {
                const currentKey = keys[provider.id];
                const isEditing = editingProvider === provider.id;
                const isSarvam = provider.id === "sarvam";

                return (
                  <div
                    key={provider.id}
                    className={cn(
                      "p-3.5 rounded-2xl border flex flex-col gap-2 transition-all",
                      isSarvam
                        ? "bg-amber-500/5 border-amber-500/30"
                        : "bg-secondary/30 border-border/50 hover:bg-secondary/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-foreground">{provider.name}</span>
                        {isSarvam && (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Gift className="h-2.5 w-2.5" /> ₹100 Free Credit
                          </span>
                        )}
                        {provider.isLocal ? (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Local (No Key Needed)
                          </span>
                        ) : currentKey ? (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                            <Check className="h-2.5 w-2.5" /> Key Saved
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Key Missing
                          </span>
                        )}
                      </div>

                      {!provider.isLocal && !isEditing && (
                        <div className="flex items-center gap-1.5">
                          {isSarvam && !currentKey && (
                            <a
                              href="https://dashboard.sarvam.ai"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 text-xs font-extrabold flex items-center gap-1 transition-all active:scale-95"
                            >
                              <Gift className="h-3.5 w-3.5" />
                              <span>Get Free Key</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleEdit(provider.id)}
                            className="p-1.5 rounded-xl bg-card border border-border/60 hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>{currentKey ? "Edit" : "Add Key"}</span>
                          </button>
                          {currentKey && (
                            <button
                              onClick={() => handleRemoveKey(provider.id)}
                              className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-all active:scale-95"
                              title="Remove Key"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Inline Editor */}
                    {!provider.isLocal && isEditing && (
                      <div className="flex items-center gap-2 pt-1">
                        <Input
                          type="password"
                          placeholder={`Enter ${provider.name} API Key...`}
                          value={tempKeyInput}
                          onChange={(e) => setTempKeyInput(e.target.value)}
                          className="h-9 text-xs rounded-xl bg-card border-border/80"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveKey(provider.id)}
                          className="h-9 px-3 rounded-xl text-xs font-bold shrink-0"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingProvider(null)}
                          className="h-9 px-2 rounded-xl text-xs shrink-0"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Custom Endpoint Option */}
              <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col gap-2">
                <span className="font-bold text-xs text-foreground">Custom OpenAI Endpoint Base URL</span>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://api.your-custom-openai.com/v1/chat/completions"
                    value={customEndpointInput}
                    onChange={(e) => setCustomEndpointInput(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-card border-border/80"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveCustomEndpoint}
                    className="h-9 px-3 rounded-xl text-xs font-bold shrink-0"
                  >
                    Save URL
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>End-to-End Local Key Privacy</span>
              </div>
              <Button onClick={onClose} className="rounded-xl px-5 h-9 text-xs font-bold">
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
