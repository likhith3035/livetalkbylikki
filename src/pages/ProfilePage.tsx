import { useState } from "react";
import { Pencil, Check, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSEO } from "@/hooks/use-seo";

const ProfilePage = () => {
  const onlineCount = useOnlineCount();
  const { profile, displayName, updateNickname, updateAvatar, AVATAR_OPTIONS } = useProfile();
  useSEO({ 
    title: "My Profile – LiveTalk", 
    description: "Manage your LiveTalk profile — set your nickname and choose a fun avatar for your anonymous chats.",
    keywords: "chat profile, anonymous nickname, chat avatar, personalize chat, LiveTalk profile"
  });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.nickname);
  const [showAvatars, setShowAvatars] = useState(false);

  const handleSaveName = () => {
    updateNickname(nameInput);
    setEditingName(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onlineCount={onlineCount} />

      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-8 pb-24">
        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => setShowAvatars(!showAvatars)}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary border-2 border-primary/30 text-5xl transition-transform hover:scale-105 active:scale-95"
          >
            {profile.avatar}
          </button>
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
            <Pencil className="h-3.5 w-3.5" />
          </span>
        </div>

        {/* Avatar picker */}
        <AnimatePresence>
          {showAvatars && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full max-w-xs overflow-hidden"
            >
              <div className="grid grid-cols-8 gap-2 rounded-xl border border-border bg-secondary/40 p-3">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { updateAvatar(emoji); setShowAvatars(false); }}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-all hover:scale-110",
                      profile.avatar === emoji && "bg-primary/20 ring-2 ring-primary"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nickname */}
        <div className="text-center space-y-2 w-full max-w-xs">
          {editingName ? (
            <div className="flex items-center gap-2 justify-center">
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                maxLength={20}
                placeholder="Enter nickname..."
                className="w-40 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-center text-lg font-bold font-display text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
              <Button size="icon" variant="glow" className="h-9 w-9 rounded-lg" onClick={handleSaveName}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setNameInput(profile.nickname); setEditingName(true); }}
              className="group inline-flex items-center gap-2"
            >
              <h1 className="text-2xl font-bold font-display text-foreground">{displayName}</h1>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <p className="text-sm text-muted-foreground">
            {profile.nickname ? "Your chat nickname" : "Tap to set a nickname"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-4">
          <div className="rounded-xl bg-secondary/60 border border-border p-4 text-center">
            <p className="text-2xl font-bold font-display text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-1">Chats today</p>
          </div>
          <div className="rounded-xl bg-secondary/60 border border-border p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-primary">100%</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Private</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground/60 mt-2">
          Your nickname & avatar are stored locally and shared only during chats.
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
