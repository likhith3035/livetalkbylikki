import { useState } from "react";
import {
  ArrowLeft, MessageSquare, Shield, Zap, Users, EyeOff, Trash2, Globe, Heart,
  HelpCircle, Smile, Type, Video, Bell, Moon, Lock, Share2,
  AlertTriangle, Ban, Flag, Keyboard, Wifi, Clock, Sparkles,
  Image, Send, SkipForward, Volume2, Gamepad2, MapPin, Search,
  Timer, Copy, Pin, Forward, Palette, Code2, Database, Server, Monitor,
  Layers, Cpu, FileCode2, Smartphone, Radio, ChevronDown, ChevronUp,
  Star, Headphones, Mic, Phone, ScreenShare, UserCheck, Fingerprint
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSEO } from "@/hooks/use-seo";

/* ─── DATA ─── */

const WHAT_IS = [
  { icon: MessageSquare, title: "Chat with strangers", desc: "Talk to random people from around the world. No account, no signup — just open and chat. LiveTalk connects you with real humans instantly for genuine conversations." },
  { icon: EyeOff, title: "100% Anonymous", desc: "We never ask for your name, email, phone number, or anything. Nobody knows who you are. Your identity is completely hidden — even from us. Chat freely without any trace." },
  { icon: Trash2, title: "Chats disappear forever", desc: "The moment you leave a chat, all messages are gone permanently. We don't save anything on any server. No logs, no backups, no archives — your conversations exist only in the moment." },
  { icon: Shield, title: "Safe & encrypted", desc: "Your messages are protected with encryption. Only you and the stranger can read them. We use modern security protocols to ensure your privacy at every step." },
  { icon: Globe, title: "Works everywhere", desc: "Use it on your phone, tablet, laptop, or computer. No app to download — just a website. Works on Chrome, Safari, Firefox, Edge, and any modern browser." },
  { icon: Wifi, title: "Real-time connection", desc: "Messages appear instantly. No delays, no refreshing needed. Our real-time infrastructure ensures sub-second message delivery worldwide." },
  { icon: UserCheck, title: "No registration required", desc: "Unlike most platforms, LiveTalk requires zero registration. No email verification, no phone number, no social login. Just open and start chatting immediately." },
  { icon: Fingerprint, title: "Zero digital footprint", desc: "LiveTalk doesn't use cookies for tracking, doesn't store IP addresses, and doesn't create user profiles. Your visit leaves absolutely no digital footprint." },
];

const HOW_TO = [
  { step: "1", title: "Open LiveTalk", desc: "Just visit LiveTalkbylikki.netlify.app on any device. That's all — nothing to install, download, or configure! Works on any browser." },
  { step: "2", title: 'Tap "Start Chatting"', desc: "Hit the big glowing button on the home page. Our matching system immediately starts looking for someone to connect you with." },
  { step: "3", title: "Wait a moment", desc: "Usually takes just 2-5 seconds. You'll see a \"Searching...\" animation while we find the perfect match. Add interests to get matched with like-minded people!" },
  { step: "4", title: "Say hello! 👋", desc: "Once connected, you'll see a celebration popup. Type your message in the box at the bottom and tap Send. The stranger sees it instantly!" },
  { step: "5", title: "Use all the features", desc: "Send images, GIFs, react with emojis, play games, start video calls, share location, and more. LiveTalk is packed with features to make every conversation fun." },
  { step: "6", title: "Keep chatting or move on", desc: "Enjoying the conversation? Great! Want someone new? Tap \"Next\" anytime to instantly connect with a different stranger." },
  { step: "7", title: "Create private rooms", desc: "Want to chat with a specific friend? Create a private room, share the 6-letter code, and chat securely without random matching." },
  { step: "8", title: "Done? Just leave", desc: "Close the page or tap Stop. Everything disappears automatically. No cleanup needed — your chat history is gone forever." },
];

