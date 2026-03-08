import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  previewText?: string;
}

const TypingIndicator = ({ previewText }: TypingIndicatorProps) => {
  return (
    <div className="flex items-start gap-2 max-w-[70%]">
      <div className="rounded-2xl rounded-bl-md bg-[hsl(var(--bubble-stranger))] text-[hsl(var(--bubble-stranger-foreground))] backdrop-blur-sm border border-border/20 px-3.5 py-2.5 shadow-sm">
        <p className="text-[10px] font-semibold opacity-60 mb-0.5 tracking-wide uppercase">Stranger</p>
        {previewText ? (
          <p className="text-sm opacity-50 italic">{previewText}</p>
        ) : null}
        <div className="flex items-center gap-[3px] mt-0.5">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-current opacity-50" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-current opacity-50" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-current opacity-50" />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
