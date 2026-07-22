import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PERSONALITIES } from "../personalities";
import { PersonalityConfig, PersonalityId } from "../types";
import { cn } from "@/lib/utils";

interface PersonalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersonality: (personality: PersonalityConfig) => void;
}

export const PersonalityModal: React.FC<PersonalityModalProps> = ({
  isOpen,
  onClose,
  onSelectPersonality,
}) => {
  const [selectedId, setSelectedId] = useState<PersonalityId>("assistant");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customName, setCustomName] = useState("Custom Persona");

  const handleConfirm = () => {
    const target = PERSONALITIES.find((p) => p.id === selectedId) || PERSONALITIES[0];
    if (selectedId === "custom") {
      onSelectPersonality({
        ...target,
        name: customName.trim() || "Custom Persona",
        systemPrompt: customPrompt.trim() || "You are a helpful custom AI assistant.",
      });
    } else {
      onSelectPersonality(target);
    }
    onClose();
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
            className="relative z-10 w-full max-w-2xl bg-card border border-border/80 rounded-3xl p-6 shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col max-h-[88vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-primary/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                    Choose AI Personality
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Select a persona tone for your new conversation before starting.
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

            {/* Grid of Personalities */}
            <div className="overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 max-h-[55vh]">
              {PERSONALITIES.map((p) => {
                const isSelected = selectedId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={cn(
                      "p-3 rounded-2xl border text-left flex items-start gap-3 transition-all duration-200 active:scale-[0.98]",
                      isSelected
                        ? "bg-primary/15 border-primary/60 shadow-lg shadow-primary/10"
                        : "bg-secondary/30 border-border/50 hover:bg-secondary/60 text-foreground"
                    )}
                  >
                    <span className="text-2xl p-1 bg-background/50 rounded-xl shrink-0">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground truncate">{p.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground/80 leading-relaxed mt-0.5 line-clamp-2">
                        {p.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Prompt Textarea if Custom selected */}
            {selectedId === "custom" && (
              <div className="mt-3 p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-2 shrink-0">
                <Input
                  placeholder="Custom Persona Name (e.g. Shakespearean Poet)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="h-8 text-xs bg-card"
                />
                <Textarea
                  placeholder="Enter custom system instructions (e.g. Speak like a 19th-century pirate poet...)"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="text-xs bg-card min-h-[60px] resize-none"
                />
              </div>
            )}

            {/* Footer Actions */}
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <span>Selected:</span>
                <span className="text-primary font-black">
                  {PERSONALITIES.find((p) => p.id === selectedId)?.name}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs h-9">
                  Cancel
                </Button>
                <Button onClick={handleConfirm} className="rounded-xl px-5 h-9 text-xs font-bold shadow-md">
                  Start Conversation 🚀
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
