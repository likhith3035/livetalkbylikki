import { cn } from "@/lib/utils";

const AVAILABLE_INTERESTS = [
  "Gaming", "Music", "Movies", "Sports", "Tech",
  "Art", "Travel", "Food", "Anime", "Memes",
  "Science", "Books", "Fitness", "Photography", "Fashion",
  "Crypto", "Programming", "Politics", "Philosophy", "Languages",
];

interface InterestSelectorProps {
  selected: string[];
  onChange: (interests: string[]) => void;
}

const InterestSelector = ({ selected, onChange }: InterestSelectorProps) => {
  const toggle = (interest: string) => {
    if (selected.includes(interest)) {
      onChange(selected.filter((i) => i !== interest));
    } else if (selected.length < 5) {
      onChange([...selected, interest]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Select interests</p>
        <span className="text-xs text-muted-foreground">{selected.length}/5</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest);
          return (
            <button
              key={interest}
              onClick={() => toggle(interest)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all border",
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
        Pick up to 5 topics to match with like-minded strangers
      </p>
    </div>
  );
};

export default InterestSelector;
