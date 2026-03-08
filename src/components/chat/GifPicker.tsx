import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, X, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GifPickerProps {
  isConnected: boolean;
  onSendGif: (url: string) => void;
}

// Use Tenor's free anonymous API (no key needed for limited use)
const TENOR_API = "https://tenor.googleapis.com/v2";
const TENOR_KEY = "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ"; // Tenor public web key

interface TenorResult {
  id: string;
  media_formats: {
    tinygif: { url: string };
    gif: { url: string };
  };
}

const GifPicker = ({ isConnected, onSendGif }: GifPickerProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TenorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<TenorResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTrending = useCallback(async () => {
    if (trending.length > 0) return;
    try {
      setLoading(true);
      const res = await fetch(`${TENOR_API}/featured?key=${TENOR_KEY}&limit=20&media_filter=tinygif,gif`);
      const data = await res.json();
      setTrending(data.results || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [trending.length]);

  const searchGifs = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${TENOR_API}/search?key=${TENOR_KEY}&q=${encodeURIComponent(q)}&limit=20&media_filter=tinygif,gif`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchGifs(val), 400);
  };

  const handleOpen = () => {
    setOpen(true);
    fetchTrending();
  };

  const handleSelect = (gif: TenorResult) => {
    const url = gif.media_formats.gif?.url || gif.media_formats.tinygif?.url;
    if (url) {
      onSendGif(url);
      setOpen(false);
      setQuery("");
      setResults([]);
    }
  };

  const displayResults = query.trim() ? results : trending;

  if (!isConnected) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => open ? setOpen(false) : handleOpen()}
        className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0"
        title="GIFs"
      >
        <span className="text-xs font-bold">GIF</span>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-28 left-2 right-2 sm:absolute sm:bottom-14 sm:left-0 sm:right-auto z-50 sm:w-80 rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
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
              {loading && displayResults.length === 0 ? (
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
                        src={gif.media_formats.tinygif?.url}
                        alt="GIF"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tenor attribution */}
            <div className="px-3 py-1.5 border-t border-border">
              <p className="text-[9px] text-muted-foreground text-center">Powered by Tenor</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GifPicker;
