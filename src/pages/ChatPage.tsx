import { useState, useMemo } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ChatStatusBar from "@/components/chat/ChatStatusBar";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatInput from "@/components/chat/ChatInput";
import InterestBar from "@/components/chat/InterestBar";
import { useChat } from "@/hooks/use-chat";
import { useSettings } from "@/contexts/SettingsContext";

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

  const [showInterests, setShowInterests] = useState(true);

  const handleStart = () => {
    setShowInterests(false);
    startChat();
  };

  const handleImageUpload = (url: string) => {
    sendMessage("", url);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Header onlineCount={onlineCount} />

      <ChatStatusBar
        status={status}
        matchedInterests={matchedInterests}
        autoReconnectCountdown={autoReconnectCountdown}
        onToggleInterests={() => setShowInterests(!showInterests)}
        showInterests={showInterests}
        onNext={nextChat}
        onStop={stopChat}
        onStart={handleStart}
        onBlock={blockStranger}
      />

      <InterestBar
        interests={interests}
        onChangeInterests={setInterests}
        showSelector={showInterests}
        isIdle={status === "idle"}
        isActive={status !== "idle" && !showInterests}
      />

      <ChatMessageList
        messages={messages}
        strangerTyping={strangerTyping}
        onReact={reactToMessage}
      />

      <ChatInput
        status={status}
        onSend={sendMessage}
        onImageUpload={handleImageUpload}
        onTyping={sendTyping}
      />

      <BottomNav />
    </div>
  );
};

export default ChatPage;
