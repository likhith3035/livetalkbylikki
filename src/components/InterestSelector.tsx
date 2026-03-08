import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTED_INTERESTS = [
  "Gaming", "Music", "Movies", "Sports", "Tech",
  "Art", "Travel", "Food", "Anime", "Memes",
  "Science", "Books", "Fitness", "Photography", "Fashion",
  "Crypto", "Programming", "Politics", "Philosophy", "Languages",
];

const MAX_INTERESTS = 5;
const MAX_LENGTH = 24;

interface InterestSelectorProps {
  selected: string[];
  onChange: (interests: string[]) => void;
}

const InterestSelector = ({ selected, onChange }: InterestSelectorProps) => {
  const [customInput, setCustomInput] = useState("");

  const toggle = (interest: string) => {
    if (selected.includes(interest)) {
      onChange(selected.filter((i) => i !== interest));
    } else if (selected.length < MAX_INTERESTS) {
      onChange([...selected, interest]);
    }
  };

  const addCustom = () => {
    const value = customInput.trim().replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, MAX_LENGTH);
    if (!value || selected.length >= MAX_INTERESTS) return;
    if (selected.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setCustomInput("");
      return;
    }
    onChange([...selected, value]);
    setCustomInput("");
  };

  const customSelected = selected.filter(
    (s) => !SUGGESTED_INTERESTS.some((si) => si.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Your interests</p>
        <span className="text-xs text-muted-foreground">{selected.length}/{MAX_INTERESTS}</span>
      </div>

      {/* Custom input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="Add your own..."
          disabled={selected.length >= MAX_INTERESTS}
          className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          onClick={addCustom}
          disabled={!customInput.trim() || selected.length >= MAX_INTERESTS}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-primary/20 text-primary transition-colors hover:bg-primary/30 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Custom tags */}
      {customSelected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customSelected.map((interest) => (
            <button
              key={interest}
              onClick={() => toggle(interest)}
              className="flex items-center gap-1 rounded-full bg-accent/20 border border-accent/40 px-2.5 py-1 text-xs font-medium text-accent-foreground"
            >
              {interest}
              <X className="h-3 w-3 opacity-60" />
            </button>
          ))}
        </div>
      )}

      {/* Suggested */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_INTERESTS.map((interest) => {
          const isSelected = selected.some((s) => s.toLowerCase() === interest.toLowerCase());
          return (
            <button
              key={interest}
              onClick={() => toggle(interest)}
              disabled={!isSelected && selected.length >= MAX_INTERESTS}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all border disabled:opacity-40",
                isSelected
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              {interest}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Pick or type up to {MAX_INTERESTS} topics to match with like-minded strangers
      </p>
    </div>
  );
};

export default InterestSelector;
