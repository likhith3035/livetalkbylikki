interface OnlineBadgeProps {
  count: number;
}

const OnlineBadge = ({ count }: OnlineBadgeProps) => {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-2.5 sm:px-3 py-1 sm:py-1.5 w-fit">
      <span className="h-2 w-2 rounded-full bg-online animate-pulse-glow" />
      <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
        {count.toLocaleString()} online
      </span>
    </div>
  );
};

export default OnlineBadge;
