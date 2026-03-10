import { useState, useEffect } from "react";
import { X, MessageSquare, Share2, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type PopupType = "feedback" | "share";

const STORAGE_KEY = "LiveTalk_popup_state";
const FEEDBACK_EMAIL = "kamilikhith@gmail.com";

// Show after certain intervals (in page visits)
const FEEDBACK_INTERVAL = 8; // every 8 visits
const SHARE_INTERVAL = 5; // every 5 visits

const FeedbackSharePopup = () => {
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<PopupType>("share");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const state = raw ? JSON.parse(raw) : { visits: 0, lastFeedback: 0, lastShare: 0 };
        state.visits = (state.visits || 0) + 1;

        const sinceFeedback = state.visits - (state.lastFeedback || 0);
        const sinceShare = state.visits - (state.lastShare || 0);

        if (sinceFeedback >= FEEDBACK_INTERVAL) {
          setType("feedback");
          setVisible(true);
        } else if (sinceShare >= SHARE_INTERVAL) {
          setType("share");
          setVisible(true);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch { }
    }, 180000); // 3 minutes (180 seconds)

    return () => clearTimeout(timer);
  }, []);

  const dismiss = (markType?: PopupType) => {
    setVisible(false);
    setFeedback("");
    setRating(0);
    if (markType) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const state = raw ? JSON.parse(raw) : { visits: 0 };
        if (markType === "feedback") state.lastFeedback = state.visits;
        if (markType === "share") state.lastShare = state.visits;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch { }
    }
  };

  const sendFeedback = () => {
    if (!feedback.trim() && rating === 0) {
      toast({ title: "Please add a rating or message" });
      return;
    }
    const subject = encodeURIComponent(`LiveTalk Feedback — ${"⭐".repeat(rating || 3)}`);
    const body = encodeURIComponent(`Rating: ${"⭐".repeat(rating)}\n\n${feedback}\n\n— Sent from LiveTalk`);
    window.open(`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`, "_blank");
    toast({ title: "Thanks for your feedback! 💜" });
    dismiss("feedback");
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
    dismiss("share");
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
            onClick={() => dismiss(type)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {type === "feedback" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Enjoying LiveTalk?</p>
                  <p className="text-xs text-muted-foreground">We'd love your feedback</p>
                </div>
              </div>

              <div className="flex gap-1 justify-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setRating(i)}
                    className="transition-transform hover:scale-125"
                  >
                    <Star
                      className={`h-6 w-6 ${i <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
                    />
                  </button>
                ))}
              </div>

              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Any suggestions? (optional)"
                className="text-xs min-h-[60px] resize-none bg-secondary/50"
              />

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => dismiss("feedback")}>
                  Later
                </Button>
                <Button size="sm" className="flex-1 text-xs" onClick={sendFeedback}>
                  Send Feedback
                </Button>
              </div>
            </div>
          ) : (
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
                <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => dismiss("share")}>
                  Not now
                </Button>
                <Button size="sm" className="flex-1 text-xs gap-1" onClick={shareApp}>
                  <Share2 className="h-3 w-3" /> Share
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackSharePopup;
