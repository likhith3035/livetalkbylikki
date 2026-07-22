import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GifPickerProps {
  isConnected: boolean;
  onSendGif: (url: string) => void;
  customTrigger?: React.ReactNode;
}

const GIPHY_API = "https://api.giphy.com/v1/gifs";
const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || "";

interface GifItem {
  id: string;
  preview: string;
  full: string;
}

async function fetchGifsFromGiphy(endpoint: string): Promise<GifItem[]> {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`GIPHY HTTP ${res.status}`);
  const data = await res.json();
  return (data.data || []).map((r: any) => ({
    id: r.id,
    preview: r.images?.fixed_width_small?.url || r.images?.fixed_width?.url || r.images?.original?.url || "",
    full: r.images?.original?.url || r.images?.fixed_width?.url || "",
  }));
}

async function searchGifs(query: string): Promise<GifItem[]> {
  try {
    const url = `${GIPHY_API}/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=pg-13`;
    return await fetchGifsFromGiphy(url);
  } catch (e) {
    console.warn("GIPHY search failed:", e);
    throw new Error("GIF search is temporarily unavailable. Please try again.");
  }
}

async function fetchTrendingGifs(): Promise<GifItem[]> {
  try {
    const url = `${GIPHY_API}/trending?api_key=${GIPHY_KEY}&limit=24&rating=pg-13`;
    return await fetchGifsFromGiphy(url);
  } catch (e) {
    console.warn("GIPHY trending failed:", e);
    throw new Error("GIF service is temporarily unavailable. Please try again.");
  }
}

const GifPicker = ({ isConnected, onSendGif, customTrigger }: GifPickerProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trending, setTrending] = useState<GifItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  const loadTrending = useCallback(async () => {
    if (trending.length > 0) return;
    try {
      setLoading(true);
      setError(null);
      const items = await fetchTrendingGifs();
      setTrending(items);
    } catch (err: any) {
      setError(err.message || "Failed to load GIFs.");
      setTrending([]);
    } finally {
      setLoading(false);
    }
  }, [trending.length]);

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
    } catch (err: any) {
      setError(err.message || "GIF search failed.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executeSearch(q);
    }, 400);
  };

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    loadTrending();
  };

  const handleSelect = (gif: GifItem) => {
    setOpen(false);
    if (gif.full) {
      onSendGif(gif.full);
    }
  };

  const displayResults = query.trim() ? results : trending;

  if (!isConnected) return null;

  return (
    <div className="relative" ref={pickerRef}>
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
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-36 left-2 right-2 sm:absolute sm:bottom-14 sm:left-0 sm:right-auto z-50 sm:w-80 rounded-2xl border border-border bg-card shadow-xl overflow-hidden max-h-[50vh]"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search GIFs..."
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Results grid */}
            <div className="h-56 overflow-y-auto p-1.5">
              {error ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <p className="text-xs font-bold text-destructive mb-1">GIF Service Unavailable</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      setTrending([]);
                      loadTrending();
                    }}
                    className="mt-2 text-[10px] font-bold text-primary hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              ) : loading && displayResults.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : displayResults.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-muted-foreground">
                    {query.trim() ? "No GIFs found" : "Search for GIFs"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {displayResults.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => handleSelect(gif)}
                      className="rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all aspect-video bg-muted"
                    >
                      <img
                        src={gif.preview}
                        alt="GIF"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Attribution */}
            <div className="px-3 py-1.5 border-t border-border">
              <p className="text-[9px] text-muted-foreground text-center">Powered by GIPHY</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GifPicker;