const FEATURES_DETAILED = [
  {
    icon: Smile, title: "Emoji Picker 😊", category: "Messaging",
    desc: "Tap the smiley face icon next to the message box. Browse categories like Smileys, Hearts, Animals, Food, Activities, and more. Tap any emoji to add it to your message. Search for specific emojis by name!",
    tech: "Custom emoji grid component with categorized Unicode emojis. Uses React state management for category switching and search filtering. Supports 1000+ emojis across 8 categories.",
    details: "The emoji picker loads lazily to keep the initial bundle small. Each category is rendered as a virtual scrollable grid for smooth performance even on low-end devices. Recent emojis are tracked in localStorage for quick access.",
  },
  {
    icon: Type, title: "Text Formatting", category: "Messaging",
    desc: "Make text **bold** by wrapping it in double stars (**text**). Make text *italic* with single stars (*text*). Links you type are automatically detected and made clickable with a preview!",
    tech: "Custom FormattedText component uses regex pattern matching to detect **bold**, *italic*, and URL patterns, then renders them as styled HTML elements.",
    details: "URL detection supports http, https, and www prefixes. Detected links automatically generate a preview card showing the page title and favicon when available.",
  },
  {
    icon: Heart, title: "Reactions ❤️", category: "Social",
    desc: "Long-press or right-click any message to open the Instagram-style reaction menu. Pick from ❤️ 😂 😮 😢 🔥 👍 emojis. On mobile, swipe right to quick-react with a heart! Both users see reactions in real-time.",
    tech: "Uses touch event listeners (onTouchStart/onTouchEnd with 400ms threshold) for long-press detection. Reactions are broadcast via Supabase Realtime channels. Framer Motion powers the animated popup.",
    details: "Reactions are synced in real-time — when you react, the stranger sees it appear instantly with a smooth animation. You can toggle reactions on/off by tapping the same emoji again.",
  },
  {
    icon: Copy, title: "Copy & Actions Menu", category: "Messaging",
    desc: "Long-press any message to open a floating action menu. Copy text to clipboard, reply with a quote, pin important messages, forward to a new chat, or delete your own messages. Works exactly like Instagram DMs!",
    tech: "Context menu built with absolute-positioned Framer Motion animated panels. Uses navigator.clipboard.writeText() for copy. Click-outside detection via useEffect with document event listeners.",
    details: "The menu appears with a spring animation above the message bubble. It includes both a reaction emoji bar and action buttons. Tapping outside or selecting an action auto-closes the menu.",
  },
  {
    icon: Globe, title: "Interest Matching 🎯", category: "Matching",
    desc: "Before starting a chat, add topics you like — music, gaming, movies, coding, sports, anime, and more. LiveTalk tries to match you with someone who shares your interests. Matched interests are highlighted when you connect!",
    tech: "Interests are stored as tags and sent during the matchmaking handshake via Supabase Realtime broadcast. The matching algorithm compares arrays to find common interests and prioritizes users with the most overlap.",
    details: "The system scores each potential match based on shared interest count. Users with the most matching interests get connected first. If no interest matches are found, you're connected to a random user instead.",
  },
  {
    icon: Users, title: "Private Rooms 🔒", category: "Matching",
    desc: "Create a private room with a unique 6-letter code. Share the code with your friend via WhatsApp, Instagram, or any app. They enter the code and join your room directly — no random matching involved.",
    tech: "Generates a random 6-character alphanumeric code (excluding ambiguous characters like 0/O/1/I). Uses a dedicated Supabase Realtime channel per room code. Both users subscribe to the same channel for direct messaging.",
    details: "Room codes are case-insensitive and designed to be easy to read aloud or type. The room URL can be shared directly (LiveTalkbylikki.netlify.app/room/ABCDEF) for one-tap joining.",
  },
  {
    icon: Image, title: "Send Images 📷", category: "Media",
    desc: "Tap the camera/image icon to send a picture. Share photos, screenshots, memes, artwork — anything visual! Images are displayed inline with a lightbox zoom feature. Supports JPG, PNG, GIF, and WebP formats.",
    tech: "File upload handled via Supabase Storage buckets with public URLs. Images are compressed client-side before upload. The ChatImage component renders with lazy loading and lightbox zoom.",
    details: "Images are optimized for fast loading with progressive rendering. Tap any image to view it full-screen with pinch-to-zoom on mobile. The upload progress is shown in real-time.",
  },
  {
    icon: Search, title: "GIF Search & Send 🎬", category: "Media",
    desc: "Tap the GIF icon to open the GIF picker. Browse trending GIFs or search for anything — reactions, emotions, memes, celebrities. Tap a GIF to send it instantly in chat!",
    tech: "Integrates with the Tenor GIF API (tenor.googleapis.com/v2). Features debounced search (300ms), trending GIFs on open, and a responsive masonry grid layout.",
    details: "GIFs play automatically on hover/tap for preview. The search is debounced to reduce API calls. Trending GIFs refresh periodically to keep content fresh.",
  },
  {
    icon: Video, title: "Video & Audio Calls 📹", category: "Communication",
    desc: "Once connected, start a video or audio call! Send a call request — the other person can accept or decline. You have full control: mute mic, toggle camera, flip camera (front/back), blur background, share screen, and even upgrade audio calls to video mid-call!",
    tech: "Built on WebRTC (RTCPeerConnection) for peer-to-peer video/audio. Signaling is handled via Supabase Realtime broadcast. Supports screen sharing, camera flip, background blur (canvas filter), and PiP mode.",
    details: "Video streams go directly between users (peer-to-peer) — no media server in between, ensuring maximum privacy. Background blur uses real-time video processing. Screen sharing works on desktop browsers.",
  },
  {
    icon: Phone, title: "Audio-Only Calls 🎧", category: "Communication",
    desc: "Prefer voice-only? Start an audio call for a lighter, more private experience. Audio calls use less bandwidth and can be upgraded to video anytime during the conversation.",
    tech: "Uses the same WebRTC infrastructure as video calls but requests audio-only media streams. Upgrade to video adds a video track to the existing peer connection without reconnecting.",
    details: "Audio calls show a minimal UI with waveform visualization. The call quality adapts to network conditions automatically using WebRTC's built-in bandwidth estimation.",
  },

  {
    icon: SkipForward, title: "Next / Skip ⏭️", category: "Navigation",
    desc: "Not vibing with this person? Tap \"Next\" — instantly disconnect and connect to someone new. No awkward goodbyes needed! You can also use the keyboard shortcut Ctrl+N.",
    tech: "Sends a 'disconnect' broadcast event, cleans up the current Realtime channel, and immediately triggers a new matchmaking cycle. Uses React refs to prevent race conditions.",
    details: "The transition is seamless — you'll be in a new chat within seconds. The previous stranger is notified that you disconnected with a system message.",
  },
  {
    icon: MapPin, title: "Location Sharing 📍", category: "Communication",
    desc: "Share your approximate location with the stranger using the location button. It generates a Google Maps link they can tap to see the area. Useful for finding people nearby or sharing travel spots!",
    tech: "Uses the browser's Geolocation API (navigator.geolocation.getCurrentPosition). Sends coordinates as a Google Maps link. Requires user permission via the browser prompt.",
    details: "Location is shared as a clickable link — the exact coordinates are sent, but you can choose how precise to be. The browser will ask for your permission first, and you can deny it at any time.",
  },
  {
    icon: Gamepad2, title: "Mini Games 🎮", category: "Fun",
    desc: "Play Truth or Dare and Tic-Tac-Toe right inside the chat! Game prompts and moves are sent as messages so both players participate in real-time. A great ice-breaker for new conversations!",
    tech: "Game state is managed locally in React components. Tic-Tac-Toe uses a shared state broadcast via Supabase Realtime. Truth or Dare pulls from a curated dataset of 100+ prompts.",
    details: "Truth or Dare includes different categories and intensity levels. Tic-Tac-Toe features win detection, draw detection, and a visual game board rendered inline in the chat.",
  },
  {
    icon: Timer, title: "Disappearing Messages ⏳", category: "Privacy",
    desc: "Enable a timer (30 seconds, 1 minute, 5 minutes, or 10 minutes) and messages auto-delete after the set time. Perfect for extra privacy! Both users see a timer icon on disappearing messages.",
    tech: "Uses setTimeout per message based on the selected timer duration. Messages are removed from React state after expiry. Timer value is synced between both users via Realtime broadcast.",
    details: "A small timer icon appears on messages that will disappear. The countdown runs client-side for instant deletion. Once deleted, messages cannot be recovered — they're gone forever.",
  },
  {
    icon: Pin, title: "Pin Messages 📌", category: "Messaging",
    desc: "Long-press a message and tap Pin to keep important messages visible at the top. Pinned messages show a 📌 icon and appear in a sticky bar at the top of the chat. Tap a pinned message to jump to it!",
    tech: "Pin state is stored in the message object and broadcast to both users. Pinned messages get a visual indicator and appear in a separate sticky section at the top of the message list.",
    details: "Up to 3 most recent pinned messages are shown in the sticky bar. Both users see pin/unpin actions in real-time. Pinned messages are preserved even if disappearing messages is enabled.",
  },
  {
    icon: Forward, title: "Forward Messages", category: "Messaging",
    desc: "Forward a message to copy it to your clipboard. Start a new chat and paste it to share interesting messages with other strangers!",
    tech: "Uses navigator.clipboard.writeText() to copy the message text. Shows a toast notification via the custom useToast hook confirming the copy.",
    details: "Works with both text messages and image URLs. The forwarded content is copied as plain text for maximum compatibility across apps.",
  },
  {
    icon: Palette, title: "Chat Themes 🎨", category: "Customization",
    desc: "Change your chat bubble colors! Pick from themes like Ocean (blue), Sunset (orange), Forest (green), Neon (pink), Lavender (purple), and more. Themes apply instantly and last for the current session.",
    tech: "Themes modify CSS custom properties (--bubble-you, --bubble-stranger, etc.) on document.documentElement.style. Changes are instant and don't require re-render.",
    details: "Each theme carefully selects foreground and background colors for optimal readability. Themes only affect your view — the stranger sees their own theme choice.",
  },
  {
    icon: Radio, title: "Live Typing Preview 👀", category: "Social",
    desc: "See what the stranger is typing in real-time — before they even send it! A live preview shows the first 50 characters of their message with an animated typing indicator.",
    tech: "Typing text is broadcast via Supabase Realtime with 500ms throttling to reduce bandwidth. The preview is truncated to 50 characters client-side.",
    details: "The typing indicator shows animated dots plus a preview of the actual text being typed. This creates a more connected, real-time feeling similar to seeing someone type in person.",
  },
  {
    icon: Search, title: "Message Search 🔍", category: "Messaging",
    desc: "Lost a message in a long conversation? Use the search bar to instantly find any message by keyword. Results are highlighted and the chat scrolls to the matching message.",
    tech: "Full-text search through the messages array with case-insensitive matching. Matching messages are highlighted with a ring animation and auto-scrolled into view.",
    details: "Search works on both your messages and the stranger's messages. The highlight animation lasts 2 seconds before fading, making it easy to spot the found message.",
  },
];

