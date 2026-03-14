import { motion } from "framer-motion";
import { ShieldCheck, Heart, UserX, MessageSquare, AlertCircle, CheckCircle2, HandMetal } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 260, damping: 20 }
};

const GUIDELINES = [
  {
    icon: Heart,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    title: "Be Kind & Respectful",
    desc: "Treat every stranger with the same respect you'd want. Harassment, hate speech, and bullying are strictly prohibited."
  },
  {
    icon: UserX,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "No NSFW Content",
    desc: "Keep it clean. Sharing obscene, pornographic, or sexually explicit content will result in an immediate permanent ban."
  },
  {
    icon: ShieldCheck,
    color: "text-green-500",
    bg: "bg-green-500/10",
    title: "Protect Your Privacy",
    desc: "Never share your real name, address, phone number, or passwords. Stay anonymous to stay safe."
  },
  {
    icon: MessageSquare,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    title: "Report Bad Actors",
    desc: "If you encounter someone breaking these rules, use the report button immediately. Our system relies on community moderation."
  }
];

const GuidelinesPage = () => {
  const onlineCount = useOnlineCount();
  useSEO({
    title: "Community Guidelines – LiveTalk",
    description: "Read our rules for a safe and respectful chatting experience on LiveTalk.",
    keywords: "chat rules, community safety, LiveTalk guidelines, safe chatting"
  });

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[5%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="lg:hidden">
        <Header onlineCount={onlineCount} />
      </div>

      <main className="flex-1 px-6 py-12 pb-32 max-w-3xl mx-auto w-full">
        <motion.div {...fadeUp} className="text-center mb-16 space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 text-primary mb-2 shadow-inner">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground">
            Community <span className="text-gradient">Guidelines</span>
          </h1>
          <p className="text-muted-foreground text-lg font-medium max-w-xl mx-auto leading-relaxed">
            LiveTalk is built on freedom and anonymity, but safety and respect are our highest priorities.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {GUIDELINES.map((rule, i) => (rule &&
            <motion.div
              key={rule.title}
              {...fadeUp}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="p-8 rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-6", rule.bg)}>
                <rule.icon className={cn("h-6 w-6", rule.color)} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{rule.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {rule.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div 
           {...fadeUp}
           transition={{ delay: 0.4 }}
           className="relative p-10 rounded-[3rem] border border-primary/20 bg-primary/5 overflow-hidden"
        >
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-primary/10 blur-3xl rounded-full" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <AlertCircle className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Zero Tolerance Policy</h2>
              </div>
              <p className="text-muted-foreground font-medium leading-relaxed">
                Breaking these rules results in an instant ban. We use automated filters and human reports to keep LiveTalk a safe space for everyone to connect.
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <CheckCircle2 className="h-3 w-3 text-online" /> 18+ Only
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <CheckCircle2 className="h-3 w-3 text-online" /> Anonymous
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <CheckCircle2 className="h-3 w-3 text-online" /> Encrypted
                </div>
              </div>
            </div>
            
            <motion.div 
               whileHover={{ scale: 1.05, rotate: 5 }}
               className="h-32 w-32 rounded-full border-4 border-primary/20 bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] shrink-0"
            >
              <HandMetal className="h-12 w-12" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          {...fadeUp}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Link 
            to="/chat" 
            className="inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-8 py-4 text-sm font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            I Understand, Let's Chat
          </Link>
          <p className="mt-6 text-xs text-muted-foreground/60 font-medium">
             By using LiveTalk, you agree to follow these guidelines.
          </p>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default GuidelinesPage;
