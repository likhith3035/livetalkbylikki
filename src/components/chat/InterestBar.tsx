import { Tags } from "lucide-react";
import InterestSelector from "@/components/InterestSelector";

interface InterestBarProps {
  interests: string[];
  onChangeInterests: (interests: string[]) => void;
  showSelector: boolean;
  isIdle: boolean;
  isActive: boolean;
}

const InterestBar = ({ interests, onChangeInterests, showSelector, isIdle, isActive }: InterestBarProps) => {
  if (showSelector && isIdle) {
    return (
      <div className="border-b border-border px-3 sm:px-5 py-3 sm:py-4">
        <InterestSelector selected={interests} onChange={onChangeInterests} />
      </div>
    );
  }

  if (interests.length > 0 && isActive) {
    return (
      <div className="flex items-center gap-2 border-b border-border px-3 sm:px-5 py-2 overflow-x-auto">
        <Tags className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="flex gap-1.5 flex-nowrap">
          {interests.map((i) => (
            <span key={i} className="rounded-full bg-secondary border border-border px-2.5 py-0.5 text-xs text-muted-foreground whitespace-nowrap">
              {i}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default InterestBar;