const TECH_STACK = [
  { icon: Code2, name: "React 18", desc: "Modern UI library powering the entire frontend. Uses hooks (useState, useEffect, useCallback, useRef, useMemo) extensively for efficient state management and rendering." },
  { icon: FileCode2, name: "TypeScript", desc: "Type-safe JavaScript ensuring reliability. Every component, hook, and utility is fully typed — catching bugs at compile time before they reach users." },
  { icon: Zap, name: "Vite", desc: "Lightning-fast build tool and dev server. Provides instant hot-module replacement (HMR) during development and highly optimized production builds with code splitting." },
  { icon: Palette, name: "Tailwind CSS", desc: "Utility-first CSS framework with semantic design tokens. All styling uses CSS custom properties (--primary, --background, etc.) for consistent theming across light and dark modes." },
  { icon: Layers, name: "shadcn/ui", desc: "Premium, customizable UI components built on Radix UI primitives. Ensures accessibility (ARIA labels, keyboard navigation) out of the box." },
  { icon: Database, name: "Supabase Realtime", desc: "Powers all real-time features — messaging, typing indicators, reactions, game moves, video call signaling, and presence tracking. Uses WebSocket channels with broadcast events for instant communication." },
  { icon: Server, name: "Supabase Storage", desc: "Cloud file storage for images shared in chat. Public bucket with instant CDN-backed URLs for fast loading worldwide." },
  { icon: Sparkles, name: "Framer Motion", desc: "Professional animation library for smooth transitions — message slide-ins, match celebrations, menu popups, page transitions, and micro-interactions that make the app feel alive." },
  { icon: Video, name: "WebRTC", desc: "Peer-to-peer video/audio streaming directly between browsers. No media server involved — video streams stay between the two users for maximum privacy and minimal latency." },
  { icon: Monitor, name: "Responsive Design", desc: "Fully responsive layout using Tailwind breakpoints. Mobile-first approach with bottom navigation on phones and a persistent sidebar on desktop. Supports screens from 320px to 4K." },
  { icon: Smartphone, name: "Progressive Web App", desc: "Installable as a native-like app on any device. Supports offline caching, push notifications, and home screen shortcuts. No app store needed — just visit the URL." },
  { icon: Cpu, name: "React Router v6", desc: "Client-side routing for seamless page navigation without full page reloads. Supports dynamic routes (e.g., /room/:code) and animated page transitions." },
];

