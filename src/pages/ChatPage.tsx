import { useState, useRef, useEffect } from "react";
import { Send, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

const ChatPage = () => {
  const { messages, status, onlineCount, startChat, sendMessage, nextChat, stopChat } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    startChat();
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onlineCount={onlineCount} />

      {/* Status bar */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              status === "connected" ? "bg-online" : status === "searching" ? "bg-yellow-500 animate-pulse" : "bg-muted-foreground"
            )}
          />
          <span className="text-sm text-muted-foreground">
            {status === "idle" && "Ready to chat"}
            {status === "searching" && "Finding a stranger..."}
            {status === "connected" && "Connected with Stranger"}
            {status === "disconnected" && "Disconnected"}
          </span>
        </div>
        <div className="flex gap-2">
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
          {(status === "idle" || status === "disconnected") && (
            <Button variant="glow" size="sm" onClick={startChat}>
              Start
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-40 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
              msg.sender === "you" && "ml-auto bg-primary text-primary-foreground rounded-br-md",
              msg.sender === "stranger" && "bg-secondary text-secondary-foreground rounded-bl-md",
              msg.sender === "system" && "mx-auto max-w-fit bg-transparent text-muted-foreground text-xs text-center italic"
            )}
          >
            {msg.sender !== "system" && (
              <p className="text-[10px] font-medium opacity-60 mb-0.5">
                {msg.sender === "you" ? "You" : "Stranger"}
              </p>
            )}
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card/90 backdrop-blur-lg px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
