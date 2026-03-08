import {
  ArrowLeft, MessageSquare, Shield, Zap, Users, EyeOff, Trash2, Globe, Heart,
  HelpCircle, Smile, Type, Video, Bell, BellOff, Moon, Sun, Lock, Share2,
  AlertTriangle, Ban, Flag, Keyboard, SmartphoneNfc, Wifi, Clock, Sparkles,
  Image, Send, SkipForward, UserPlus, Volume2, VolumeX
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
  { step: "2", title: "Tap \"Start Chatting\"", desc: "Hit the big button on the home page. We'll start looking for someone to connect you with." },
  { step: "3", title: "Wait a moment", desc: "Usually takes just a few seconds. You'll see a \"Searching...\" message while we find someone." },
  { step: "4", title: "Say hello! 👋", desc: "Once connected, type your message in the box at the bottom and tap Send." },
  { step: "5", title: "Keep chatting or move on", desc: "Enjoying the conversation? Great! Want someone new? Tap \"Next\" anytime." },
  { step: "6", title: "Done? Just leave", desc: "Close the page or tap Stop. Everything disappears automatically." },
];

const FEATURES = [
  { icon: Smile, title: "Emoji Picker 😊", desc: "Tap the smiley face icon next to the message box. Browse categories like Smileys, Hearts, Animals, and more. Tap any emoji to add it to your message." },
  { icon: Type, title: "Text Formatting", desc: "Make text **bold** by wrapping it in double stars (**like this**). Make text *italic* with single stars (*like this*). Links you type are automatically clickable!" },
  { icon: Heart, title: "Swipe to React ❤️", desc: "On your phone, swipe right on any stranger's message to send a ❤️ reaction. It's a quick way to show you liked what they said!" },
  { icon: Globe, title: "Interest Matching", desc: "Before starting a chat, add topics you like (music, gaming, movies, etc.). We'll try to match you with someone who shares your interests!" },
  { icon: Users, title: "Private Rooms 🔒", desc: "Want to chat with a specific friend? Create a private room — you'll get a 6-letter code. Share the code with your friend and they can join your room directly." },
  { icon: Image, title: "Send Images 📷", desc: "Tap the camera/image icon to send a picture. You can share photos, screenshots, memes — anything visual!" },
  { icon: Video, title: "Video Calls 📹", desc: "Once connected to someone, you can start a video call! Both people need to agree before the call starts. Your camera and mic are only on when you allow it." },
  { icon: SkipForward, title: "Next Button", desc: "Not vibing with this person? Just tap \"Next\" — you'll immediately be connected to someone new. No awkward goodbyes needed." },
];

const SETTINGS_INFO = [
  { icon: Moon, title: "Dark Mode 🌙", desc: "Switch between light and dark mode. Dark mode is easier on your eyes at night and looks cool!" },
  { icon: Volume2, title: "Sound Effects 🔊", desc: "Turn on/off the little sounds that play when you send a message, receive a message, or get connected. Nice for knowing what's happening without looking." },
  { icon: Bell, title: "Notifications 🔔", desc: "Get a notification when someone messages you, even if you're on another tab. Great so you don't miss any messages!" },
  { icon: Zap, title: "Auto-Reconnect ⚡", desc: "When a stranger disconnects, we can automatically find you a new person. No need to tap anything — it just keeps going!" },
];

const SAFETY = [
  { icon: Flag, title: "Report someone", desc: "If someone is being rude or inappropriate, tap the three-dot menu (⋯) and hit \"Report\". We take reports seriously." },
  { icon: Ban, title: "Block someone", desc: "Don't want to see messages from that person again? Block them. They won't be able to match with you anymore." },
  { icon: EyeOff, title: "Stay anonymous", desc: "Never share your real name, phone number, address, or social media. Stay safe by keeping things anonymous." },
  { icon: AlertTriangle, title: "Trust your gut", desc: "If something feels wrong, just leave. You can disconnect anytime. Your safety comes first — always." },
  { icon: Lock, title: "No data stored", desc: "We don't keep any chat logs, personal data, or IP addresses. When you leave, it's like you were never there." },
];

const KEYBOARD_SHORTCUTS = [
  { keys: "Enter", desc: "Send your message" },
  { keys: "Shift + Enter", desc: "Add a new line (without sending)" },
  { keys: "Esc", desc: "Close popups and dialogs" },
];

