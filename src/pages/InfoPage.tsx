import { ArrowLeft, MessageSquare, Shield, Zap, Users, Eye, EyeOff, Trash2, Globe, Heart, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";

const WHAT_IS = [
  { icon: MessageSquare, title: "Chat with strangers", desc: "Talk to random people from around the world — no signup needed." },
  { icon: EyeOff, title: "100% Anonymous", desc: "We don't ask for your name, email, or anything. You're invisible." },
  { icon: Trash2, title: "Chats disappear", desc: "When you leave a chat, it's gone forever. Nothing is saved." },
  { icon: Shield, title: "Safe & encrypted", desc: "Your messages are protected. No one else can read them." },
];

const HOW_TO = [
  { step: "1", title: "Open the app", desc: "Just visit the website — that's it! No downloads needed." },
  { step: "2", title: "Tap \"Start Chatting\"", desc: "We'll connect you with a random person instantly." },
  { step: "3", title: "Say hello 👋", desc: "Type your message and hit send. It's that simple!" },
  { step: "4", title: "Want someone new?", desc: "Tap \"Next\" anytime to meet a different person." },
];

const COOL_STUFF = [
  { icon: Zap, title: "Emoji picker", desc: "Tap the smiley face to add fun emojis to your messages." },
  { icon: Heart, title: "React with swipe", desc: "On mobile, swipe right on a message to send a ❤️." },
  { icon: Globe, title: "Interest matching", desc: "Add topics you like and get matched with similar people." },
  { icon: Users, title: "Private rooms", desc: "Create a secret room code and share it with a friend to chat privately." },
];

const FAQ = [
  { q: "Is it really free?", a: "Yes! 100% free. No hidden fees, no premium plans." },
  { q: "Do I need to sign up?", a: "Nope! Just open the app and start chatting right away." },
  { q: "Can people see who I am?", a: "No. You're completely anonymous. We don't collect any personal info." },
  { q: "Are my messages saved?", a: "Never. Once you leave the chat, everything is deleted permanently." },
  { q: "Is it safe?", a: "Yes. We use encryption and you can report or block anyone instantly." },
  { q: "Can I use it on my phone?", a: "Absolutely! It works great on any phone, tablet, or computer." },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const InfoPage = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onlineCount={onlineCount} />

      <main className="flex-1 px-5 pb-28 pt-6 max-w-lg mx-auto w-full space-y-10">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>

        {/* Page Title */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
            Everything about <span className="text-primary">Echo</span>
          </h1>
          <p className="text-muted-foreground text-base">
            Simple answers to all your questions. No tech talk — promise! 🤞
          </p>
        </motion.div>

        {/* What is Echo */}
        <motion.section {...fadeUp} transition={{ delay: 0.1 }} className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            What is this?
          </h2>
          <div className="grid gap-3">
            {WHAT_IS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
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

        {/* How to use */}
        <motion.section {...fadeUp} transition={{ delay: 0.2 }} className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">📱 How to use it</h2>
          <div className="space-y-2">
            {HOW_TO.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
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

        {/* Cool features */}
        <motion.section {...fadeUp} transition={{ delay: 0.3 }} className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">✨ Cool things you can do</h2>
          <div className="grid grid-cols-2 gap-3">
            {COOL_STUFF.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className="flex flex-col items-center text-center gap-2 rounded-2xl bg-card border border-border/50 p-4"
              >
                <div className="rounded-xl bg-accent/10 p-2.5">
                  <item.icon className="h-5 w-5 text-accent" />
                </div>
                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section {...fadeUp} transition={{ delay: 0.4 }} className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">❓ Common questions</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
                className="rounded-xl bg-card border border-border/50 p-4 space-y-1.5"
              >
                <p className="text-sm font-semibold text-foreground">{item.q}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.5 }}
          className="text-center space-y-3 py-4"
        >
          <p className="text-muted-foreground text-sm">Ready to start?</p>
          <button
            onClick={() => navigate("/chat")}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-3 font-semibold text-sm shadow-[0_0_30px_hsl(265_90%_60%/0.4)] hover:shadow-[0_0_40px_hsl(265_90%_60%/0.6)] transition-shadow"
          >
            <MessageSquare className="h-4 w-4" />
            Start Chatting Now
          </button>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default InfoPage;
