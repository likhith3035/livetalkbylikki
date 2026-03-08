import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Plus, X, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, string>; // sessionId -> optionIndex
  creatorId: string;
}

interface ChatPollsProps {
  isConnected: boolean;
  roomChannel?: RealtimeChannel | null;
  sessionId?: string;
  onSendMessage: (text: string) => void;
}

const ChatPolls = ({ isConnected, roomChannel, sessionId, onSendMessage }: ChatPollsProps) => {
  const [showCreator, setShowCreator] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [activePolls, setActivePolls] = useState<Poll[]>([]);

  useEffect(() => {
    if (!roomChannel) return;

    roomChannel.on("broadcast", { event: "poll_create" }, (payload) => {
      const data = payload.payload as { senderId: string; poll: Poll };
      if (data.senderId !== sessionId) {
        setActivePolls((prev) => [...prev, data.poll]);
      }
    });

    roomChannel.on("broadcast", { event: "poll_vote" }, (payload) => {
      const data = payload.payload as { senderId: string; pollId: string; option: string };
      if (data.senderId !== sessionId) {
        setActivePolls((prev) =>
          prev.map((p) =>
            p.id === data.pollId
              ? { ...p, votes: { ...p.votes, [data.senderId]: data.option } }
              : p
          )
        );
      }
    });

    return () => {};
  }, [roomChannel, sessionId]);

  const createPoll = useCallback(() => {
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return;

    const poll: Poll = {
      id: crypto.randomUUID(),
      question: question.trim(),
      options: validOptions,
      votes: {},
      creatorId: sessionId || "",
    };

    setActivePolls((prev) => [...prev, poll]);
    roomChannel?.send({
      type: "broadcast",
      event: "poll_create",
      payload: { senderId: sessionId, poll },
    });

    onSendMessage(`📊 Poll: **${poll.question}**\n${validOptions.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("\n")}`);

    setQuestion("");
    setOptions(["", ""]);
    setShowCreator(false);
  }, [question, options, sessionId, roomChannel, onSendMessage]);

  const vote = useCallback((pollId: string, option: string) => {
    setActivePolls((prev) =>
      prev.map((p) =>
        p.id === pollId
          ? { ...p, votes: { ...p.votes, [sessionId || ""]: option } }
          : p
      )
    );
    roomChannel?.send({
      type: "broadcast",
      event: "poll_vote",
      payload: { senderId: sessionId, pollId, option },
    });
  }, [sessionId, roomChannel]);

  const addOption = () => {
    if (options.length < 4) setOptions([...options, ""]);
  };

  if (!isConnected) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowCreator(!showCreator)}
        className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0"
        title="Polls"
      >
        <BarChart3 className="h-4 w-4" />
      </Button>

      <AnimatePresence>
        {showCreator && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-14 left-0 z-50 w-72 rounded-2xl border border-border bg-card shadow-xl p-3"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-primary" /> Create Poll
              </span>
              <button onClick={() => setShowCreator(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              />

              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-medium w-4">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[i] = e.target.value;
                      setOptions(newOpts);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 rounded-lg border border-border bg-secondary/50 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => setOptions(options.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}

              <div className="flex gap-1.5">
                {options.length < 4 && (
                  <Button onClick={addOption} variant="ghost" size="sm" className="text-xs gap-1 flex-1">
                    <Plus className="h-3 w-3" /> Add Option
                  </Button>
                )}
                <Button
                  onClick={createPoll}
                  variant="default"
                  size="sm"
                  disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
                  className="text-xs gap-1 flex-1"
                >
                  <Send className="h-3 w-3" /> Send Poll
                </Button>
              </div>
            </div>

            {/* Active polls */}
            {activePolls.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Active Polls</p>
                {activePolls.slice(-3).map((poll) => {
                  const myVote = poll.votes[sessionId || ""];
                  const totalVotes = Object.keys(poll.votes).length;

                  return (
                    <div key={poll.id} className="rounded-xl bg-secondary/40 border border-border/50 p-2.5 space-y-1.5">
                      <p className="text-xs font-medium text-foreground">{poll.question}</p>
                      {poll.options.map((opt) => {
                        const voteCount = Object.values(poll.votes).filter((v) => v === opt).length;
                        const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                        const isMyVote = myVote === opt;

                        return (
                          <button
                            key={opt}
                            onClick={() => !myVote && vote(poll.id, opt)}
                            disabled={!!myVote}
                            className={cn(
                              "w-full text-left rounded-lg px-2.5 py-1.5 text-[11px] transition-all relative overflow-hidden",
                              isMyVote
                                ? "bg-primary/20 border border-primary/30 text-primary font-medium"
                                : myVote
                                  ? "bg-secondary/60 border border-border/50 text-muted-foreground"
                                  : "bg-secondary/60 border border-border/50 text-foreground hover:bg-secondary hover:border-primary/30"
                            )}
                          >
                            {myVote && (
                              <div
                                className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            )}
                            <span className="relative flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                {isMyVote && <Check className="h-3 w-3" />}
                                {opt}
                              </span>
                              {myVote && <span className="text-[9px] tabular-nums">{pct}%</span>}
                            </span>
                          </button>
                        );
                      })}
                      <p className="text-[9px] text-muted-foreground">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPolls;
