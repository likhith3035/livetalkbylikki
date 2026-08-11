import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Shield, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const KEYS_STORAGE_KEY = "livetalk_ai_api_keys";

export interface BYOKKeys {
  openai?: string;
  gemini?: string;
  openrouter?: string;
  groq?: string;
  claude?: string;
  sarvam?: string;
}

export function getSavedBYOKKeys(): BYOKKeys {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore error */
  }
  return {};
}

export function saveBYOKKeys(keys: BYOKKeys): void {
  try {
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch {
    /* ignore error */
  }
}

interface BYOKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysSaved?: () => void;
}

export const BYOKModal: React.FC<BYOKModalProps> = ({ isOpen, onClose, onKeysSaved }) => {
  const [keys, setKeys] = useState<BYOKKeys>({});

  useEffect(() => {
    if (isOpen) {
      setKeys(getSavedBYOKKeys());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveBYOKKeys(keys);
    toast.success("API Keys saved securely in browser storage!");
    if (onKeysSaved) onKeysSaved();
    onClose();
  };

  const handleClear = () => {
    saveBYOKKeys({});
    setKeys({});
    toast.info("Cleared stored API keys.");
    if (onKeysSaved) onKeysSaved();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-md rounded-2xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" /> Bring Your Own Key (BYOK)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Enter your personal API key for OpenAI, Gemini, Sarvam AI, Groq, or OpenRouter to unlock deep LLM-powered prompt analysis and customized AI rewrites.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          {/* OpenAI Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <Label htmlFor="byok-openai" className="text-foreground font-semibold flex items-center gap-1.5">
                OpenAI API Key (GPT-4o)
              </Label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
              >
                Get Key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <Input
              id="byok-openai"
              type="password"
              placeholder="sk-proj-..."
              value={keys.openai || ""}
              onChange={(e) => setKeys((prev) => ({ ...prev, openai: e.target.value }))}
              className="font-mono text-xs bg-background/80 border-border/70 rounded-xl"
            />
          </div>

          {/* Gemini Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <Label htmlFor="byok-gemini" className="text-foreground font-semibold flex items-center gap-1.5">
                Google Gemini API Key (1.5 Flash)
              </Label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
              >
                Get Free Key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <Input
              id="byok-gemini"
              type="password"
              placeholder="AIzaSy..."
              value={keys.gemini || ""}
              onChange={(e) => setKeys((prev) => ({ ...prev, gemini: e.target.value }))}
              className="font-mono text-xs bg-background/80 border-border/70 rounded-xl"
            />
          </div>

          {/* Sarvam AI Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <Label htmlFor="byok-sarvam" className="text-foreground font-semibold flex items-center gap-1.5">
                Sarvam AI API Key
              </Label>
              <a
                href="https://dashboard.sarvam.ai"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
              >
                Get Key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <Input
              id="byok-sarvam"
              type="password"
              placeholder="Enter Sarvam AI Subscription Key..."
              value={keys.sarvam || ""}
              onChange={(e) => setKeys((prev) => ({ ...prev, sarvam: e.target.value }))}
              className="font-mono text-xs bg-background/80 border-border/70 rounded-xl"
            />
          </div>

          {/* Groq Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <Label htmlFor="byok-groq" className="text-foreground font-semibold flex items-center gap-1.5">
                Groq API Key (Llama 3.3 70B - Ultra Fast)
              </Label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
              >
                Get Free Key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <Input
              id="byok-groq"
              type="password"
              placeholder="gsk_..."
              value={keys.groq || ""}
              onChange={(e) => setKeys((prev) => ({ ...prev, groq: e.target.value }))}
              className="font-mono text-xs bg-background/80 border-border/70 rounded-xl"
            />
          </div>

          {/* OpenRouter Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <Label htmlFor="byok-openrouter" className="text-foreground font-semibold flex items-center gap-1.5">
                OpenRouter API Key
              </Label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
              >
                Get Key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <Input
              id="byok-openrouter"
              type="password"
              placeholder="sk-or-v1-..."
              value={keys.openrouter || ""}
              onChange={(e) => setKeys((prev) => ({ ...prev, openrouter: e.target.value }))}
              className="font-mono text-xs bg-background/80 border-border/70 rounded-xl"
            />
          </div>

          <div className="p-3 rounded-xl bg-secondary/50 border border-border/40 text-[11px] text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              Your API keys are stored locally in your browser's <code className="font-mono text-foreground font-semibold">localStorage</code> and sent directly to provider endpoints via encrypted HTTPS.
            </p>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Clear Keys
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs rounded-xl">
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="text-xs rounded-xl bg-primary text-primary-foreground gap-1.5 font-semibold"
            >
              <Check className="h-3.5 w-3.5" /> Save Keys
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
