import { useState } from "react";
import { Plus, X } from "lucide-react";

const MAX_INTERESTS = 5;
const MAX_LENGTH = 24;

interface InterestSelectorProps {
  selected: string[];
  onChange: (interests: string[]) => void;
}

const InterestSelector = ({ selected, onChange }: InterestSelectorProps) => {
  const [customInput, setCustomInput] = useState("");

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

  const remove = (interest: string) => {
    onChange(selected.filter((i) => i !== interest));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Add interests <span className="text-muted-foreground font-normal">(optional)</span></p>
        <span className="text-xs text-muted-foreground">{selected.length}/{MAX_INTERESTS}</span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="Type an interest and press Enter..."
          disabled={selected.length >= MAX_INTERESTS}
          className="flex-1 min-w-0 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          onClick={addCustom}
          disabled={!customInput.trim() || selected.length >= MAX_INTERESTS}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-primary/20 text-primary transition-colors hover:bg-primary/30 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((interest) => (
            <button
              key={interest}
              onClick={() => remove(interest)}
              className="flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/25 transition-colors"
            >
              {interest}
              <X className="h-3 w-3 opacity-60" />
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Add up to {MAX_INTERESTS} topics to find like-minded strangers — or skip to chat with anyone
      </p>
    </div>
  );
};

export default InterestSelector;
