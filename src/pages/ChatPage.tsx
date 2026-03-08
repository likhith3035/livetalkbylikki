import { useState, useRef, useEffect, useMemo } from "react";
import { Send, SkipForward, X, Tags, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import InterestSelector from "@/components/InterestSelector";
import TypingIndicator from "@/components/TypingIndicator";
import MessageReactions from "@/components/MessageReactions";
import ReportBlockMenu from "@/components/ReportBlockMenu";
import ImageUploadButton from "@/components/ImageUploadButton";
import { useChat } from "@/hooks/use-chat";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

const ChatPage = () => {
  const { settings } = useSettings();

  const chatCallbacks = useMemo(() => ({
    soundEnabled: settings.soundEffects,
    notificationsEnabled: settings.notifications,
    autoReconnect: true,
  }), [settings.soundEffects, settings.notifications]);

  const {
    messages, status, onlineCount, interests, matchedInterests, strangerTyping,
    autoReconnectCountdown,
    setInterests, startChat, sendMessage, sendTyping, nextChat, stopChat,
    reactToMessage, blockStranger,
  } = useChat(chatCallbacks);

  const [input, setInput] = useState("");
  const [showInterests, setShowInterests] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingThrottleRef = useRef<number>(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, strangerTyping]);

  const handleStart = () => {
    setShowInterests(false);
    startChat();
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleImageUpload = (url: string) => {
    sendMessage("", url);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    const now = Date.now();
    if (now - typingThrottleRef.current > 1000) {
      typingThrottleRef.current = now;
      sendTyping();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onlineCount={onlineCount} />

      {/* Status bar */}
      <div className="relative flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              status === "connected" ? "bg-online" : status === "searching" ? "bg-warning animate-pulse" : "bg-muted-foreground"
            )}
          />
          <span className="text-sm text-muted-foreground">
            {status === "idle" && "Ready to chat"}
            {status === "searching" && "Finding a stranger..."}
            {status === "connected" && "Connected with Stranger"}
            {status === "disconnected" && (
              autoReconnectCountdown
                ? `Reconnecting in ${autoReconnectCountdown}s...`
                : "Disconnected"
            )}
          </span>
          {matchedInterests.length > 0 && status === "connected" && (
            <div className="flex gap-1 ml-2">
              {matchedInterests.map((i) => (
                <span key={i} className="rounded-full bg-primary/20 border border-primary/30 px-2 py-0.5 text-[10px] text-primary">
                  {i}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {status === "idle" && (
            <Button variant="ghost" size="sm" onClick={() => setShowInterests(!showInterests)} className="gap-1.5">
              <Tags className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Report/Block */}
          {status === "connected" && (
            <ReportBlockMenu onBlock={blockStranger} />
          )}

          {(status === "connected" || status === "disconnected") && (
            <Button variant="secondary" size="sm" onClick={nextChat} className="gap-1.5">
              <SkipForward className="h-3.5 w-3.5" />
              Next
            </Button>
          )}
          {status === "connected" && (
            <Button variant="danger" size="sm" onClick={stopChat} className="gap-1.5">
              <X className="h-3.5 w-3.5" />
              Stop
            </Button>
          )}
          {status === "disconnected" && autoReconnectCountdown && (
            <Button variant="ghost" size="sm" onClick={stopChat} className="gap-1.5 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          )}
          {(status === "idle" || (status === "disconnected" && !autoReconnectCountdown)) && (
            <Button variant="glow" size="sm" onClick={handleStart}>
              Start
            </Button>
          )}
        </div>
      </div>

      {/* Interest selector */}
      {showInterests && status === "idle" && (
        <div className="border-b border-border px-5 py-4">
          <InterestSelector selected={interests} onChange={setInterests} />
        </div>
      )}

      {interests.length > 0 && status !== "idle" && !showInterests && (
        <div className="flex items-center gap-2 border-b border-border px-5 py-2">
          <Tags className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex gap-1.5 flex-wrap">
            {interests.map((i) => (
              <span key={i} className="rounded-full bg-secondary border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                {i}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-40 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={cn(msg.sender === "you" && "flex flex-col items-end")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm animate-fade-in",
                msg.sender === "you" && "bg-primary text-primary-foreground rounded-br-md",
                msg.sender === "stranger" && "bg-secondary text-secondary-foreground rounded-bl-md",
                msg.sender === "system" && "mx-auto max-w-fit bg-transparent text-muted-foreground text-xs text-center italic"
              )}
            >
              {msg.sender !== "system" && (
                <p className="text-[10px] font-medium opacity-60 mb-0.5">
                  {msg.sender === "you" ? "You" : "Stranger"}
                </p>
              )}
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Shared image"
                  className="max-w-full rounded-lg mb-1 max-h-60 object-cover"
                  loading="lazy"
                />
              )}
              {msg.text && <span>{msg.text}</span>}
            </div>

            {/* Reactions */}
            {msg.sender !== "system" && (
              <MessageReactions
                messageId={msg.id}
                reactions={msg.reactions}
                onReact={reactToMessage}
                isMine={msg.sender === "you"}
              />
            )}
          </div>
        ))}
        {strangerTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card/90 backdrop-blur-lg px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <ImageUploadButton
            disabled={status !== "connected"}
            onUpload={handleImageUpload}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={status === "connected" ? "Type a message..." : "Connect to start chatting"}
            disabled={status !== "connected"}
            className="flex-1 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <Button
            variant="glow"
            size="icon"
            onClick={handleSend}
            disabled={status !== "connected" || !input.trim()}
            className="h-12 w-12 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ChatPage;
