import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: string;
  sender: "you" | "stranger" | "system";
  text: string;
  timestamp: Date;
}

type ChatStatus = "idle" | "searching" | "connected" | "disconnected";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [onlineCount, setOnlineCount] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Simulate online count
  useEffect(() => {
    const base = 800 + Math.floor(Math.random() * 500);
    setOnlineCount(base);
    const interval = setInterval(() => {
      setOnlineCount((prev) => prev + Math.floor(Math.random() * 11) - 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const addMessage = useCallback((sender: Message["sender"], text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sender, text, timestamp: new Date() },
    ]);
  }, []);

  const startChat = useCallback(() => {
    setMessages([]);
    setStatus("searching");
    addMessage("system", "Looking for a stranger...");

    timeoutRef.current = setTimeout(() => {
      setStatus("connected");
      addMessage("system", "You are now connected with a stranger. Say hello!");
    }, 1500 + Math.random() * 2000);
  }, [addMessage]);

  const sendMessage = useCallback(
    (text: string) => {
      if (status !== "connected" || !text.trim()) return;
      addMessage("you", text.trim());

      // Simulate stranger reply
      if (Math.random() > 0.3) {
        const replies = [
          "Hey! How are you?",
          "What's up?",
          "Where are you from?",
          "Nice to meet you!",
          "lol 😂",
          "That's interesting",
          "Tell me more",
          "Cool!",
          "haha yeah",
          "I agree",
          "What do you think about that?",
          "🤔",
        ];
        const delay = 1000 + Math.random() * 3000;
        timeoutRef.current = setTimeout(() => {
          addMessage("stranger", replies[Math.floor(Math.random() * replies.length)]);
        }, delay);
      }
    },
    [status, addMessage]
  );

  const nextChat = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    addMessage("system", "You have disconnected.");
    startChat();
  }, [startChat, addMessage]);

  const stopChat = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus("disconnected");
    addMessage("system", "You have disconnected.");
  }, [addMessage]);

  useEffect(() => {
    // Simulate random disconnect
    if (status === "connected") {
      const disconnectTimeout = setTimeout(() => {
        if (Math.random() > 0.7) {
          setStatus("disconnected");
          addMessage("system", "Stranger has disconnected.");
        }
      }, 30000 + Math.random() * 30000);
      return () => clearTimeout(disconnectTimeout);
    }
  }, [status, addMessage]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { messages, status, onlineCount, startChat, sendMessage, nextChat, stopChat };
}
