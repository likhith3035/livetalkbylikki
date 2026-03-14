import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Pencil, Check, Shield, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSEO } from "@/hooks/use-seo";

const ProfilePage = () => {
  const navigate = useNavigate();
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
    <div className="flex min-h-screen flex-col bg-background relative">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-10%] w-64 h-64 rounded-full bg-primary/10 blur-[100px] float-slow" />
        <div className="absolute bottom-[20%] right-[-5%] w-80 h-80 rounded-full bg-accent/8 blur-[120px] float-medium" />
      </div>

      <Header onlineCount={onlineCount} />

      <main className="flex flex-1 flex-col items-center justify-start px-6 pt-10 pb-32 relative z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="w-full max-w-md glow-card rounded-[2rem] sm:rounded-[2.5rem] border border-primary/20 bg-card/30 backdrop-blur-xl p-6 sm:p-10 shadow-2xl shadow-primary/10 flex flex-col items-center gap-6 sm:gap-8 relative !overflow-visible"
        >

          {/* Avatar Section */}
          <div className="relative group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <button
                onClick={() => setShowAvatars(!showAvatars)}
                className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-secondary/80 to-secondary/40 border-4 border-primary/30 text-6xl shadow-xl transition-all group-hover:border-primary/50 group-hover:shadow-primary/20"
              >
                {profile.avatar}
              </button>
              <span className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-background">
                <Pencil className="h-4 w-4" />
              </span>
            </motion.div>

            {/* Avatar picker popup-style */}
            <AnimatePresence>
              {showAvatars && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: "-50%", y: 10 }}
                  animate={{ opacity: 1, scale: 1, x: "-50%", y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: "-50%", y: 10 }}
                  className="absolute top-full left-1/2 mt-4 z-50 w-[max-content] max-w-[calc(100vw-3rem)] sm:w-72"
                >
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-md p-3 sm:p-4 shadow-2xl">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => { updateAvatar(emoji); setShowAvatars(false); }}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl text-xl transition-all hover:scale-125 hover:bg-primary/10",
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
          </div>

          {/* Nickname Section */}
          <div className="text-center space-y-3 w-full">
            {editingName ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 justify-center"
              >
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  maxLength={20}
                  placeholder="Enter nickname..."
                  className="w-48 rounded-2xl border-2 border-primary/30 bg-secondary/30 px-4 py-3 text-center text-xl font-bold font-display text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
                <Button size="icon" variant="glow" className="h-12 w-12 rounded-2xl" onClick={handleSaveName}>
                  <Check className="h-5 w-5" />
                </Button>
              </motion.div>
            ) : (
              <button
                onClick={() => { setNameInput(profile.nickname); setEditingName(true); }}
                className="group inline-flex items-center gap-3 hover:scale-105 transition-transform"
              >
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight break-words max-w-[280px] sm:max-w-md px-2">{displayName}</h1>
                <div className="p-2 rounded-xl bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all">
                  <Pencil className="h-4 w-4" />
                </div>
              </button>
            )}
            <p className="text-sm font-medium text-muted-foreground/80 tracking-wide uppercase">
              {profile.nickname ? "Your unique identity" : "Tap to reveal yourself"}
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <motion.div 
              whileHover={{ y: -5 }}
              className="rounded-2xl sm:rounded-3xl bg-primary/5 border border-primary/10 p-4 sm:p-5 text-center transition-all hover:bg-primary/10"
            >
              <p className="text-2xl sm:text-3xl font-bold font-display text-primary">0</p>
              <p className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-widest">Chats today</p>
            </motion.div>
            <motion.div 
              whileHover={{ y: -5 }}
              className="rounded-2xl sm:rounded-3xl bg-accent/5 border border-accent/10 p-4 sm:p-5 text-center transition-all hover:bg-accent/10"
            >
              <div className="flex items-center justify-center gap-1.5 text-accent">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                <p className="text-lg sm:text-xl font-bold font-display">100%</p>
              </div>
              <p className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-widest">Anonymous</p>
            </motion.div>
          </div>

          <div className="space-y-4 w-full pt-4">
            <div className="flex items-center gap-3 px-5 py-4 rounded-3xl bg-secondary/40 border border-border/50 text-muted-foreground text-sm">
              <Shield className="h-5 w-5 text-primary/60" />
              <p className="leading-tight">Your nickname & avatar are stored locally and only visible during active chats.</p>
            </div>
            
            <Link 
                to="/chat"
                className="w-full h-14 rounded-2xl border border-primary/20 hover:bg-primary/5 text-primary font-bold flex items-center justify-center transition-all active:scale-[0.98] relative z-[60]"
            >
                Back to Chat
            </Link>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
