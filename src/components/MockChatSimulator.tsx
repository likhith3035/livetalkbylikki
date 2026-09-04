import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Heart, Send, Plus, SkipForward, Circle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  sender: "you" | "stranger" | "system";
  text: string;
  timestamp?: string;
  reaction?: string;
}

export const MockChatSimulator = () => {
  const [step, setStep] = useState<"searching" | "connected" | "chatting" | "disconnected">("searching");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    let active = true;
    let timer: NodeJS.Timeout;

    const runSimulation = async () => {
      if (!active) return;

      // 1. Searching
      setStep("searching");
      setMessages([]);
      setIsTyping(false);
      await new Promise(r => { if (active) timer = setTimeout(r, 3000); });
      if (!active) return;

      // 2. Connected
      setStep("connected");
      setMessages([
        {
          id: "sys-1",
          sender: "system",
          text: "🎉 Connected with a stranger who shares your interest in Gaming 🎮 and Coding 💻!"
        }
      ]);
      await new Promise(r => { if (active) timer = setTimeout(r, 2000); });
      if (!active) return;

      // 3. Chatting
      setStep("chatting");

      // Stranger starts typing
      setIsTyping(true);
      await new Promise(r => { if (active) timer = setTimeout(r, 1500); });
      if (!active) return;
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { id: "msg-1", sender: "stranger", text: "Hey! What are you up to? 😄" }
      ]);
      await new Promise(r => { if (active) timer = setTimeout(r, 1500); });
      if (!active) return;

      // You reply
      setMessages(prev => [
        ...prev,
        { id: "msg-2", sender: "you", text: "Just exploring this new IncogTalk website. It looks amazing! 🔥" }
      ]);
      await new Promise(r => { if (active) timer = setTimeout(r, 2000); });
      if (!active) return;

      // Stranger starts typing again
      setIsTyping(true);
      await new Promise(r => { if (active) timer = setTimeout(r, 1800); });
      if (!active) return;
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { id: "msg-3", sender: "stranger", text: "Whoa, is it really anonymous? No accounts?" }
      ]);
      await new Promise(r => { if (active) timer = setTimeout(r, 1500); });
      if (!active) return;

      // You reply
      setMessages(prev => [
        ...prev,
        { id: "msg-4", sender: "you", text: "Yep! Pure privacy. No logs, no logins. Just instant chat." }
      ]);
      await new Promise(r => { if (active) timer = setTimeout(r, 1800); });
      if (!active) return;

      // Stranger typing
      setIsTyping(true);
      await new Promise(r => { if (active) timer = setTimeout(r, 1600); });
      if (!active) return;
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { id: "msg-5", sender: "stranger", text: "That is awesome! Standard chat apps could never. Let's react with ❤️!" }
      ]);
      await new Promise(r => { if (active) timer = setTimeout(r, 1200); });
      if (!active) return;

      // Trigger floating hearts
      triggerHearts();
      setMessages(prev => 
        prev.map(m => m.id === "msg-5" ? { ...m, reaction: "❤️" } : m)
      );
      await new Promise(r => { if (active) timer = setTimeout(r, 2500); });
      if (!active) return;

      // 4. Disconnected
      setStep("disconnected");
      setMessages(prev => [
        ...prev,
        { id: "sys-2", sender: "system", text: "Stranger has disconnected. Finding a new match..." }
      ]);
      await new Promise(r => { if (active) timer = setTimeout(r, 2500); });
      if (!active) return;

      // Restart loop
      runSimulation();
    };

    runSimulation();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const triggerHearts = () => {
    const newHearts = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: 30 + Math.random() * 40
    }));
    setFloatingHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
    }, 2000);
  };

  return (
    <div className="relative w-full max-w-[340px] aspect-[9/18] rounded-[48px] border-8 border-foreground/15 bg-[#09090b] shadow-2xl overflow-hidden flex flex-col justify-between select-none transform-gpu">
      {/* Top Notch/Dynamic Island */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-30 flex items-center justify-between px-4 border border-white/5">
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        <div className="w-10 h-1.5 rounded-full bg-white/10" />
      </div>

      {/* Screen Content */}
      <div className="flex-1 flex flex-col bg-background/95 pt-8 pb-4 px-3 justify-between overflow-hidden relative">
        {/* Ambient background blur inside screen - disabled on mobile for performance */}
        {!isMobile && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-48 h-48 rounded-full bg-primary/10 blur-[60px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 rounded-full bg-accent/10 blur-[60px]" />
          </div>
        )}

        {/* Holographic scanner grid lines and scanner bar */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none z-10" />
        <div className="absolute inset-x-0 h-[2px] bg-primary/20 shadow-[0_0_8px_rgba(168,85,247,0.4)] pointer-events-none animate-phone-scanner z-20" />

        {/* Real-style Chat Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-2.5 relative z-10">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors duration-300 ${
                step === "connected" || step === "chatting" ? "bg-[rgb(34,197,94)] shadow-[0_0_6px_rgba(34,197,94,0.5)]" :
                step === "searching" ? "bg-[rgb(245,158,11)] animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.5)]" :
                "bg-muted-foreground"
              }`}
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-foreground leading-tight truncate">
                {step === "searching" ? "Searching..." : step === "connected" || step === "chatting" ? "Connected" : "Disconnected"}
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-none truncate">
                {step === "searching" ? "Looking for a stranger..." : step === "connected" || step === "chatting" ? "You & Stranger" : "Stranger left the chat"}
              </p>
            </div>
          </div>
          {/* Cyber secure node tag */}
          {(step === "connected" || step === "chatting") && (
            <span className="font-mono text-[7px] text-online border border-online/30 bg-online/5 px-1 py-0.5 rounded tracking-widest hidden sm:inline-block">
              [NODE_SECURE]
            </span>
          )}

          {(step === "connected" || step === "chatting" || step === "disconnected") && (
            <button className="h-7 w-7 sm:w-auto sm:px-2 rounded-xl flex items-center justify-center gap-1 border border-border/40 bg-secondary/60 hover:bg-secondary text-foreground text-[10px] font-medium transition-all">
              <SkipForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Next</span>
            </button>
          )}
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3.5 relative z-10 flex flex-col justify-end">
          <AnimatePresence initial={false}>
            {step === "searching" && (
              <motion.div
                key="searching-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center space-y-3 py-10 my-auto"
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <MessageSquare className="w-4 h-4 text-primary absolute" />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium animate-pulse">Finding a match based on interests...</p>
                <div className="flex gap-1.5 flex-wrap justify-center max-w-[200px]">
                  {["Gaming 🎮", "Coding 💻", "Anime 🍿"].map((tag, idx) => (
                    <span key={tag} className="text-[9px] font-semibold bg-secondary/80 text-secondary-foreground border border-border px-2 py-0.5 rounded-md animate-bounce" style={{ animationDelay: `${idx * 0.15}s` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {step !== "searching" && messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`flex flex-col ${msg.sender === "you" ? "items-end" : msg.sender === "stranger" ? "items-start" : "items-center"} w-full`}
              >
                {msg.sender === "system" ? (
                  <div className="text-[9px] bg-secondary/60 border border-border px-3 py-2 rounded-2xl text-muted-foreground text-center max-w-[90%] font-medium leading-relaxed shadow-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div className="relative max-w-[85%] group">
                    <div
                      className={`text-xs px-3.5 py-2.5 rounded-2xl leading-relaxed shadow-sm ${
                        msg.sender === "you"
                          ? "bg-[hsl(var(--bubble-you))] text-primary-foreground rounded-br-none relative bubble-tail-right"
                          : "bg-[hsl(var(--bubble-stranger))] text-foreground rounded-bl-none relative bubble-tail-left"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.reaction && (
                      <span className="absolute -bottom-2.5 -right-1 text-xs bg-card border border-border rounded-full px-1 py-0.5 shadow-sm scale-110 flex items-center justify-center animate-bounce">
                        {msg.reaction}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                key="typing-indicator"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 bg-[hsl(var(--bubble-stranger))] rounded-2xl rounded-bl-none px-3.5 py-2.5 self-start shadow-sm relative bubble-tail-left"
              >
                <Circle className="w-1.5 h-1.5 fill-muted-foreground animate-bounce" style={{ animationDelay: "0s" }} />
                <Circle className="w-1.5 h-1.5 fill-muted-foreground animate-bounce" style={{ animationDelay: "0.15s" }} />
                <Circle className="w-1.5 h-1.5 fill-muted-foreground animate-bounce" style={{ animationDelay: "0.3s" }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Hearts overlay */}
          <AnimatePresence>
            {floatingHearts.map((heart) => (
              <motion.div
                key={heart.id}
                initial={{ opacity: 0, y: 150, scale: 0.5, x: `${heart.x}%` }}
                animate={{ opacity: [0, 1, 1, 0], y: -100, scale: [0.5, 1.2, 1, 0.8] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: "easeOut" }}
                className="absolute pointer-events-none z-50 text-red-500 text-lg drop-shadow"
              >
                ❤️
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Real-style Chat Input */}
        <div className="border-t border-border/40 pt-2 flex items-center gap-1.5 relative z-10">
          <button className="h-8.5 w-8.5 rounded-xl flex items-center justify-center border border-border/40 bg-secondary/40 shrink-0 transition-transform active:scale-95">
            <Plus className="h-4.5 w-4.5 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0 relative">
            <input
              type="text"
              readOnly
              placeholder={step === "chatting" ? "Type a message..." : "Connect to start chatting"}
              className="w-full rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5 text-[10px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>
          <button className="h-8.5 w-8.5 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 transition-transform active:scale-95">
            <Send className="h-3.5 w-3.5 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default MockChatSimulator;