const FAQ = [
  { q: "Is it really free?", a: "Yes! 100% free. No hidden fees, no premium plans, no subscriptions. Everything you see is completely free to use." },
  { q: "Do I need to create an account?", a: "Nope! No email, no password, no phone number. Just open the website and start chatting. It's that simple." },
  { q: "Can people see who I am?", a: "No. You are completely anonymous. We don't collect your name, location, or any personal information. The stranger only sees your messages." },
  { q: "Are my messages saved anywhere?", a: "Never. Messages exist only while you're in the chat. The moment either person leaves, everything is permanently deleted. We can't recover them even if we wanted to." },
  { q: "Is it safe for kids?", a: "L Chat is designed for people 18 and older. We recommend parental guidance for younger users. You can always report or block inappropriate behavior." },
  { q: "Can I use it on my phone?", a: "Absolutely! It works perfectly on any phone, tablet, or computer. Just open the website in your browser — no app download needed." },
  { q: "What if someone is being mean?", a: "You have full control. You can: 1) Tap \"Next\" to instantly find someone new, 2) Block them so they can never match with you again, or 3) Report them using the menu." },
  { q: "How does interest matching work?", a: "Before chatting, you can add topics you like (gaming, music, cooking, etc.). We'll try to connect you with people who share those interests. If no match is found, you'll still connect with someone random." },
  { q: "What's a private room?", a: "A private room lets you chat with a specific person. You create a room and get a 6-letter code (like \"ABC123\"). Share that code with your friend, they enter it, and you're connected privately!" },
  { q: "Can I send pictures?", a: "Yes! Tap the image icon next to the message box to share photos, screenshots, or any image." },
  { q: "How do video calls work?", a: "Once you're connected to someone, you can request a video call. The other person has to accept before the call starts. You control your camera and microphone at all times." },
  { q: "Why did the stranger disconnect?", a: "People can leave anytime — just like you can. Don't take it personally! Just tap \"Next\" or wait for auto-reconnect to find someone new." },
  { q: "What does the \"online\" counter show?", a: "It shows how many people are currently on the website. More people online = faster matching!" },
  { q: "Does it work without internet?", a: "No, you need an internet connection to chat. It works on Wi-Fi, mobile data (4G/5G), or any internet connection." },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

/* ─── COMPONENT ─── */

const InfoPage = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();

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
            A super simple guide — no tech talk, we promise! 🤞
          </p>
        </motion.div>

        {/* ─── Table of Contents ─── */}
        <motion.nav {...fadeUp} transition={{ delay: 0.08 }} className="rounded-2xl bg-card border border-border/50 p-5 space-y-2">
          <p className="text-sm font-semibold text-foreground mb-3">📑 Jump to a section</p>
          {[
            { id: "what", label: "What is L Chat?" },
            { id: "howto", label: "How to use it" },
            { id: "features", label: "All features explained" },
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

        {/* ─── Section: What is Echo ─── */}
        <motion.section id="what" {...fadeUp} transition={{ delay: 0.1 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            What is Echo?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Echo is a free website where you can chat with random strangers from all over the world. 
            You don't need to sign up, create an account, or give us any information at all. 
            Just open the page, tap a button, and you're instantly connected with someone new.
            When you're done, everything disappears — like it never happened.
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

        {/* ─── Section: All features ─── */}
        <motion.section id="features" {...fadeUp} transition={{ delay: 0.2 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground">✨ All features explained</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Here's everything you can do on Echo, explained in plain English.
          </p>
          <div className="space-y-3">
            {FEATURES.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="rounded-2xl bg-card border border-border/50 p-4 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-accent/10 p-2 shrink-0">
                    <item.icon className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-10">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── Section: Settings ─── */}
        <motion.section id="settings" {...fadeUp} transition={{ delay: 0.25 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground">⚙️ Settings & preferences</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You can customize Echo to work the way you like. Find these in the Settings page (tap the gear icon at the bottom).
          </p>
          <div className="grid gap-3">
            {SETTINGS_INFO.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
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
        <motion.section id="safety" {...fadeUp} transition={{ delay: 0.3 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground">🛡️ Safety tips</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your safety is our #1 priority. Here's how to stay safe while chatting with strangers.
          </p>
          <div className="space-y-3">
            {SAFETY.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
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
        <motion.section id="shortcuts" {...fadeUp} transition={{ delay: 0.35 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard shortcuts (for computers)
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
        <motion.section id="faq" {...fadeUp} transition={{ delay: 0.4 }} className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground">❓ Common questions</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Got a question? Chances are someone else already asked it. Here are the answers!
          </p>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.04 }}
                className="rounded-xl bg-card border border-border/50 p-4 space-y-1.5"
              >
                <p className="text-sm font-semibold text-foreground">{item.q}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── Section: Fun facts ─── */}
        <motion.section {...fadeUp} transition={{ delay: 0.5 }} className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">🎉 Fun facts about Echo</h2>
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 p-5 space-y-3">
            {[
              "🚀 Echo connects you in under 5 seconds (usually!)",
              "🌍 People from all around the world use Echo every day",
              "💬 You can send emojis, images, and even make video calls",
              "🔒 Zero data is stored — we literally can't read your chats",
              "📱 Works on any device with a web browser",
              "🎨 You can switch to dark mode for late-night chatting",
              "⚡ Messages appear in real-time — no refreshing needed",
            ].map((fact, i) => (
              <p key={i} className="text-xs text-foreground/80 leading-relaxed">{fact}</p>
            ))}
          </div>
        </motion.section>

        {/* ─── CTA ─── */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.55 }}
          className="text-center space-y-3 py-6"
        >
          <Sparkles className="h-6 w-6 text-primary mx-auto" />
          <p className="text-foreground font-semibold">Ready to meet someone new?</p>
          <p className="text-muted-foreground text-xs">It takes 3 seconds. Seriously.</p>
          <button
            onClick={() => navigate("/chat")}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-3 font-semibold text-sm shadow-[0_0_30px_hsl(265_90%_60%/0.4)] hover:shadow-[0_0_40px_hsl(265_90%_60%/0.6)] transition-shadow"
          >
            <MessageSquare className="h-4 w-4" />
            Start Chatting Now
          </button>
        </motion.div>

        {/* Footer note */}
        <div className="text-center pb-4">
          <p className="text-[11px] text-muted-foreground/50">
            Made with ❤️ by Echo Labs · © 2026
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default InfoPage;
