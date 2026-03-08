import { useState, useCallback } from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ChatSearchBarProps {
  onSearchResult: (messageId: string | null) => void;
  messages: { id: string; text: string; sender: string }[];
}

const ChatSearchBar = ({ onSearchResult, messages }: ChatSearchBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);

  const results = query.trim()
    ? messages.filter(
        (m) => m.sender !== "system" && m.text.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const navigate = useCallback(
    (dir: 1 | -1) => {
      if (results.length === 0) return;
      const next = (currentIdx + dir + results.length) % results.length;
      setCurrentIdx(next);
      onSearchResult(results[next].id);
    },
    [results, currentIdx, onSearchResult]
  );

  const handleChange = (val: string) => {
    setQuery(val);
    setCurrentIdx(0);
    if (val.trim()) {
      const filtered = messages.filter(
        (m) => m.sender !== "system" && m.text.toLowerCase().includes(val.toLowerCase())
      );
      if (filtered.length > 0) onSearchResult(filtered[0].id);
      else onSearchResult(null);
    } else {
      onSearchResult(null);
    }
  };

  const close = () => {
    setIsOpen(false);
    setQuery("");
    onSearchResult(null);
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1 h-8 px-2 text-xs"
        title="Search messages"
      >
        <Search className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "auto" }}
        exit={{ opacity: 0, width: 0 }}
        className="flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2 py-1"
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search..."
          className="w-24 sm:w-36 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {results.length > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {currentIdx + 1}/{results.length}
          </span>
        )}
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground" disabled={results.length === 0}>
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => navigate(1)} className="text-muted-foreground hover:text-foreground" disabled={results.length === 0}>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button onClick={close} className="text-muted-foreground hover:text-foreground">
          <X className="h-3 w-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatSearchBar;
