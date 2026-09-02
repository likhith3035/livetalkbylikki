import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Check, User, Search, Filter, Rocket, Brain, Palette, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PERSONALITIES } from "../personalities";
import { PersonalityConfig, PersonalityId, PersonalityCategory } from "../types";
import { cn } from "@/lib/utils";

interface PersonalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersonality: (personality: PersonalityConfig, aiName?: string, aiAge?: number) => void;
}

const CATEGORIES: Array<{ id: PersonalityCategory; label: string; icon: React.ReactNode }> = [
  { id: "all", label: "All Personas", icon: <Sparkles className="h-3 w-3" /> },
  { id: "productivity", label: "Productivity & Code", icon: <Rocket className="h-3 w-3" /> },
  { id: "learning", label: "Learning & Mind", icon: <Brain className="h-3 w-3" /> },
  { id: "creative", label: "Creative & Fun", icon: <Palette className="h-3 w-3" /> },
  { id: "companions", label: "Companions & Intimacy", icon: <HeartHandshake className="h-3 w-3" /> },
];

export const PersonalityModal: React.FC<PersonalityModalProps> = ({
  isOpen,
  onClose,
  onSelectPersonality,
}) => {
  const [selectedId, setSelectedId] = useState<PersonalityId>("assistant");
  const [selectedCategory, setSelectedCategory] = useState<PersonalityCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customName, setCustomName] = useState("Custom Persona");

  // AI Name & Age customization state
  const [aiNameInput, setAiNameInput] = useState("");
  const [aiAgeInput, setAiAgeInput] = useState<string>("");
  const [showIdentityInputs, setShowIdentityInputs] = useState(false);

  const filteredPersonalities = useMemo(() => {
    return PERSONALITIES.filter((p) => {
      const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.tagline && p.tagline.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleConfirm = () => {
    const target = PERSONALITIES.find((p) => p.id === selectedId) || PERSONALITIES[0];
    const nameToUse = aiNameInput.trim() || (selectedId === "custom" ? customName.trim() : undefined);
    const parsedAge = aiAgeInput ? parseInt(aiAgeInput, 10) : undefined;

    if (selectedId === "custom") {
      onSelectPersonality(
        {
          ...target,
          name: customName.trim() || "Custom Persona",
          systemPrompt: customPrompt.trim() || "You are a helpful custom AI assistant.",
        },
        nameToUse,
        parsedAge
      );
    } else {
      onSelectPersonality(target, nameToUse, parsedAge);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
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
            className="relative z-10 w-full max-w-2xl bg-card/95 border border-border/80 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2 font-display">
                    Choose AI Personality
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Select a specialist persona and optionally customize your companion's identity.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-secondary border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Category Filter Pills & Search */}
            <div className="py-2.5 space-y-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0",
                      selectedCategory === cat.id
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-secondary/60 hover:bg-secondary border border-border/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search personas (e.g. mentor, stoic, hacker, friend)..."
                  className="h-8 pl-8.5 pr-8 rounded-xl bg-secondary/40 border-border/60 text-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Grid of Personalities */}
            <div className="overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 max-h-[42vh]">
              {filteredPersonalities.map((p) => {
                const isSelected = selectedId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={cn(
                      "p-3 rounded-2xl border text-left flex items-start gap-3 transition-all duration-200 active:scale-[0.98] group relative overflow-hidden",
                      isSelected
                        ? "bg-primary/15 border-primary/70 shadow-md shadow-primary/10 ring-1 ring-primary/40"
                        : "bg-secondary/30 border-border/50 hover:bg-secondary/60 text-foreground"
                    )}
                  >
                    <span className="text-2xl p-1.5 bg-background/60 rounded-xl shrink-0 shadow-sm">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-foreground truncate">{p.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </div>
                      {p.tagline && (
                        <span className="text-[9px] font-semibold text-primary/90 block truncate">{p.tagline}</span>
                      )}
                      <p className="text-[10px] text-muted-foreground/80 leading-relaxed mt-0.5 line-clamp-2">
                        {p.description}
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredPersonalities.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-muted-foreground italic">
                  No personalities found matching "{searchQuery}".
                </div>
              )}
            </div>

            {/* Custom Prompt Textarea if Custom selected */}
            {selectedId === "custom" && (
              <div className="mt-2.5 p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-2 shrink-0">
                <Input
                  placeholder="Custom Persona Title (e.g. Shakespearean Poet)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="h-8 text-xs bg-card"
                />
                <Textarea
                  placeholder="Enter custom system instructions..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="text-xs bg-card min-h-[50px] resize-none"
                />
              </div>
            )}

            {/* AI Name & Age Customization Card */}
            <div className="mt-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 shrink-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>Personalize Name & Age</span>
                  <span className="text-[9px] text-muted-foreground font-normal">(Optional)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowIdentityInputs(!showIdentityInputs)}
                  className="text-[10px] font-extrabold text-primary hover:underline"
                >
                  {showIdentityInputs ? "Hide Customization" : "+ Set Companion Identity"}
                </button>
              </div>

              {showIdentityInputs && (
                <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">
                      AI Companion Name
                    </label>
                    <Input
                      placeholder="e.g. Aria, Sophia, Alex..."
                      value={aiNameInput}
                      onChange={(e) => setAiNameInput(e.target.value)}
                      className="h-8 text-xs bg-card border-border/80"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">
                      AI Age
                    </label>
                    <Input
                      type="number"
                      min="18"
                      max="100"
                      placeholder="e.g. 24, 28..."
                      value={aiAgeInput}
                      onChange={(e) => setAiAgeInput(e.target.value)}
                      className="h-8 text-xs bg-card border-border/80"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 truncate max-w-[50%]">
                <span>Selected:</span>
                <span className="text-primary font-black truncate">
                  {PERSONALITIES.find((p) => p.id === selectedId)?.name}
                  {aiNameInput ? ` ("${aiNameInput}")` : ""}
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
