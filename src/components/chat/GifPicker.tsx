import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GifPickerProps {
  isConnected: boolean;
  onSendGif: (url: string) => void;
  customTrigger?: React.ReactNode;
}

const GIPHY_API = "https://api.giphy.com/v1/gifs";
const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || "sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh";

interface GifItem {
  id: string;
  preview: string;
  full: string;
  title?: string;
  tags?: string[];
}

const POPULAR_TAGS = [
  { label: "🔥 Trending", query: "" },
  { label: "😂 LOL", query: "laugh lol" },
  { label: "❤️ Love", query: "love heart" },
  { label: "👏 Clap", query: "applause clap" },
  { label: "💃 Dance", query: "happy dance" },
  { label: "🎉 Party", query: "party celebrate" },
  { label: "🐱 Cats", query: "funny cat" },
  { label: "🐶 Dogs", query: "cute dog" },
  { label: "✨ Wow", query: "wow mind blown" },
  { label: "😢 Sad", query: "sad crying" },
  { label: "👍 Yes", query: "thumbs up yes" },
  { label: "👋 Hi", query: "hello wave" },
];

const FALLBACK_GIFS: GifItem[] = [
  {
    id: "wave-1",
    preview: "https://media.giphy.com/media/mG2VSp1d48ZXuY97mO/200w.gif",
    full: "https://media.giphy.com/media/mG2VSp1d48ZXuY97mO/giphy.gif",
    title: "Wave Hello",
    tags: ["hello", "wave", "hi", "hey"]
  },
  {
    id: "laugh-1",
    preview: "https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/200w.gif",
    full: "https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/giphy.gif",
    title: "LOL Laugh",
    tags: ["laugh", "lol", "funny", "haha", "rofl"]
  },
  {
    id: "applause-1",
    preview: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif",
    full: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
    title: "Applause",
    tags: ["applause", "clap", "bravo", "cheer"]
  },
  {
    id: "dance-1",
    preview: "https://media.giphy.com/media/blSTtZehjAZ8I/200w.gif",
    full: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
    title: "Dance",
    tags: ["dance", "groove", "happy", "party"]
  },
  {
    id: "thumbsup-1",
    preview: "https://media.giphy.com/media/111ebonMs90YLu/200w.gif",
    full: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
    title: "Thumbs Up",
    tags: ["thumbsup", "thumbs", "yes", "good", "nice", "ok"]
  },
  {
    id: "cat-1",
    preview: "https://media.giphy.com/media/BzyTuYCmvSORqs1ABM/200w.gif",
    full: "https://media.giphy.com/media/BzyTuYCmvSORqs1ABM/giphy.gif",
    title: "Cute Cat",
    tags: ["cat", "kitty", "cute", "animal"]
  },
  {
    id: "love-1",
    preview: "https://media.giphy.com/media/26BRv0ThflsDTqUXa/200w.gif",
    full: "https://media.giphy.com/media/26BRv0ThflsDTqUXa/giphy.gif",
    title: "Heart Love",
    tags: ["love", "heart", "cute", "crush"]
  },
  {
    id: "party-1",
    preview: "https://media.giphy.com/media/ibolLe3mOqHE3PQTtk/200w.gif",
    full: "https://media.giphy.com/media/ibolLe3mOqHE3PQTtk/giphy.gif",
    title: "Party Time",
    tags: ["party", "celebrate", "confetti", "yay"]
  },
  {
    id: "wow-1",
    preview: "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/200w.gif",
    full: "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif",
    title: "Mind Blown",
    tags: ["wow", "mindblown", "shock", "omg"]
  },
  {
    id: "sad-1",
    preview: "https://media.giphy.com/media/OPU6wzx8JrHna/200w.gif",
    full: "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif",
    title: "Sad Cry",
    tags: ["sad", "cry", "tears", "upset"]
  },
  {
    id: "dog-1",
    preview: "https://media.giphy.com/media/4Zo41lhzKt6iZ8xff9/200w.gif",
    full: "https://media.giphy.com/media/4Zo41lhzKt6iZ8xff9/giphy.gif",
    title: "Happy Dog",
    tags: ["dog", "puppy", "cute", "pet"]
  },
  {
    id: "cheers-1",
    preview: "https://media.giphy.com/media/GCLlQnV7dXZ2E/200w.gif",
    full: "https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif",
    title: "Cheers",
    tags: ["cheers", "toast", "drink", "celebrate"]
  }
];

async function fetchGifsFromGiphy(endpoint: string): Promise<GifItem[]> {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`GIPHY HTTP ${res.status}`);
  const data = await res.json();
  const list = data.data || [];
  return list
    .map((r: any) => ({
      id: r.id,
      title: r.title || "GIF",
      preview: r.images?.fixed_width?.url || r.images?.fixed_height?.url || r.images?.fixed_width_small?.url || r.images?.original?.url || "",
      full: r.images?.downsized?.url || r.images?.downsized_medium?.url || r.images?.original?.url || r.images?.fixed_width?.url || "",
    }))
    .filter((item: GifItem) => !!item.preview && !!item.full);
}

