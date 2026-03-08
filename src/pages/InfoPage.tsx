import {
  ArrowLeft, MessageSquare, Shield, Zap, Users, EyeOff, Trash2, Globe, Heart,
  HelpCircle, Smile, Type, Video, Bell, Moon, Lock, Share2,
  AlertTriangle, Ban, Flag, Keyboard, Wifi, Clock, Sparkles,
  Image, Send, SkipForward, Volume2, Gamepad2, MapPin, Search,
  Timer, Copy, Pin, Forward, Palette, Code2, Database, Server, Monitor,
  Layers, Cpu, FileCode2, Smartphone, Radio
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";

/* ─── DATA ─── */

const WHAT_IS = [
  { icon: MessageSquare, title: "Chat with strangers", desc: "Talk to random people from around the world. No account, no signup — just open and chat." },
  { icon: EyeOff, title: "100% Anonymous", desc: "We never ask for your name, email, phone number, or anything. Nobody knows who you are." },
  { icon: Trash2, title: "Chats disappear", desc: "The moment you leave a chat, all messages are gone forever. We don't save anything." },
  { icon: Shield, title: "Safe & encrypted", desc: "Your messages are protected with encryption. Only you and the stranger can read them." },
  { icon: Globe, title: "Works everywhere", desc: "Use it on your phone, tablet, laptop, or computer. No app to download — just a website." },
  { icon: Wifi, title: "Real-time connection", desc: "Messages appear instantly. No delays, no refreshing needed." },
];

const HOW_TO = [
  { step: "1", title: "Open the website", desc: "Just visit the link on any device. That's all — nothing to install or download!" },
  { step: "2", title: 'Tap "Start Chatting"', desc: "Hit the big button on the home page. We'll start looking for someone to connect you with." },
  { step: "3", title: "Wait a moment", desc: "Usually takes just a few seconds. You'll see a \"Searching...\" message while we find someone." },
  { step: "4", title: "Say hello! 👋", desc: "Once connected, type your message in the box at the bottom and tap Send." },
  { step: "5", title: "Keep chatting or move on", desc: "Enjoying the conversation? Great! Want someone new? Tap \"Next\" anytime." },
  { step: "6", title: "Done? Just leave", desc: "Close the page or tap Stop. Everything disappears automatically." },
];

const FEATURES_DETAILED = [
  {
    icon: Smile, title: "Emoji Picker 😊", category: "Messaging",
    desc: "Tap the smiley face icon next to the message box. Browse categories like Smileys, Hearts, Animals, and more. Tap any emoji to add it to your message.",
    tech: "Custom emoji grid component with categorized Unicode emojis. Uses React state management for category switching and search filtering.",
  },
  {
    icon: Type, title: "Text Formatting", category: "Messaging",
    desc: "Make text **bold** by wrapping it in double stars. Make text *italic* with single stars. Links you type are automatically clickable!",
    tech: "Custom FormattedText component uses regex pattern matching to detect **bold**, *italic*, and URL patterns, then renders them as styled HTML elements.",
  },
  {
    icon: Heart, title: "Reactions ❤️", category: "Social",
    desc: "Long-press or right-click any message to open the Instagram-style reaction menu. Pick from ❤️ 😂 😮 😢 🔥 👍 emojis. Swipe right on mobile to quick-react!",
    tech: "Uses touch event listeners (onTouchStart/onTouchEnd with 500ms threshold) for long-press detection. Reactions are broadcast via Supabase Realtime channels. Framer Motion powers the animated popup.",
  },
  {
    icon: Copy, title: "Copy & Actions Menu", category: "Messaging",
    desc: "Long-press any message to copy text, reply, pin, forward, or delete. Works just like Instagram's message menu!",
    tech: "Context menu built with absolute-positioned Framer Motion animated panels. Uses navigator.clipboard.writeText() for copy. Click-outside detection via useEffect with document event listeners.",
  },
  {
    icon: Globe, title: "Interest Matching", category: "Matching",
    desc: "Before starting a chat, add topics you like (music, gaming, movies, etc.). We'll try to match you with someone who shares your interests!",
    tech: "Interests are stored as tags and sent during the matchmaking handshake via Supabase Realtime broadcast. The matching algorithm compares arrays server-side to find common interests.",
  },
  {
    icon: Users, title: "Private Rooms 🔒", category: "Matching",
    desc: "Create a private room with a 6-letter code. Share the code with your friend and they can join your room directly.",
    tech: "Generates a random 6-character alphanumeric code. Uses a dedicated Supabase Realtime channel per room code. Both users subscribe to the same channel for direct P2P-style messaging.",
  },
  {
    icon: Image, title: "Send Images 📷", category: "Media",
    desc: "Tap the camera/image icon to send a picture. Share photos, screenshots, memes — anything visual!",
    tech: "File upload handled via Supabase Storage buckets with public URLs. Images are compressed client-side before upload. The ChatImage component renders with lazy loading and lightbox zoom.",
  },
  {
    icon: Search, title: "GIF Search & Send", category: "Media",
    desc: "Tap the GIF icon to search and send animated GIFs. Browse trending GIFs or search for specific ones!",
    tech: "Integrates with the Tenor GIF API (tenor.googleapis.com/v2). Features debounced search (300ms), trending GIFs on open, and a responsive masonry grid layout.",
  },
  {
    icon: Video, title: "Video Calls 📹", category: "Communication",
    desc: "Once connected, start a video call! Both people need to agree. You control your camera and mic at all times.",
    tech: "Built on WebRTC (RTCPeerConnection) for peer-to-peer video/audio. Signaling is handled via Supabase Realtime broadcast. Supports screen sharing, camera flip (front/back), background blur (canvas filter), and Picture-in-Picture mode.",
  },
  {
    icon: SkipForward, title: "Next / Skip", category: "Navigation",
    desc: "Not vibing with this person? Tap \"Next\" — instantly connect to someone new. No awkward goodbyes!",
    tech: "Sends a 'disconnect' broadcast event, cleans up the current Realtime channel, and immediately triggers a new matchmaking cycle. Uses React refs to prevent race conditions.",
  },
  {
    icon: MapPin, title: "Location Sharing", category: "Communication",
    desc: "Share your approximate location with the stranger using the location button. Opens in Google Maps!",
    tech: "Uses the browser's Geolocation API (navigator.geolocation.getCurrentPosition). Sends coordinates as a Google Maps link. Requires user permission via the browser prompt.",
  },
  {
    icon: Gamepad2, title: "Mini Games 🎮", category: "Fun",
    desc: "Play Truth or Dare and Tic-Tac-Toe right inside the chat! Game moves are sent as messages so both players can play.",
    tech: "Game state is managed locally in React components. Tic-Tac-Toe uses a shared state broadcast via Supabase Realtime. Truth or Dare pulls from a curated JSON dataset of prompts.",
  },
  {
    icon: Timer, title: "Disappearing Messages", category: "Privacy",
    desc: "Enable a timer (30s, 1m, 5m, 10m) and messages auto-delete after the set time. Perfect for extra privacy!",
    tech: "Uses setTimeout per message based on the selected timer duration. Messages are removed from React state after expiry. Timer value is synced between both users via Realtime broadcast.",
  },
  {
    icon: Pin, title: "Pin Messages 📌", category: "Messaging",
    desc: "Long-press a message and tap Pin to keep important messages visible. Pinned messages show a 📌 icon.",
    tech: "Pin state is stored in the message object and broadcast to both users. Pinned messages get a visual indicator via conditional CSS class and icon rendering.",
  },
  {
    icon: Forward, title: "Forward Messages", category: "Messaging",
    desc: "Forward a message to copy it to your clipboard. Start a new chat and paste it!",
    tech: "Uses navigator.clipboard.writeText() to copy the message text. Shows a toast notification via the custom useToast hook.",
  },
  {
    icon: Palette, title: "Chat Themes 🎨", category: "Customization",
    desc: "Change your chat bubble colors! Pick from themes like Ocean, Sunset, Forest, and more.",
    tech: "Themes modify CSS custom properties (--bubble-you, --bubble-stranger, etc.) on document.documentElement.style. Changes are instant and don't require re-render.",
  },
  {
    icon: Radio, title: "Typing Preview", category: "Social",
    desc: "See the first 50 characters of what the stranger is typing — before they even send it!",
    tech: "Typing text is broadcast via Supabase Realtime with 500ms throttling to reduce bandwidth. The preview is truncated to 50 characters client-side.",
  },
];

const TECH_STACK = [
  { icon: Code2, name: "React 18", desc: "UI library for building the entire frontend. Uses hooks (useState, useEffect, useCallback, useRef, useMemo) extensively for state management." },
  { icon: FileCode2, name: "TypeScript", desc: "Type-safe JavaScript. Every component, hook, and utility is fully typed for reliability and better developer experience." },
  { icon: Zap, name: "Vite", desc: "Lightning-fast build tool and dev server. Provides instant hot-module replacement (HMR) during development and optimized production builds." },
  { icon: Palette, name: "Tailwind CSS", desc: "Utility-first CSS framework. All styling uses semantic design tokens (--primary, --background, --foreground) defined in CSS custom properties for consistent theming." },
  { icon: Layers, name: "shadcn/ui", desc: "Pre-built, customizable UI components (buttons, dialogs, toasts, etc.) built on Radix UI primitives for accessibility." },
  { icon: Database, name: "Supabase Realtime", desc: "Powers all real-time features — messaging, typing indicators, reactions, game moves, and video call signaling. Uses WebSocket channels with broadcast events." },
  { icon: Server, name: "Supabase Storage", desc: "Cloud file storage for images shared in chat. Public bucket with instant CDN-backed URLs for fast loading." },
  { icon: Sparkles, name: "Framer Motion", desc: "Animation library for smooth transitions — message slide-ins, match celebrations, menu popups, page transitions, and micro-interactions." },
  { icon: Video, name: "WebRTC", desc: "Peer-to-peer video/audio calls directly between browsers. No media server needed — video streams stay between the two users." },
  { icon: Monitor, name: "Responsive Design", desc: "Fully responsive layout using Tailwind breakpoints (sm, md, lg). Mobile-first approach with bottom navigation on mobile and sidebar on desktop." },
  { icon: Smartphone, name: "PWA-Ready", desc: "Works as a web app on any device. No app store download needed — just visit the URL on any browser." },
  { icon: Cpu, name: "React Router", desc: "Client-side routing for seamless page navigation without full page reloads. Supports dynamic routes (e.g., /room/:code)." },
];

const SETTINGS_INFO = [
  { icon: Moon, title: "Dark Mode 🌙", desc: "Switch between light and dark mode. Dark mode is easier on your eyes at night and looks cool!" },
  { icon: Volume2, title: "Sound Effects 🔊", desc: "Turn on/off the sounds that play when you send/receive messages or get connected." },
  { icon: Bell, title: "Notifications 🔔", desc: "Get a notification when someone messages you, even if you're on another tab." },
  { icon: Zap, title: "Auto-Reconnect ⚡", desc: "When a stranger disconnects, we automatically find you a new person. No need to tap anything!" },
];

const SAFETY = [
  { icon: Flag, title: "Report someone", desc: "If someone is being rude, tap the three-dot menu (⋯) and hit \"Report\". We take reports seriously." },
  { icon: Ban, title: "Block someone", desc: "Block them and they won't be able to match with you anymore." },
  { icon: EyeOff, title: "Stay anonymous", desc: "Never share your real name, phone number, address, or social media." },
  { icon: AlertTriangle, title: "Trust your gut", desc: "If something feels wrong, just leave. You can disconnect anytime." },
  { icon: Lock, title: "No data stored", desc: "We don't keep any chat logs, personal data, or IP addresses." },
];

const KEYBOARD_SHORTCUTS = [
  { keys: "Enter", desc: "Send your message" },
  { keys: "Shift + Enter", desc: "Add a new line (without sending)" },
  { keys: "Esc", desc: "Close popups and dialogs" },
  { keys: "Ctrl + N", desc: "Next chat (skip to new stranger)" },
];

const FAQ = [
  { q: "Is it really free?", a: "Yes! 100% free. No hidden fees, no premium plans, no subscriptions." },
  { q: "Do I need to create an account?", a: "Nope! No email, no password, no phone number. Just open and chat." },
  { q: "Can people see who I am?", a: "No. You are completely anonymous. We don't collect any personal information." },
  { q: "Are my messages saved anywhere?", a: "Never. Messages exist only while you're in the chat. When either person leaves, everything is permanently deleted." },
  { q: "Is it safe for kids?", a: "L Chat is designed for people 18 and older. We recommend parental guidance for younger users." },
  { q: "Can I use it on my phone?", a: "Yes! Works on any phone, tablet, or computer — just open the website." },
  { q: "What if someone is being mean?", a: "Tap \"Next\" to skip, Block to prevent rematching, or Report via the menu." },
  { q: "How does interest matching work?", a: "Add topics before chatting. We try to connect you with people who share those interests." },
  { q: "What's a private room?", a: "A private room lets you chat with a specific person using a 6-letter code." },
  { q: "How do video calls work?", a: "Request a video call once connected. The other person must accept. You control camera and mic." },
  { q: "Why did the stranger disconnect?", a: "People can leave anytime. Tap \"Next\" or wait for auto-reconnect." },
  { q: "What does the \"online\" counter show?", a: "It shows how many people are currently on the website. More people = faster matching!" },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

/* ─── COMPONENT ─── */

const InfoPage = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();

  const categories = [...new Set(FEATURES_DETAILED.map((f) => f.category))];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onlineCount={onlineCount} />

      <main className="flex-1 px-5 pb-28 pt-6 max-w-lg mx-auto w-full space-y-12">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>

        {/* Title */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
            Everything about <span className="text-primary">L Chat</span>
          </h1>
          <p className="text-muted-foreground text-base">
            Every feature explained + the tech behind it 🔧
          </p>
        </motion.div>

        {/* ─── Table of Contents ─── */}
        <motion.nav {...fadeUp} transition={{ delay: 0.08 }} className="rounded-2xl bg-card border border-border/50 p-5 space-y-2">
          <p className="text-sm font-semibold text-foreground mb-3">📑 Jump to a section</p>
          {[
            { id: "what", label: "What is L Chat?" },
            { id: "howto", label: "How to use it" },
            { id: "features", label: "All features (detailed)" },
            { id: "tech", label: "Technology stack" },
            { id: "settings", label: "Settings & preferences" },
            { id: "safety", label: "Safety tips" },
            { id: "shortcuts", label: "Keyboard shortcuts" },
            { id: "faq", label: "Common questions" },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="block text-sm text-primary hover:text-primary/80 transition-colors py-0.5"
            >
              → {item.label}
            </a>
          ))}
        </motion.nav>

        {/* ─── Section: What is L Chat ─── */}
        <motion.section id="what" {...fadeUp} transition={{ delay: 0.1 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            What is L Chat?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            L Chat is a free website where you can chat with random strangers from all over the world.
            No sign up, no account — just open the page, tap a button, and you're instantly connected.
            When you're done, everything disappears.
          </p>
          <div className="grid gap-3">
            {WHAT_IS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="flex items-start gap-3 rounded-2xl bg-card border border-border/50 p-4"
              >
                <div className="rounded-xl bg-primary/10 p-2.5 shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── Section: How to use ─── */}
        <motion.section id="howto" {...fadeUp} transition={{ delay: 0.15 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground">📱 How to use it (step by step)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Follow these simple steps. It takes less than 10 seconds to start chatting!
          </p>
          <div className="space-y-2">
            {HOW_TO.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="flex items-start gap-3 rounded-xl bg-secondary/40 border border-border/50 px-4 py-3"
              >
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── Section: All features (Detailed) ─── */}
        <motion.section id="features" {...fadeUp} transition={{ delay: 0.2 }} className="space-y-6 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground">✨ All features explained</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every feature in L Chat, how it works for you, and the technology powering it under the hood.
          </p>

          {categories.map((cat) => (
            <div key={cat} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary/70 pl-1">{cat}</h3>
              {FEATURES_DETAILED.filter((f) => f.category === cat).map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  className="rounded-2xl bg-card border border-border/50 p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-accent/10 p-2 shrink-0">
                      <item.icon className="h-4 w-4 text-accent" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-10">{item.desc}</p>
                  <div className="ml-10 rounded-xl bg-secondary/60 border border-border/30 px-3 py-2.5">
                    <p className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider mb-1">⚙️ How it works</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.tech}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </motion.section>

        {/* ─── Section: Tech Stack ─── */}
        <motion.section id="tech" {...fadeUp} transition={{ delay: 0.25 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Technology Stack
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The technologies and tools used to build L Chat. Everything runs in your browser — no app download needed.
          </p>
          <div className="grid gap-3">
            {TECH_STACK.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className="flex items-start gap-3 rounded-2xl bg-card border border-border/50 p-4"
              >
                <div className="rounded-xl bg-primary/10 p-2.5 shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── Section: Settings ─── */}
        <motion.section id="settings" {...fadeUp} transition={{ delay: 0.3 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground">⚙️ Settings & preferences</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Customize L Chat from the Settings page (tap the gear icon at the bottom).
          </p>
          <div className="grid gap-3">
            {SETTINGS_INFO.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                className="flex items-start gap-3 rounded-2xl bg-card border border-border/50 p-4"
              >
                <div className="rounded-xl bg-primary/10 p-2.5 shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── Section: Safety ─── */}
        <motion.section id="safety" {...fadeUp} transition={{ delay: 0.35 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground">🛡️ Safety tips</h2>
          <div className="space-y-3">
            {SAFETY.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className="flex items-start gap-3 rounded-xl bg-destructive/5 border border-destructive/20 p-4"
              >
                <div className="rounded-xl bg-destructive/10 p-2.5 shrink-0">
                  <item.icon className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── Section: Keyboard shortcuts ─── */}
        <motion.section id="shortcuts" {...fadeUp} transition={{ delay: 0.4 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard shortcuts
          </h2>
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            {KEYBOARD_SHORTCUTS.map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-4 py-3 ${i !== KEYBOARD_SHORTCUTS.length - 1 ? "border-b border-border/30" : ""}`}
              >
                <span className="text-xs text-muted-foreground">{item.desc}</span>
                <kbd className="rounded-lg bg-secondary px-3 py-1 text-xs font-mono font-semibold text-foreground">
                  {item.keys}
                </kbd>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ─── Section: FAQ ─── */}
        <motion.section id="faq" {...fadeUp} transition={{ delay: 0.45 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground">❓ Common questions</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.03 }}
                className="rounded-xl bg-card border border-border/50 p-4 space-y-1.5"
              >
                <p className="text-sm font-semibold text-foreground">{item.q}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── CTA ─── */}
        <motion.div {...fadeUp} transition={{ delay: 0.55 }} className="text-center space-y-3 py-6">
          <Sparkles className="h-6 w-6 text-primary mx-auto" />
          <p className="text-foreground font-semibold">Ready to meet someone new?</p>
          <p className="text-muted-foreground text-xs">It takes 3 seconds. Seriously.</p>
          <button
            onClick={() => navigate("/chat")}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-3 font-semibold text-sm shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] transition-shadow"
          >
            <MessageSquare className="h-4 w-4" />
            Start Chatting Now
          </button>
        </motion.div>

        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-[11px] text-muted-foreground/50">
            Developed by Likhith · © 2026 L Chat
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default InfoPage;