const SETTINGS_INFO = [
  { icon: Moon, title: "Dark Mode 🌙", desc: "Switch between light and dark mode. Dark mode is easier on your eyes at night, saves battery on OLED screens, and looks sleek! The theme persists across sessions." },
  { icon: Volume2, title: "Sound Effects 🔊", desc: "Toggle sounds for sending/receiving messages, connecting with strangers, and call notifications. Each event has a unique, subtle sound effect." },
  { icon: Bell, title: "Browser Notifications 🔔", desc: "Get a desktop/mobile notification when someone messages you, even if LiveTalk is in another tab or minimized. Never miss a message!" },
  { icon: Zap, title: "Auto-Reconnect ⚡", desc: "When a stranger disconnects, LiveTalk automatically finds you a new person within 5 seconds. No need to tap anything — seamless continuous chatting!" },
];

const SAFETY = [
  { icon: Flag, title: "Report inappropriate behavior", desc: "If someone is being rude, harassing, or sending inappropriate content, tap the three-dot menu (⋯) and hit \"Report\". We take all reports seriously to keep the community safe." },
  { icon: Ban, title: "Block troublesome users", desc: "Block a user and they won't be able to match with you again during your session. Blocking is instant and the blocked user is not notified." },
  { icon: EyeOff, title: "Protect your identity", desc: "Never share your real name, phone number, home address, social media accounts, or any personally identifiable information. Stay anonymous!" },
  { icon: AlertTriangle, title: "Trust your instincts", desc: "If something feels wrong or uncomfortable, leave immediately. You can disconnect from any conversation at any time with zero consequences." },
  { icon: Lock, title: "No data stored anywhere", desc: "We don't keep any chat logs, personal data, IP addresses, or device information. When your chat ends, it's gone forever from everywhere." },
  { icon: Shield, title: "End-to-end message protection", desc: "Messages are transmitted through encrypted channels. Even we cannot read your conversations. Your privacy is our top priority." },
];