async function searchGifs(query: string): Promise<GifItem[]> {
  const q = query.trim().toLowerCase();
  if (!GIPHY_KEY) {
    return filterFallbacks(q);
  }
  try {
    const url = `${GIPHY_API}/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=30&rating=pg-13`;
    const results = await fetchGifsFromGiphy(url);
    if (results.length > 0) return results;
    return filterFallbacks(q);
  } catch (e) {
    console.warn("GIPHY search failed, using curated GIFs:", e);
    return filterFallbacks(q);
  }
}

async function fetchTrendingGifs(): Promise<GifItem[]> {
  if (!GIPHY_KEY) {
    return FALLBACK_GIFS;
  }
  try {
    const url = `${GIPHY_API}/trending?api_key=${GIPHY_KEY}&limit=30&rating=pg-13`;
    const results = await fetchGifsFromGiphy(url);
    if (results.length > 0) return results;
    return FALLBACK_GIFS;
  } catch (e) {
    console.warn("GIPHY trending failed, using fallback GIFs:", e);
    return FALLBACK_GIFS;
  }
}

function filterFallbacks(q: string): GifItem[] {
  if (!q) return FALLBACK_GIFS;
  const terms = q.split(/\s+/).filter(Boolean);
  const matched = FALLBACK_GIFS.filter(g => 
    terms.some(t => 
      g.id.toLowerCase().includes(t) || 
      g.title?.toLowerCase().includes(t) || 
      g.tags?.some(tag => tag.includes(t))
    )
  );
  return matched.length > 0 ? matched : FALLBACK_GIFS;
}

const GifPicker = ({ isConnected, onSendGif, customTrigger }: GifPickerProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [results, setResults] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trending, setTrending] = useState<GifItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click or escape key
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        pickerRef.current && !pickerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const loadTrending = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await fetchTrendingGifs();
      setTrending(items);
    } catch {
      setTrending(FALLBACK_GIFS);
    } finally {
      setLoading(false);
    }
  }, []);

  const executeSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const items = await searchGifs(q);
      setResults(items);
    } catch {
      setResults(filterFallbacks(q));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setActiveCategory("");
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (q.trim()) {
        executeSearch(q);
      } else {
        setResults([]);
      }
    }, 300);
  };

  const handleCategorySelect = (category: { label: string; query: string }) => {
    setActiveCategory(category.label);
    setQuery(category.query);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (category.query) {
      executeSearch(category.query);
    } else {
      setResults([]);
      if (trending.length === 0) {
        loadTrending();
      }
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    if (trending.length === 0 && !query) {
      loadTrending();
    }
  };

  const handleSelect = (gif: GifItem) => {
    setOpen(false);
    if (gif.full) {
      onSendGif(gif.full);
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setActiveCategory("");
    setResults([]);
  };

  const displayResults = query.trim() ? results : trending;

  if (!isConnected) return null;

  return (
    <div className="relative inline-block" ref={pickerRef}>
      {customTrigger ? (
        <div
          onClick={() => (open ? setOpen(false) : handleOpen())}
          className="cursor-pointer select-none"
        >
          {customTrigger}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (open ? setOpen(false) : handleOpen())}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0"
          title="GIFs"
        >
          <span className="text-xs font-bold">GIF</span>
        </Button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-24 sm:bottom-28 left-2 right-2 sm:left-auto sm:right-6 md:right-16 z-[100] sm:w-[380px] max-w-[calc(100vw-16px)] rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col max-h-[65vh] h-[480px]"
          >
            {/* Header: Search input & Close */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border/60 bg-muted/20">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search all GIFs on GIPHY..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {query && (
                <button
                  onClick={handleClearSearch}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Category Chips */}
            <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/40 overflow-x-auto scrollbar-none select-none bg-background/50">
              {POPULAR_TAGS.map((cat) => {
                const isActive = activeCategory === cat.label || (!query && cat.query === "" && !activeCategory);
                return (
                  <button
                    key={cat.label}
                    onClick={() => handleCategorySelect(cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Results Grid / Loading / Empty states */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
              {error ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-xs font-bold text-destructive mb-1">GIF Service Notice</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xs">{error}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      if (query) executeSearch(query);
                      else loadTrending();
                    }}
                    className="mt-3 gap-1.5 text-xs rounded-xl"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry
                  </Button>
                </div>
              ) : loading && displayResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs font-medium">Finding best GIFs...</span>
                </div>
              ) : displayResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                  <Sparkles className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-semibold text-foreground">No GIFs found</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Try searching with different keywords</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {displayResults.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => handleSelect(gif)}
                      className="group relative rounded-xl overflow-hidden hover:ring-2 hover:ring-primary/80 transition-all aspect-video bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <img
                        src={gif.preview}
                        alt={gif.title || "GIF"}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Attribution */}
            <div className="px-3 py-1.5 border-t border-border/50 bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Click any GIF to send</span>
              <span className="font-semibold text-foreground/80">Powered by GIPHY</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GifPicker;
