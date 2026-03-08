const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-1.5 max-w-fit rounded-2xl rounded-bl-md bg-secondary px-4 py-3">
      <span className="text-[10px] font-medium text-muted-foreground mr-1">Stranger</span>
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
    </div>
  );
};

export default TypingIndicator;