const KEYBOARD_SHORTCUTS = [
  { keys: "Enter", desc: "Send your message" },
  { keys: "Shift + Enter", desc: "Add a new line (without sending)" },
  { keys: "Esc", desc: "Stop chat / close popups" },
  { keys: "Ctrl + N", desc: "Next chat (skip to new stranger)" },
];

const FAQ = [
  { q: "Is LiveTalk really free?", a: "Yes! 100% free, forever. No hidden fees, no premium plans, no subscriptions, no in-app purchases. Every feature is available to everyone." },
  { q: "Do I need to create an account?", a: "Nope! No email, no password, no phone number, no social login. Just open LiveTalk and start chatting. It literally takes 3 seconds." },
  { q: "Can people see who I am?", a: "Absolutely not. You are completely anonymous. We don't collect any personal information, and there's no way for the stranger to find out your identity." },
  { q: "Are my messages saved anywhere?", a: "Never. Messages exist only in your browser while you're in the chat. When either person leaves, everything is permanently and irreversibly deleted. No server logs, no backups." },
  { q: "Is LiveTalk safe for minors?", a: "LiveTalk is designed for users 18 and older. We strongly recommend parental guidance for younger users. Parents should be aware that users chat with random strangers." },
  { q: "Can I use it on my phone?", a: "Yes! LiveTalk works perfectly on any phone, tablet, or computer. Just open your browser and visit the website. You can even install it as an app on your home screen!" },
  { q: "What if someone is being mean or inappropriate?", a: "You have several options: tap \"Next\" to skip to a new person, use \"Block\" to prevent rematching, or tap \"Report\" in the menu to flag their behavior." },
  { q: "How does interest matching work?", a: "Before chatting, add topics you're interested in (like music, gaming, movies). LiveTalk's algorithm tries to connect you with someone who shares the most interests. If no match is found, you'll be connected randomly." },
  { q: "What's a private room?", a: "A private room lets you chat with a specific person using a unique 6-letter code. Create a room, share the code with your friend, and they join directly. No random strangers — just you two!" },
  { q: "How do video calls work?", a: "Once connected with a stranger, tap the video or audio call button. The other person receives a request and can accept or decline. Calls are peer-to-peer (direct between browsers) for maximum privacy." },
  { q: "Why did the stranger disconnect?", a: "People can leave anytime — that's the nature of anonymous chatting. Don't take it personally! Tap \"Next\" for a new match, or enable auto-reconnect in settings to be matched automatically." },
  { q: "What does the 'online' counter show?", a: "It shows how many people are currently on LiveTalk. More people online = faster matching! The count updates in real-time." },
  { q: "Can I use LiveTalk on multiple devices?", a: "Yes! Since there's no account, you can open LiveTalk on any device independently. Each device gets its own separate chat sessions." },
  { q: "Is LiveTalk better than Omegle?", a: "LiveTalk is built as a modern alternative to Omegle with better features, a beautiful UI, no ads, built-in games, reactions, GIFs, video calls, and a focus on privacy. It's what Omegle should have been!" },
  { q: "Who built LiveTalk?", a: "LiveTalk was designed and developed by Likhith Kami (Likki) as a passion project. It's built with modern, high-performance web technologies to ensure your privacy and safety." },
  { q: "What is the tech stack of LiveTalk?", a: "LiveTalk uses a professional 'Pro-Level' stack: TypeScript for reliable code, React 18 for the user interface, Vite for lightning-fast speeds, Tailwind CSS for the premium design, and Supabase / WebRTC for instant real-time messaging and video calls. This ensures a seamless, secure experience on any device." },
];

