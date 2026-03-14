import { useState, useEffect } from "react";
import { X, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "LiveTalk_popup_state";

// Show after certain intervals (in page visits)
const SHARE_INTERVAL = 5; // every 5 visits

const FeedbackSharePopup = () => {
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const state = raw ? JSON.parse(raw) : { visits: 0, lastShare: 0 };
        state.visits = (state.visits || 0) + 1;

        const sinceShare = state.visits - (state.lastShare || 0);

        if (sinceShare >= SHARE_INTERVAL) {
          setVisible(true);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch { }
    }, 180000); // 3 minutes (180 seconds)

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const state = raw ? JSON.parse(raw) : { visits: 0 };
      state.lastShare = state.visits;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { }
  };

  const shareApp = async () => {
    const url = "https://LiveTalkbylikki.netlify.app";
    const text = "Check out LiveTalk — anonymous chat with strangers! 🔥";

    if (navigator.share) {
      try {
        await navigator.share({ title: "LiveTalk by Likki", text, url });
        toast({ title: "Thanks for sharing! 🙌" });
      } catch { }
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast({ title: "Link copied!", description: "Share it with your friends!" });
    }
    dismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-4"
        >
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Share2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Love LiveTalk?</p>
                <p className="text-xs text-muted-foreground">Share it with friends!</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Help us grow — tell a friend about anonymous chatting 🔥
            </p>

            <div className="flex gap-2">
              <button
                onClick={dismiss}
                className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
              >
                Not now
              </button>
              <Button size="sm" className="flex-1 text-xs gap-1 rounded-xl" onClick={shareApp}>
                <Share2 className="h-3 w-3" /> Share
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackSharePopup;