const COMPARISON = [
  { feature: "Anonymous Chat", LiveTalk: true, others: true },
  { feature: "No Registration", LiveTalk: true, others: false },
  { feature: "Video Calls", LiveTalk: true, others: true },
  { feature: "Text Formatting", LiveTalk: true, others: false },
  { feature: "Message Reactions", LiveTalk: true, others: false },
  { feature: "GIF Support", LiveTalk: true, others: false },
  { feature: "Built-in Games", LiveTalk: true, others: false },
  { feature: "Disappearing Messages", LiveTalk: true, others: false },
  { feature: "Interest Matching", LiveTalk: true, others: true },
  { feature: "Private Rooms", LiveTalk: true, others: false },
  { feature: "Chat Themes", LiveTalk: true, others: false },
  { feature: "No Ads", LiveTalk: true, others: false },
  { feature: "PWA Support", LiveTalk: true, others: false },
  { feature: "Dark Mode", LiveTalk: true, others: false },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

/* ─── EXPANDABLE SECTION ─── */
const ExpandableDetail = ({ details }: { details: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="ml-10 mt-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary font-medium transition-colors"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? "Show less" : "Learn more"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-1.5 pl-1 border-l-2 border-primary/20 ml-1">
              {details}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── COMPONENT ─── */

const InfoPage = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();
  useSEO({ title: "Help & FAQ – LiveTalk", description: "Everything about LiveTalk – features, how to use, safety tips, FAQ, and why LiveTalk is the best Omegle alternative." });

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
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
            Everything about <span className="text-primary">LiveTalk</span>
          </h1>
          <p className="text-muted-foreground text-base">
            The complete guide to every feature, how it works, and the technology behind it 🔧
          </p>
          <p className="text-sm text-muted-foreground/70 leading-relaxed">
            LiveTalk by Likki is a modern, feature-rich anonymous chat platform built for genuine human connections.
            Whether you want quick text chats, video calls, or fun games with strangers — this guide covers everything you need to know.
          </p>
        </motion.div>

        {/* ─── Table of Contents ─── */}
        <motion.nav {...fadeUp} transition={{ delay: 0.08 }} className="rounded-2xl bg-card border border-border/50 p-5 space-y-2">
          <p className="text-sm font-semibold text-foreground mb-3">📑 Jump to a section</p>
          {[
            { id: "what", label: "What is LiveTalk?" },
            { id: "howto", label: "How to use it" },
            { id: "features", label: "All features (detailed)" },
            { id: "comparison", label: "LiveTalk vs Others" },
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

        {/* ─── Section: What is LiveTalk ─── */}
        <motion.section id="what" {...fadeUp} transition={{ delay: 0.1 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            What is LiveTalk?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            LiveTalk is a free, open website where you can chat with random strangers from all over the world.
            No sign up, no account, no download — just open the page, tap a button, and you're instantly connected
            with a real person. When you're done, everything disappears forever. It's the modern successor to Omegle,
            built with better technology, more features, and a strong focus on your privacy and safety.
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
          <h2 className="text-lg font-semibold text-foreground">📱 How to use LiveTalk (step by step)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Follow these simple steps. It takes less than 10 seconds to start chatting! No technical knowledge required.
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
            Every feature in LiveTalk explained in detail — how it works for you, the technology powering it, and extra details when you tap "Learn more".
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
                  {item.details && <ExpandableDetail details={item.details} />}
                </motion.div>
              ))}
            </div>
          ))}
        </motion.section>

        {/* ─── Section: Comparison ─── */}
        <motion.section id="comparison" {...fadeUp} transition={{ delay: 0.22 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            LiveTalk vs Other Platforms
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            See how LiveTalk compares to other anonymous chat platforms. We built every feature you wished Omegle had.
          </p>
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="grid grid-cols-3 gap-0 text-center border-b border-border/30 bg-secondary/40 px-3 py-2.5">
              <span className="text-[11px] font-semibold text-foreground text-left">Feature</span>
              <span className="text-[11px] font-bold text-primary">LiveTalk</span>
              <span className="text-[11px] font-semibold text-muted-foreground">Others</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 gap-0 text-center px-3 py-2 ${i !== COMPARISON.length - 1 ? "border-b border-border/20" : ""}`}
              >
                <span className="text-[11px] text-foreground text-left">{row.feature}</span>
                <span className="text-[13px]">{row.LiveTalk ? "✅" : "❌"}</span>
                <span className="text-[13px]">{row.others ? "✅" : "❌"}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ─── Section: Tech Stack ─── */}
        <motion.section id="tech" {...fadeUp} transition={{ delay: 0.25 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Technology Stack
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The cutting-edge technologies used to build LiveTalk. Everything runs in your browser — no app download needed, no server processing your data.
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
            Customize your LiveTalk experience from the Settings page (tap the gear icon at the bottom navigation bar).
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
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your safety matters. Follow these guidelines to have a great experience on LiveTalk.
          </p>
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
          <p className="text-sm text-muted-foreground leading-relaxed">
            Power users can use these shortcuts on desktop for faster chatting.
          </p>
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
          <p className="text-sm text-muted-foreground leading-relaxed">
            Got questions? Here are answers to the most frequently asked questions about LiveTalk.
          </p>
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

        {/* ─── Section: Developer ─── */}
        <motion.section id="developer" {...fadeUp} transition={{ delay: 0.5 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground">👨‍💻 About the Developer</h2>
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/5 border border-primary/20 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl border-2 border-primary/30">
                👨‍💻
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Likhith Kami</h3>
                <p className="text-sm text-primary font-medium">Full Stack Developer & Designer</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              LiveTalk was envisioned and built by <strong>Likhith Kami</strong> (Likki) as a passion project to provide a modern, safe, and feature-rich alternative to legacy anonymous chat platforms.
              With a focus on privacy and user experience, Likhith utilized cutting-edge technologies like <strong>React, TypeScript, and WebRTC</strong> to create a seamless real-time environment.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="https://instagram.com/likhith_kami/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition-colors">
                <Smile className="h-3.5 w-3.5 text-primary" /> Instagram
              </a>
              <a href="https://linkedin.com/in/likhith-kami/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition-colors">
                <Users className="h-3.5 w-3.5 text-primary" /> LinkedIn
              </a>
            </div>
          </div>
        </motion.section>

        {/* ─── Safety CTA ─── */}
        <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="pt-4">
          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-4 text-center">
            <Shield className="h-10 w-10 text-primary mx-auto" />
            <h3 className="text-xl font-bold font-display">Your Safety is Our Priority</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Learn how to stay 100% protected while chatting anonymously. Visit our safety guide.
            </p>
            <button
              onClick={() => navigate("/safety")}
              className="inline-flex items-center gap-2 rounded-xl bg-secondary border border-border px-6 py-2.5 text-xs font-bold hover:bg-secondary/80 transition-all hover:scale-105"
            >
              <Shield className="h-3.5 w-3.5" />
              Visit Safety Center
            </button>
          </div>
        </motion.div>

        {/* ─── CTA ─── */}
        <motion.div {...fadeUp} transition={{ delay: 0.55 }} className="text-center space-y-3 py-6">
          <Sparkles className="h-6 w-6 text-primary mx-auto" />
          <p className="text-foreground font-semibold text-lg">Ready to meet someone new?</p>
          <p className="text-muted-foreground text-sm">It takes 3 seconds. No signup. Seriously.</p>
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
            Developed by Likhith · © 2026 LiveTalk by Likki
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default InfoPage;
